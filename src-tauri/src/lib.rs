use futures_util::StreamExt;
use reqwest::multipart;
use serde_json::Value;
use std::collections::HashSet;
use std::io::Write;
use std::sync::{Mutex, OnceLock};
use tauri::{Emitter, Manager};
use tauri_plugin_store::StoreExt;

const KEYRING_SERVICE: &str = "com.sulyk.c411-debrid-app";

// Ids des telechargements dont l'annulation a ete demandee. La boucle de
// streaming verifie ce set a chaque chunk et s'interrompt si l'id y figure.
#[derive(Default)]
struct DownloadState {
    cancelled: Mutex<HashSet<String>>,
}

#[derive(Clone, serde::Serialize)]
struct DownloadProgress {
    id: String,
    downloaded: u64,
    total: u64,
}

fn hex_val(b: u8) -> Option<u8> {
    match b {
        b'0'..=b'9' => Some(b - b'0'),
        b'a'..=b'f' => Some(b - b'a' + 10),
        b'A'..=b'F' => Some(b - b'A' + 10),
        _ => None,
    }
}

// Decode les sequences %XX d'un segment d'URL (ex. "Mon%20Film" -> "Mon Film").
fn percent_decode(s: &str) -> String {
    let bytes = s.as_bytes();
    let mut out = Vec::with_capacity(bytes.len());
    let mut i = 0;
    while i < bytes.len() {
        if bytes[i] == b'%' && i + 2 < bytes.len() {
            if let (Some(h), Some(l)) = (hex_val(bytes[i + 1]), hex_val(bytes[i + 2])) {
                out.push((h << 4) | l);
                i += 3;
                continue;
            }
        }
        out.push(bytes[i]);
        i += 1;
    }
    String::from_utf8_lossy(&out).into_owned()
}

// Deduit un nom de fichier propre depuis l'URL debridee.
fn filename_from_url(url: &str) -> String {
    url.split('?')
        .next()
        .and_then(|p| p.rsplit('/').next())
        .filter(|s| !s.is_empty())
        .map(percent_decode)
        .unwrap_or_else(|| "telechargement".to_string())
}

// Un seul client reqwest reutilise par toutes les commandes : conserve le pool
// de connexions (keep-alive TLS) au lieu d'en recreer un a chaque appel.
// Timeout total applique aux appels API (reponse courte). Volontairement absent
// de download_to_dir, ou le corps streame peut durer plusieurs minutes.
const API_TIMEOUT: std::time::Duration = std::time::Duration::from_secs(20);

fn http_client() -> &'static reqwest::Client {
    static CLIENT: OnceLock<reqwest::Client> = OnceLock::new();
    // connect_timeout uniquement (pas de timeout total global) : un serveur
    // injoignable echoue vite, mais un gros telechargement n'est pas coupe.
    CLIENT.get_or_init(|| {
        reqwest::Client::builder()
            .connect_timeout(std::time::Duration::from_secs(15))
            .build()
            .expect("client reqwest")
    })
}

// Traduit une erreur reqwest en message francais explicite selon sa nature
// (timeout, connexion impossible, ...). without_url evite d'exposer la cle API
// presente dans certaines URL (c411).
fn net_err(service: &str, e: reqwest::Error) -> String {
    let e = e.without_url();
    if e.is_timeout() {
        format!("{} ne repond pas (delai depasse).", service)
    } else if e.is_connect() {
        format!("Impossible de joindre {}. Verifiez votre connexion.", service)
    } else {
        format!("Erreur reseau {} : {}", service, e)
    }
}

#[tauri::command]
fn get_api_key(name: String) -> Result<Option<String>, String> {
    let entry = keyring::Entry::new(KEYRING_SERVICE, &name).map_err(|e| e.to_string())?;
    match entry.get_password() {
        Ok(v) => Ok(Some(v)),
        Err(keyring::Error::NoEntry) => Ok(None),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
fn set_api_key(name: String, value: String) -> Result<(), String> {
    keyring::Entry::new(KEYRING_SERVICE, &name)
        .and_then(|e| e.set_password(&value))
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn upload_torrent_to_debrid(
    torrent_url: String,
    alldebrid_key: String,
) -> Result<Value, String> {
    let client = http_client();

    let torrent_res = client
        .get(&torrent_url)
        .send()
        .await
        .map_err(|e| net_err("C411", e))?;

    let torrent_status = torrent_res.status();
    let torrent_bytes = torrent_res.bytes().await.map_err(|e| net_err("C411", e))?;

    if !torrent_status.is_success() {
        return Err(format!(
            "Telechargement torrent HTTP {} : {}",
            torrent_status,
            String::from_utf8_lossy(&torrent_bytes[..torrent_bytes.len().min(300)])
        ));
    }
    if torrent_bytes.first() != Some(&b'd') {
        return Err(format!(
            "Fichier recu invalide : {}",
            String::from_utf8_lossy(&torrent_bytes[..torrent_bytes.len().min(300)])
        ));
    }

    let part = multipart::Part::bytes(torrent_bytes.to_vec())
        .file_name("torrent.torrent")
        .mime_str("application/x-bittorrent")
        .map_err(|e| e.to_string())?;

    let form = multipart::Form::new().part("files[]", part);

    let upload_res = client
        .post("https://api.alldebrid.com/v4/magnet/upload/file")
        .bearer_auth(&alldebrid_key)
        .multipart(form)
        .timeout(API_TIMEOUT)
        .send()
        .await
        .map_err(|e| net_err("AllDebrid", e))?;

    let status = upload_res.status();
    let body = upload_res.text().await.map_err(|e| net_err("AllDebrid", e))?;

    if !status.is_success() {
        return Err(format!("AllDebrid HTTP {} : {}", status, body));
    }

    let res: Value = serde_json::from_str(&body).map_err(|e| e.to_string())?;
    Ok(res)
}

#[tauri::command]
async fn upload_magnet_to_debrid(magnet: String, alldebrid_key: String) -> Result<Value, String> {
    let client = http_client();

    let res = client
        .post("https://api.alldebrid.com/v4/magnet/upload")
        .bearer_auth(&alldebrid_key)
        .query(&[("magnets[]", &magnet)])
        .timeout(API_TIMEOUT)
        .send()
        .await
        .map_err(|e| net_err("AllDebrid", e))?;

    let status = res.status();
    let body = res.text().await.map_err(|e| net_err("AllDebrid", e))?;

    if !status.is_success() {
        return Err(format!("AllDebrid HTTP {} : {}", status, body));
    }

    let json: Value = serde_json::from_str(&body).map_err(|e| e.to_string())?;
    Ok(json)
}

#[tauri::command]
async fn get_magnet_files(id: u64, alldebrid_key: String) -> Result<Value, String> {
    let client = http_client();

    let res = client
        .get("https://api.alldebrid.com/v4/magnet/files")
        .bearer_auth(&alldebrid_key)
        .query(&[("id[]", id.to_string())])
        .timeout(API_TIMEOUT)
        .send()
        .await
        .map_err(|e| net_err("AllDebrid", e))?;

    let status = res.status();
    let body = res.text().await.map_err(|e| net_err("AllDebrid", e))?;

    if !status.is_success() {
        return Err(format!("AllDebrid HTTP {} : {}", status, body));
    }

    let json: Value = serde_json::from_str(&body).map_err(|e| e.to_string())?;
    Ok(json)
}

#[tauri::command]
async fn unlock_link(link: String, alldebrid_key: String) -> Result<String, String> {
    let client = http_client();

    let res = client
        .get("https://api.alldebrid.com/v4/link/unlock")
        .bearer_auth(&alldebrid_key)
        .query(&[("link", &link)])
        .timeout(API_TIMEOUT)
        .send()
        .await
        .map_err(|e| net_err("AllDebrid", e))?;

    let status = res.status();
    let body = res.text().await.map_err(|e| net_err("AllDebrid", e))?;

    if !status.is_success() {
        return Err(format!("AllDebrid HTTP {} : {}", status, body));
    }

    let json: Value = serde_json::from_str(&body).map_err(|e| e.to_string())?;

    let download_url = json
        .pointer("/data/link")
        .and_then(|v| v.as_str())
        .ok_or_else(|| format!("Lien de telechargement introuvable : {}", body))?
        .to_string();

    Ok(download_url)
}

#[tauri::command]
fn export_json(app: tauri::AppHandle, filename: String, content: String) -> Result<String, String> {
    use tauri::Manager;
    let dir = app.path().download_dir().map_err(|e| e.to_string())?;
    let path = dir.join(filename);
    std::fs::write(&path, content).map_err(|e| e.to_string())?;
    Ok(path.to_string_lossy().into_owned())
}

// Telecharge `url` vers `dir` (ou le dossier Telechargements de l'OS si vide),
// en streamant le corps et en emettant des evenements de progression.
// Retourne le chemin final. Renvoie Err("cancelled") si annule.
#[tauri::command]
async fn download_to_dir(
    app: tauri::AppHandle,
    state: tauri::State<'_, DownloadState>,
    id: String,
    url: String,
    dir: String,
) -> Result<String, String> {
    let target_dir = if dir.trim().is_empty() {
        app.path().download_dir().map_err(|e| e.to_string())?
    } else {
        std::path::PathBuf::from(&dir)
    };

    let dest = target_dir.join(filename_from_url(&url));

    let client = http_client();
    let res = client
        .get(&url)
        .send()
        .await
        .map_err(|e| net_err("le serveur de telechargement", e))?;

    if !res.status().is_success() {
        return Err(format!("Telechargement HTTP {}", res.status()));
    }

    let total = res.content_length().unwrap_or(0);
    let mut file = std::fs::File::create(&dest).map_err(|e| e.to_string())?;
    let mut downloaded: u64 = 0;
    let mut last_emit = std::time::Instant::now();
    let mut stream = res.bytes_stream();

    while let Some(chunk) = stream.next().await {
        // Verifie l'annulation sans tenir le verrou au-dela de l'await suivant.
        let is_cancelled = {
            let mut set = state.cancelled.lock().unwrap();
            set.remove(&id)
        };
        if is_cancelled {
            drop(file);
            let _ = std::fs::remove_file(&dest);
            return Err("cancelled".to_string());
        }

        let chunk = chunk.map_err(|e| e.to_string())?;
        file.write_all(&chunk).map_err(|e| e.to_string())?;
        downloaded += chunk.len() as u64;

        // Throttle les events (~10/s) pour ne pas noyer le front.
        if last_emit.elapsed().as_millis() >= 100 {
            let _ = app.emit(
                "download-progress",
                DownloadProgress {
                    id: id.clone(),
                    downloaded,
                    total,
                },
            );
            last_emit = std::time::Instant::now();
        }
    }

    let _ = app.emit(
        "download-progress",
        DownloadProgress {
            id: id.clone(),
            downloaded,
            total,
        },
    );

    Ok(dest.to_string_lossy().into_owned())
}

#[tauri::command]
fn cancel_download(state: tauri::State<'_, DownloadState>, id: String) {
    state.cancelled.lock().unwrap().insert(id);
}

// Ouvre un fichier local avec l'application par defaut du systeme.
#[tauri::command]
fn open_file(path: String) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    std::process::Command::new("open")
        .arg(&path)
        .spawn()
        .map_err(|e| e.to_string())?;

    #[cfg(target_os = "windows")]
    std::process::Command::new("cmd")
        .args(["/C", "start", "", &path])
        .spawn()
        .map_err(|e| e.to_string())?;

    #[cfg(target_os = "linux")]
    std::process::Command::new("xdg-open")
        .arg(&path)
        .spawn()
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
fn open_with_vlc(url: String) -> Result<(), String> {
    open_urls_with_vlc(&[url])
}

#[tauri::command]
fn open_many_with_vlc(urls: Vec<String>) -> Result<(), String> {
    if urls.is_empty() {
        return Err("Aucun lien a lire".into());
    }
    open_urls_with_vlc(&urls)
}

// Lance VLC avec une ou plusieurs URLs (playlist quand il y en a plusieurs).
fn open_urls_with_vlc(urls: &[String]) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        let mut args = vec!["-a".to_string(), "VLC".to_string()];
        args.extend(urls.iter().cloned());
        std::process::Command::new("open")
            .args(&args)
            .spawn()
            .map_err(|e| e.to_string())?;
    }

    #[cfg(target_os = "windows")]
    {
        let vlc_paths = [
            r"C:\Program Files\VideoLAN\VLC\vlc.exe",
            r"C:\Program Files (x86)\VideoLAN\VLC\vlc.exe",
        ];
        let vlc = vlc_paths.iter().find(|p| std::path::Path::new(p).exists())
            .ok_or("VLC introuvable")?;
        std::process::Command::new(vlc)
            .args(urls)
            .spawn()
            .map_err(|e| e.to_string())?;
    }

    #[cfg(target_os = "linux")]
    std::process::Command::new("vlc")
        .args(urls)
        .spawn()
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .manage(DownloadState::default())
        .setup(|app| {
            // Migration : deplace les cles API de settings.json (clair) vers le trousseau OS
            if let Ok(store) = app.store("settings.json") {
                let mut migrated = false;
                for name in ["c411_api_key", "alldebrid_api_key"] {
                    let Some(value) = store.get(name).and_then(|v| v.as_str().map(str::to_string))
                    else {
                        continue;
                    };
                    let saved = keyring::Entry::new(KEYRING_SERVICE, name)
                        .and_then(|e| e.set_password(&value))
                        .is_ok();
                    if saved {
                        store.delete(name);
                        migrated = true;
                    }
                }
                if migrated {
                    let _ = store.save();
                }
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_api_key,
            set_api_key,
            upload_torrent_to_debrid,
            upload_magnet_to_debrid,
            get_magnet_files,
            unlock_link,
            open_with_vlc,
            open_many_with_vlc,
            export_json,
            download_to_dir,
            cancel_download,
            open_file,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
