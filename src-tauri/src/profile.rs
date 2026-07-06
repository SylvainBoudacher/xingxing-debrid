use base64::{engine::general_purpose::STANDARD as B64, Engine};
use chacha20poly1305::{
    aead::{rand_core::RngCore, Aead, OsRng},
    KeyInit, XChaCha20Poly1305, XNonce,
};
use serde_json::{json, Value};
use tauri_plugin_store::StoreExt;

use crate::KEYRING_SERVICE;

// Contenu de la sauvegarde de profil : les stores plugin-store et les cles keyring.
const STORE_FILES: [&str; 4] = ["settings.json", "ducks.json", "duckdex.json", "likes.json"];
const KEY_NAMES: [&str; 3] = ["c411_api_key", "alldebrid_api_key", "tmdb_api_key"];

// version 1 = payload JSON chiffre en XChaCha20-Poly1305, cle derivee de la
// passphrase par Argon2id (parametres par defaut du crate).
const FORMAT_VERSION: u64 = 1;

pub const PASSPHRASE_MIN_LEN: usize = 8;

fn derive_key(passphrase: &str, salt: &[u8]) -> Result<chacha20poly1305::Key, String> {
    let mut key = [0u8; 32];
    argon2::Argon2::default()
        .hash_password_into(passphrase.as_bytes(), salt, &mut key)
        .map_err(|e| format!("Derivation de la cle : {e}"))?;
    Ok(key.into())
}

#[tauri::command]
pub fn export_profile(
    app: tauri::AppHandle,
    passphrase: String,
    path: String,
) -> Result<(), String> {
    if passphrase.chars().count() < PASSPHRASE_MIN_LEN {
        return Err(format!(
            "La phrase secrete doit faire au moins {PASSPHRASE_MIN_LEN} caracteres."
        ));
    }

    let mut keys = serde_json::Map::new();
    for name in KEY_NAMES {
        let entry = keyring::Entry::new(KEYRING_SERVICE, name).map_err(|e| e.to_string())?;
        match entry.get_password() {
            Ok(v) => {
                keys.insert(name.to_string(), Value::String(v));
            }
            Err(keyring::Error::NoEntry) => {}
            Err(e) => return Err(format!("Lecture du trousseau ({name}) : {e}")),
        }
    }

    let mut stores = serde_json::Map::new();
    for file in STORE_FILES {
        let store = app.store(file).map_err(|e| e.to_string())?;
        let entries: serde_json::Map<String, Value> = store.entries().into_iter().collect();
        stores.insert(file.to_string(), Value::Object(entries));
    }

    let payload = serde_json::to_vec(&json!({ "keys": keys, "stores": stores }))
        .map_err(|e| e.to_string())?;

    let mut salt = [0u8; 16];
    OsRng.fill_bytes(&mut salt);
    let mut nonce_bytes = [0u8; 24];
    OsRng.fill_bytes(&mut nonce_bytes);

    let cipher = XChaCha20Poly1305::new(&derive_key(&passphrase, &salt)?);
    let ciphertext = cipher
        .encrypt(XNonce::from_slice(&nonce_bytes), payload.as_slice())
        .map_err(|_| "Chiffrement impossible.".to_string())?;

    let envelope = json!({
        "app": "c411-debrid-app",
        "version": FORMAT_VERSION,
        "kdf": { "algo": "argon2id", "salt": B64.encode(salt) },
        "nonce": B64.encode(nonce_bytes),
        "ciphertext": B64.encode(&ciphertext),
    });

    let bytes = serde_json::to_vec_pretty(&envelope).map_err(|e| e.to_string())?;
    std::fs::write(&path, bytes).map_err(|e| format!("Ecriture du fichier : {e}"))?;
    Ok(())
}

#[tauri::command]
pub fn import_profile(
    app: tauri::AppHandle,
    passphrase: String,
    path: String,
) -> Result<(), String> {
    let bytes = std::fs::read(&path).map_err(|e| format!("Lecture du fichier : {e}"))?;
    let envelope: Value = serde_json::from_slice(&bytes)
        .map_err(|_| "Ce fichier n'est pas une sauvegarde valide.".to_string())?;

    if envelope.get("app").and_then(Value::as_str) != Some("c411-debrid-app") {
        return Err("Ce fichier n'est pas une sauvegarde de profil XingXing.".to_string());
    }
    let version = envelope.get("version").and_then(Value::as_u64).unwrap_or(0);
    if version != FORMAT_VERSION {
        return Err(format!(
            "Sauvegarde de version {version} non supportee. Mettez l'application a jour."
        ));
    }

    let b64_field = |ptr: &str| -> Result<Vec<u8>, String> {
        envelope
            .pointer(ptr)
            .and_then(Value::as_str)
            .ok_or_else(|| "Sauvegarde malformee.".to_string())
            .and_then(|s| B64.decode(s).map_err(|_| "Sauvegarde malformee.".to_string()))
    };
    let salt = b64_field("/kdf/salt")?;
    let nonce = b64_field("/nonce")?;
    let ciphertext = b64_field("/ciphertext")?;
    if nonce.len() != 24 {
        return Err("Sauvegarde malformee.".to_string());
    }

    let cipher = XChaCha20Poly1305::new(&derive_key(&passphrase, &salt)?);
    let plaintext = cipher
        .decrypt(XNonce::from_slice(&nonce), ciphertext.as_slice())
        .map_err(|_| "Phrase secrete incorrecte ou fichier corrompu.".to_string())?;
    let payload: Value = serde_json::from_slice(&plaintext).map_err(|e| e.to_string())?;

    if let Some(keys) = payload.get("keys").and_then(Value::as_object) {
        for name in KEY_NAMES {
            if let Some(v) = keys.get(name).and_then(Value::as_str) {
                keyring::Entry::new(KEYRING_SERVICE, name)
                    .and_then(|e| e.set_password(v))
                    .map_err(|e| format!("Ecriture du trousseau ({name}) : {e}"))?;
            }
        }
    }

    for file in STORE_FILES {
        let Some(entries) = payload
            .pointer(&format!("/stores/{file}"))
            .and_then(Value::as_object)
        else {
            continue;
        };
        let store = app.store(file).map_err(|e| e.to_string())?;
        store.clear();
        for (k, v) in entries {
            store.set(k.clone(), v.clone());
        }
        store.save().map_err(|e| e.to_string())?;
    }

    Ok(())
}
