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
// Sous Linux, seuls les tests appellent cette fonction.
#[cfg_attr(
    not(any(target_os = "windows", target_os = "macos")),
    allow(dead_code)
)]
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

#[cfg(target_os = "windows")]
fn windows_candidates() -> Vec<PathBuf> {
    use winreg::enums::{HKEY_CURRENT_USER, HKEY_LOCAL_MACHINE};
    use winreg::RegKey;

    let mut out: Vec<PathBuf> = Vec::new();

    // 1. Registre : l'installeur VLC y ecrit son repertoire reel, quel que soit le disque.
    let install_dirs = [
        (HKEY_LOCAL_MACHINE, r"SOFTWARE\VideoLAN\VLC"),
        (HKEY_LOCAL_MACHINE, r"SOFTWARE\WOW6432Node\VideoLAN\VLC"),
        (HKEY_CURRENT_USER, r"SOFTWARE\VideoLAN\VLC"),
    ];
    for (hive, path) in install_dirs {
        if let Ok(key) = RegKey::predef(hive).open_subkey(path) {
            if let Ok(dir) = key.get_value::<String, _>("InstallDir") {
                out.push(PathBuf::from(dir).join("vlc.exe"));
            }
        }
    }
    if let Ok(key) = RegKey::predef(HKEY_LOCAL_MACHINE)
        .open_subkey(r"SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\vlc.exe")
    {
        if let Ok(exe) = key.get_value::<String, _>("") {
            out.push(PathBuf::from(exe));
        }
    }

    // 2. PATH.
    if let Some(paths) = std::env::var_os("PATH") {
        out.extend(std::env::split_paths(&paths).map(|p| p.join("vlc.exe")));
    }

    // 3. Emplacements connus.
    for var in ["ProgramFiles", "ProgramFiles(x86)"] {
        if let Some(dir) = std::env::var_os(var) {
            out.push(PathBuf::from(dir).join(r"VideoLAN\VLC\vlc.exe"));
        }
    }
    if let Some(dir) = std::env::var_os("LOCALAPPDATA") {
        out.push(PathBuf::from(dir).join(r"Programs\VideoLAN\VLC\vlc.exe"));
    }

    out
}

#[cfg(target_os = "windows")]
fn resolve_vlc(configured: Option<&str>) -> Result<PathBuf, PlayerError> {
    pick_vlc(configured, &windows_candidates(), &|p: &Path| p.exists())
}

#[cfg(target_os = "macos")]
fn macos_candidates() -> Vec<PathBuf> {
    let mut out = vec![PathBuf::from("/Applications/VLC.app")];
    if let Some(home) = std::env::var_os("HOME") {
        out.push(PathBuf::from(home).join("Applications/VLC.app"));
    }
    // Installe ailleurs : Spotlight retrouve le bundle sur n'importe quel disque.
    if let Ok(output) = std::process::Command::new("mdfind")
        .arg("kMDItemCFBundleIdentifier == 'org.videolan.vlc'")
        .output()
    {
        out.extend(
            String::from_utf8_lossy(&output.stdout)
                .lines()
                .filter(|l| !l.trim().is_empty())
                .map(PathBuf::from),
        );
    }
    out
}

// `open -a VLC` reussit toujours du point de vue du processus fils : il faut
// verifier soi-meme que le bundle existe, sinon l'echec est silencieux.
#[cfg(target_os = "macos")]
fn resolve_vlc(configured: Option<&str>) -> Result<PathBuf, PlayerError> {
    pick_vlc(configured, &macos_candidates(), &|p: &Path| p.exists())
}

// Linux passe par le PATH. Aucun chemin a resoudre en amont.
#[cfg(not(any(target_os = "windows", target_os = "macos")))]
fn resolve_vlc(_configured: Option<&str>) -> Result<PathBuf, PlayerError> {
    Ok(PathBuf::from("vlc"))
}

fn spawn_vlc(urls: &[String], configured: Option<&str>) -> Result<(), PlayerError> {
    let launch = |mut cmd: std::process::Command| -> Result<(), PlayerError> {
        cmd.spawn()
            .map(|_| ())
            .map_err(|e| PlayerError::LaunchFailed {
                message: e.to_string(),
            })
    };

    #[cfg(target_os = "macos")]
    {
        let vlc = resolve_vlc(configured)?;
        let mut cmd = std::process::Command::new("open");
        cmd.arg("-a").arg(vlc).args(urls);
        return launch(cmd);
    }

    #[cfg(not(target_os = "macos"))]
    {
        let vlc = resolve_vlc(configured)?;
        let mut cmd = std::process::Command::new(vlc);
        cmd.args(urls);
        launch(cmd)
    }
}

#[tauri::command]
pub fn open_with_vlc(url: String, vlc_path: Option<String>) -> Result<(), PlayerError> {
    spawn_vlc(&[url], vlc_path.as_deref())
}

#[tauri::command]
pub fn open_many_with_vlc(urls: Vec<String>, vlc_path: Option<String>) -> Result<(), PlayerError> {
    if urls.is_empty() {
        return Err(PlayerError::LaunchFailed {
            message: "Aucun lien a lire".into(),
        });
    }
    spawn_vlc(&urls, vlc_path.as_deref())
}

#[tauri::command]
pub fn detect_vlc(vlc_path: Option<String>) -> Result<String, PlayerError> {
    Ok(resolve_vlc(vlc_path.as_deref())?
        .to_string_lossy()
        .into_owned())
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
