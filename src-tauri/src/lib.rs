use reqwest::multipart;
use serde_json::Value;
use tauri_plugin_store::StoreExt;

const KEYRING_SERVICE: &str = "com.sulyk.c411-debrid-app";

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
    let client = reqwest::Client::new();

    // without_url: l'URL c411 contient la cle API, ne pas l'exposer dans les erreurs
    let torrent_res = client
        .get(&torrent_url)
        .send()
        .await
        .map_err(|e| e.without_url().to_string())?;

    let torrent_status = torrent_res.status();
    let torrent_bytes = torrent_res
        .bytes()
        .await
        .map_err(|e| e.without_url().to_string())?;

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
        .send()
        .await
        .map_err(|e| e.to_string())?;

    let status = upload_res.status();
    let body = upload_res.text().await.map_err(|e| e.to_string())?;

    if !status.is_success() {
        return Err(format!("AllDebrid HTTP {} : {}", status, body));
    }

    let res: Value = serde_json::from_str(&body).map_err(|e| e.to_string())?;
    Ok(res)
}

#[tauri::command]
async fn get_magnet_files(id: u64, alldebrid_key: String) -> Result<Value, String> {
    let client = reqwest::Client::new();

    let res = client
        .get("https://api.alldebrid.com/v4/magnet/files")
        .bearer_auth(&alldebrid_key)
        .query(&[("id[]", id.to_string())])
        .send()
        .await
        .map_err(|e| e.to_string())?;

    let status = res.status();
    let body = res.text().await.map_err(|e| e.to_string())?;

    if !status.is_success() {
        return Err(format!("AllDebrid HTTP {} : {}", status, body));
    }

    let json: Value = serde_json::from_str(&body).map_err(|e| e.to_string())?;
    Ok(json)
}

#[tauri::command]
async fn unlock_link(link: String, alldebrid_key: String) -> Result<String, String> {
    let client = reqwest::Client::new();

    let res = client
        .get("https://api.alldebrid.com/v4/link/unlock")
        .bearer_auth(&alldebrid_key)
        .query(&[("link", &link)])
        .send()
        .await
        .map_err(|e| e.to_string())?;

    let status = res.status();
    let body = res.text().await.map_err(|e| e.to_string())?;

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
fn open_with_vlc(url: String) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    std::process::Command::new("open")
        .args(["-a", "VLC", &url])
        .spawn()
        .map_err(|e| e.to_string())?;

    #[cfg(target_os = "windows")]
    {
        let vlc_paths = [
            r"C:\Program Files\VideoLAN\VLC\vlc.exe",
            r"C:\Program Files (x86)\VideoLAN\VLC\vlc.exe",
        ];
        let vlc = vlc_paths.iter().find(|p| std::path::Path::new(p).exists())
            .ok_or("VLC introuvable")?;
        std::process::Command::new(vlc)
            .arg(&url)
            .spawn()
            .map_err(|e| e.to_string())?;
    }

    #[cfg(target_os = "linux")]
    std::process::Command::new("vlc")
        .arg(&url)
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
            get_magnet_files,
            unlock_link,
            open_with_vlc,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
