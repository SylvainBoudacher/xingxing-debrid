use std::cmp::Ordering;
use std::fs::File;
use std::io::Read;
use std::path::Path;
use tauri::ipc::Response;

#[derive(Debug, serde::Serialize)]
#[serde(tag = "kind", rename_all = "camelCase")]
pub enum CbzError {
    FileMissing { path: String },
    NotAnArchive { message: String },
    NoPages,
    PageOutOfRange { index: usize, count: usize },
    ReadFailed { message: String },
}

const IMAGE_EXTS: [&str; 6] = ["jpg", "jpeg", "png", "webp", "gif", "avif"];

fn is_image_entry(name: &str) -> bool {
    if name.ends_with('/') || name.starts_with("__MACOSX/") {
        return false;
    }
    // Les ressources AppleDouble ("._page01.jpg") accompagnent les archives
    // creees sur macOS et ne sont pas des images.
    let file = name.rsplit('/').next().unwrap_or(name);
    if file.starts_with("._") || file.starts_with('.') {
        return false;
    }
    let ext = match file.rsplit_once('.') {
        Some((_, ext)) => ext.to_ascii_lowercase(),
        None => return false,
    };
    IMAGE_EXTS.contains(&ext.as_str())
}

// Tri naturel : "page2" avant "page10". Compare segment par segment, les suites
// de chiffres etant comparees par valeur et le reste sans tenir compte de la casse.
fn natural_cmp(a: &str, b: &str) -> Ordering {
    let mut ai = a.chars().peekable();
    let mut bi = b.chars().peekable();
    loop {
        match (ai.peek().copied(), bi.peek().copied()) {
            (None, None) => return Ordering::Equal,
            (None, Some(_)) => return Ordering::Less,
            (Some(_), None) => return Ordering::Greater,
            (Some(ac), Some(bc)) => {
                if ac.is_ascii_digit() && bc.is_ascii_digit() {
                    let an = take_number(&mut ai);
                    let bn = take_number(&mut bi);
                    match an.cmp(&bn) {
                        Ordering::Equal => continue,
                        other => return other,
                    }
                }
                let ord = ac.to_ascii_lowercase().cmp(&bc.to_ascii_lowercase());
                if ord != Ordering::Equal {
                    return ord;
                }
                ai.next();
                bi.next();
            }
        }
    }
}

fn take_number(it: &mut std::iter::Peekable<std::str::Chars>) -> u64 {
    let mut n: u64 = 0;
    while let Some(c) = it.peek().copied() {
        if !c.is_ascii_digit() {
            break;
        }
        // Sature au lieu de deborder : un nombre absurdement long dans un nom
        // de fichier ne doit pas paniquer.
        n = n.saturating_mul(10).saturating_add(c as u64 - '0' as u64);
        it.next();
    }
    n
}

fn sorted_pages(archive: &mut zip::ZipArchive<File>) -> Vec<String> {
    let mut names: Vec<String> = (0..archive.len())
        .filter_map(|i| archive.by_index(i).ok().map(|e| e.name().to_string()))
        .filter(|n| is_image_entry(n))
        .collect();
    names.sort_by(|a, b| natural_cmp(a, b));
    names
}

fn open(path: &str) -> Result<zip::ZipArchive<File>, CbzError> {
    if !Path::new(path).is_file() {
        return Err(CbzError::FileMissing {
            path: path.to_string(),
        });
    }
    let file = File::open(path).map_err(|e| CbzError::ReadFailed {
        message: e.to_string(),
    })?;
    zip::ZipArchive::new(file).map_err(|e| CbzError::NotAnArchive {
        message: e.to_string(),
    })
}

/// Noms des pages du CBZ, triees dans l'ordre de lecture. L'index d'une page
/// dans ce tableau est celui attendu par `cbz_page`.
#[tauri::command]
pub fn cbz_list_pages(path: String) -> Result<Vec<String>, CbzError> {
    let mut archive = open(&path)?;
    let pages = sorted_pages(&mut archive);
    if pages.is_empty() {
        return Err(CbzError::NoPages);
    }
    Ok(pages)
}

fn read_page(path: &str, index: usize) -> Result<Vec<u8>, CbzError> {
    let mut archive = open(path)?;
    let pages = sorted_pages(&mut archive);
    if pages.is_empty() {
        return Err(CbzError::NoPages);
    }
    let name = pages.get(index).ok_or(CbzError::PageOutOfRange {
        index,
        count: pages.len(),
    })?;
    let mut entry = archive.by_name(name).map_err(|e| CbzError::ReadFailed {
        message: e.to_string(),
    })?;
    let mut buf = Vec::with_capacity(entry.size() as usize);
    entry
        .read_to_end(&mut buf)
        .map_err(|e| CbzError::ReadFailed {
            message: e.to_string(),
        })?;
    Ok(buf)
}

/// Octets bruts d'une page. Passe par `Response` plutot que par un Vec<u8>
/// serialise : evite l'encodage base64 sur des images de plusieurs Mo.
#[tauri::command]
pub fn cbz_page(path: String, index: usize) -> Result<Response, CbzError> {
    read_page(&path, index).map(Response::new)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn keeps_only_image_entries() {
        assert!(is_image_entry("page01.jpg"));
        assert!(is_image_entry("Tome 01/page01.PNG"));
        assert!(is_image_entry("scan.webp"));
        assert!(!is_image_entry("Tome 01/"));
        assert!(!is_image_entry("__MACOSX/page01.jpg"));
        assert!(!is_image_entry("Tome 01/._page01.jpg"));
        assert!(!is_image_entry("ComicInfo.xml"));
        assert!(!is_image_entry("readme"));
    }

    #[test]
    fn sorts_numbers_by_value() {
        let mut names = vec!["page10.jpg", "page2.jpg", "page1.jpg"];
        names.sort_by(|a, b| natural_cmp(a, b));
        assert_eq!(names, vec!["page1.jpg", "page2.jpg", "page10.jpg"]);
    }

    #[test]
    fn sorts_zero_padded_and_plain_alike() {
        let mut names = vec!["p003.jpg", "p1.jpg", "p20.jpg"];
        names.sort_by(|a, b| natural_cmp(a, b));
        assert_eq!(names, vec!["p1.jpg", "p003.jpg", "p20.jpg"]);
    }

    #[test]
    fn sorts_directories_before_their_numbers() {
        let mut names = vec!["Tome 2/p1.jpg", "Tome 10/p1.jpg", "Tome 2/p10.jpg"];
        names.sort_by(|a, b| natural_cmp(a, b));
        assert_eq!(
            names,
            vec!["Tome 2/p1.jpg", "Tome 2/p10.jpg", "Tome 10/p1.jpg"]
        );
    }

    #[test]
    fn compares_case_insensitively() {
        assert_eq!(natural_cmp("Page1.jpg", "page1.jpg"), Ordering::Equal);
        assert_eq!(natural_cmp("a.jpg", "B.jpg"), Ordering::Less);
    }

    #[test]
    fn missing_file_is_reported() {
        let err = cbz_list_pages("/nowhere/nope.cbz".to_string()).unwrap_err();
        assert!(matches!(err, CbzError::FileMissing { .. }));
    }

    // Ecrit un CBZ jouet dans le dossier temporaire et le lit comme le ferait
    // la commande. Couvre l'enchainement ouverture / tri / extraction.
    fn write_cbz(name: &str, entries: &[(&str, &[u8])]) -> std::path::PathBuf {
        let path = std::env::temp_dir().join(name);
        let file = File::create(&path).unwrap();
        let mut zip = zip::ZipWriter::new(file);
        for (entry, data) in entries {
            zip.start_file::<_, ()>(*entry, zip::write::SimpleFileOptions::default())
                .unwrap();
            std::io::Write::write_all(&mut zip, data).unwrap();
        }
        zip.finish().unwrap();
        path
    }

    #[test]
    fn lists_and_reads_pages_in_order() {
        let path = write_cbz(
            "cbz_test_order.cbz",
            &[
                ("ComicInfo.xml", b"<xml/>"),
                ("page10.jpg", b"ten"),
                ("__MACOSX/page01.jpg", b"junk"),
                ("page2.jpg", b"two"),
                ("page1.jpg", b"one"),
            ],
        );
        let p = path.to_str().unwrap();

        assert_eq!(
            cbz_list_pages(p.to_string()).unwrap(),
            vec!["page1.jpg", "page2.jpg", "page10.jpg"]
        );
        assert_eq!(read_page(p, 0).unwrap(), b"one");
        assert_eq!(read_page(p, 2).unwrap(), b"ten");
        assert!(matches!(
            read_page(p, 3).unwrap_err(),
            CbzError::PageOutOfRange { index: 3, count: 3 }
        ));

        std::fs::remove_file(path).unwrap();
    }

    #[test]
    fn archive_without_images_is_rejected() {
        let path = write_cbz("cbz_test_empty.cbz", &[("ComicInfo.xml", b"<xml/>")]);
        let err = cbz_list_pages(path.to_str().unwrap().to_string()).unwrap_err();
        assert!(matches!(err, CbzError::NoPages));
        std::fs::remove_file(path).unwrap();
    }

    #[test]
    fn non_archive_is_rejected() {
        let path = std::env::temp_dir().join("cbz_test_garbage.cbz");
        std::fs::write(&path, b"not a zip at all").unwrap();
        let err = cbz_list_pages(path.to_str().unwrap().to_string()).unwrap_err();
        assert!(matches!(err, CbzError::NotAnArchive { .. }));
        std::fs::remove_file(path).unwrap();
    }
}
