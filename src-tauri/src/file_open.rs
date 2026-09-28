use std::path::Path;

// Types de fichiers que l'app peut ouvrir avec le programme par defaut de l'OS.
// Liste blanche : tout le reste (executables, scripts, raccourcis, images disque
// comme .iso...) peut lancer du code et n'est accessible que via "Ouvrir le
// dossier". Les fichiers ecrits par download_to_dir ne portent pas la marque
// "venu d'Internet" : SmartScreen et Gatekeeper ne protegeraient pas l'utilisateur.
const OPENABLE_EXTS: &[&str] = &[
    // Video
    "3g2", "3gp", "3gp2", "3gpp", "amv", "asf", "avi", "bik", "crf", "dav", "divx", "drc", "dv",
    "dvr-ms", "evo", "f4v", "flv", "gvi", "gxf", "h264", "h265", "hevc", "ifo", "m1v", "m2p",
    "m2t", "m2ts", "m2v", "m4v", "mk3d", "mkv", "mod", "mov", "mp2v", "mp4", "mp4v", "mpe",
    "mpeg", "mpeg1", "mpeg2", "mpeg4", "mpg", "mpv", "mpv2", "mts", "mtv", "mxf", "mxg", "nsv",
    "nut", "nuv", "ogm", "ogv", "ogx", "qt", "rec", "rm", "rmvb", "rpl", "thp", "tod", "tp",
    "trp", "ts", "tts", "vob", "vro", "webm", "wm", "wmv", "wtv", "xesc", "y4m",
    // Audio
    "aac", "ac3", "aif", "aiff", "ape", "dts", "eac3", "flac", "m4a", "m4b", "mka", "mp2", "mp3",
    "mpc", "oga", "ogg", "opus", "tta", "wav", "wma", "wv",
    // Sous-titres
    "ass", "idx", "smi", "srt", "ssa", "sub", "sup", "vtt",
    // Lecture
    "azw3", "cb7", "cbr", "cbt", "cbz", "djvu", "epub", "mobi", "pdf",
    // Images
    "avif", "bmp", "gif", "jpeg", "jpg", "png", "webp",
    // Texte
    "nfo", "txt",
    // Archives
    "7z", "rar", "zip",
];

fn is_openable(path: &Path) -> bool {
    path.extension()
        .and_then(|e| e.to_str())
        .is_some_and(|e| OPENABLE_EXTS.contains(&e.to_ascii_lowercase().as_str()))
}

// Ouvre un fichier local avec l'application par defaut du systeme.
#[tauri::command]
pub fn open_file(path: String) -> Result<(), String> {
    if !is_openable(Path::new(&path)) {
        return Err(
            "Par sécurité, ce type de fichier ne s'ouvre pas depuis l'application. Utilisez \"Ouvrir le dossier\"."
                .to_string(),
        );
    }
    tauri_plugin_opener::open_path(&path, None::<&str>).map_err(|e| e.to_string())
}

// Permet au front de ne proposer "Ouvrir" que si open_file l'acceptera.
#[tauri::command]
pub fn can_open_file(path: String) -> bool {
    is_openable(Path::new(&path))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn media_and_reading_files_are_openable() {
        assert!(is_openable(Path::new("/dl/Film.2024.1080p.mkv")));
        assert!(is_openable(Path::new("/dl/Film.MP4")));
        assert!(is_openable(Path::new("/dl/Episode.m2ts")));
        assert!(is_openable(Path::new("/dl/Film.fr.srt")));
        assert!(is_openable(Path::new("/dl/One Piece T01.cbz")));
    }

    #[test]
    fn executables_are_not_openable() {
        for name in [
            "setup.exe",
            "Film.2024.1080p.mkv.exe",
            "codec.msi",
            "run.bat",
            "run.cmd",
            "script.ps1",
            "script.vbs",
            "raccourci.lnk",
            "ecran.scr",
            "Lecteur.app",
            "lancer.command",
            "installeur.pkg",
            "image.dmg",
            "disque.iso",
        ] {
            assert!(!is_openable(Path::new(name)), "{name}");
        }
    }

    #[test]
    fn files_without_extension_are_not_openable() {
        assert!(!is_openable(Path::new("/dl/README")));
        assert!(!is_openable(Path::new("/dl/.mkv")));
    }
}
