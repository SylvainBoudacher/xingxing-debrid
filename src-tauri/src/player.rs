use std::path::{Path, PathBuf};

#[derive(Debug, serde::Serialize)]
#[serde(tag = "kind", rename_all = "camelCase")]
pub enum PlayerError {
    NotFound,
    ConfiguredPathMissing { path: String },
    LaunchFailed { message: String },
}

// Priorite : le chemin configure par l'utilisateur prime et ne retombe jamais
// sur la detection automatique, sinon on lancerait un autre binaire sans le dire.
// Hors Windows, seuls les tests appellent cette fonction.
#[cfg_attr(not(target_os = "windows"), allow(dead_code))]
fn pick_vlc(
    configured: Option<&str>,
    candidates: &[PathBuf],
    exists: &dyn Fn(&Path) -> bool,
) -> Result<PathBuf, PlayerError> {
    if let Some(path) = configured.map(str::trim).filter(|p| !p.is_empty()) {
        let candidate = PathBuf::from(path);
        if exists(&candidate) {
            return Ok(candidate);
        }
        return Err(PlayerError::ConfiguredPathMissing {
            path: path.to_string(),
        });
    }

    candidates
        .iter()
        .find(|p| exists(p))
        .cloned()
        .ok_or(PlayerError::NotFound)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::path::{Path, PathBuf};

    fn exists_only(known: &'static [&'static str]) -> impl Fn(&Path) -> bool {
        move |p: &Path| known.iter().any(|k| Path::new(k) == p)
    }

    #[test]
    fn configured_path_wins_over_candidates() {
        let candidates = vec![PathBuf::from("/auto/vlc")];
        let exists = exists_only(&["/perso/vlc", "/auto/vlc"]);
        let found = pick_vlc(Some("/perso/vlc"), &candidates, &exists).unwrap();
        assert_eq!(found, PathBuf::from("/perso/vlc"));
    }

    #[test]
    fn missing_configured_path_does_not_fall_back() {
        let candidates = vec![PathBuf::from("/auto/vlc")];
        let exists = exists_only(&["/auto/vlc"]);
        let err = pick_vlc(Some("/perso/vlc"), &candidates, &exists).unwrap_err();
        assert!(matches!(err, PlayerError::ConfiguredPathMissing { path } if path == "/perso/vlc"));
    }

    #[test]
    fn blank_configured_path_is_ignored() {
        let candidates = vec![PathBuf::from("/auto/vlc")];
        let exists = exists_only(&["/auto/vlc"]);
        let found = pick_vlc(Some("   "), &candidates, &exists).unwrap();
        assert_eq!(found, PathBuf::from("/auto/vlc"));
    }

    #[test]
    fn first_existing_candidate_wins() {
        let candidates = vec![
            PathBuf::from("/absent/vlc"),
            PathBuf::from("/present/vlc"),
            PathBuf::from("/autre/vlc"),
        ];
        let exists = exists_only(&["/present/vlc", "/autre/vlc"]);
        let found = pick_vlc(None, &candidates, &exists).unwrap();
        assert_eq!(found, PathBuf::from("/present/vlc"));
    }

    #[test]
    fn no_candidate_gives_not_found() {
        let exists = exists_only(&[]);
        let err = pick_vlc(None, &[], &exists).unwrap_err();
        assert!(matches!(err, PlayerError::NotFound));
    }
}
