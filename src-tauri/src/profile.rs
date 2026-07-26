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

// Type de contenu de l'enveloppe. Sans lui, import_profile accepterait un
// fichier de bibliotheque et ecraserait les cles API avec du vide.
const KIND_PROFILE: &str = "profile";
const KIND_LIBRARY: &str = "library";

// Chiffre le payload et l'emballe dans l'enveloppe JSON versionnee.
fn seal(payload: &[u8], passphrase: &str, kind: &str) -> Result<Vec<u8>, String> {
    let mut salt = [0u8; 16];
    OsRng.fill_bytes(&mut salt);
    let mut nonce_bytes = [0u8; 24];
    OsRng.fill_bytes(&mut nonce_bytes);

    let cipher = XChaCha20Poly1305::new(&derive_key(passphrase, &salt)?);
    let ciphertext = cipher
        .encrypt(XNonce::from_slice(&nonce_bytes), payload)
        .map_err(|_| "Chiffrement impossible.".to_string())?;

    let envelope = json!({
        "app": "c411-debrid-app",
        "version": FORMAT_VERSION,
        "kind": kind,
        "kdf": { "algo": "argon2id", "salt": B64.encode(salt) },
        "nonce": B64.encode(nonce_bytes),
        "ciphertext": B64.encode(&ciphertext),
    });

    serde_json::to_vec_pretty(&envelope).map_err(|e| e.to_string())
}

// Valide l'enveloppe et dechiffre le payload JSON. Les fichiers produits avant
// l'introduction du champ `kind` n'en ont pas : ce sont des profils.
fn unseal(bytes: &[u8], passphrase: &str, expected_kind: &str) -> Result<Value, String> {
    let envelope: Value = serde_json::from_slice(bytes)
        .map_err(|_| "Ce fichier n'est pas une sauvegarde valide.".to_string())?;

    if envelope.get("app").and_then(Value::as_str) != Some("c411-debrid-app") {
        return Err("Ce fichier n'est pas une sauvegarde XingXing.".to_string());
    }
    let kind = envelope
        .get("kind")
        .and_then(Value::as_str)
        .unwrap_or(KIND_PROFILE);
    if kind != expected_kind {
        return Err(match expected_kind {
            KIND_LIBRARY => "Ce fichier est une sauvegarde de profil, pas une bibliotheque.",
            _ => "Ce fichier est un export de bibliotheque, pas une sauvegarde de profil.",
        }
        .to_string());
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

    let cipher = XChaCha20Poly1305::new(&derive_key(passphrase, &salt)?);
    let plaintext = cipher
        .decrypt(XNonce::from_slice(&nonce), ciphertext.as_slice())
        .map_err(|_| "Phrase secrete incorrecte ou fichier corrompu.".to_string())?;
    serde_json::from_slice(&plaintext).map_err(|e| e.to_string())
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

    let bytes = seal(&payload, &passphrase, KIND_PROFILE)?;
    std::fs::write(&path, bytes).map_err(|e| format!("Ecriture du fichier : {e}"))?;
    Ok(())
}

// La bibliotheque est assemblee et fusionnee cote frontend : le backend ne fait
// que chiffrer et ecrire. La passphrase ne quitte pas le processus.
#[tauri::command]
pub fn export_library(passphrase: String, path: String, payload: Value) -> Result<(), String> {
    if passphrase.chars().count() < PASSPHRASE_MIN_LEN {
        return Err(format!(
            "La phrase secrete doit faire au moins {PASSPHRASE_MIN_LEN} caracteres."
        ));
    }

    let bytes = serde_json::to_vec(&payload).map_err(|e| e.to_string())?;
    let sealed = seal(&bytes, &passphrase, KIND_LIBRARY)?;
    std::fs::write(&path, sealed).map_err(|e| format!("Ecriture du fichier : {e}"))?;
    Ok(())
}

#[tauri::command]
pub fn import_library(passphrase: String, path: String) -> Result<Value, String> {
    let bytes = std::fs::read(&path).map_err(|e| format!("Lecture du fichier : {e}"))?;
    unseal(&bytes, &passphrase, KIND_LIBRARY)
}

#[tauri::command]
pub fn import_profile(
    app: tauri::AppHandle,
    passphrase: String,
    path: String,
) -> Result<(), String> {
    let bytes = std::fs::read(&path).map_err(|e| format!("Lecture du fichier : {e}"))?;
    let payload = unseal(&bytes, &passphrase, KIND_PROFILE)?;

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

#[cfg(test)]
mod tests {
    use super::*;

    const PASS: &str = "phrase-secrete";

    fn payload() -> Vec<u8> {
        serde_json::to_vec(&json!({
            "keys": { "c411_api_key": "abc" },
            "stores": { "settings.json": { "theme": "dark" } },
        }))
        .unwrap()
    }

    #[test]
    fn seal_unseal_roundtrip() {
        let sealed = seal(&payload(), PASS, KIND_PROFILE).unwrap();
        let restored = unseal(&sealed, PASS, KIND_PROFILE).unwrap();
        assert_eq!(restored.pointer("/keys/c411_api_key"), Some(&json!("abc")));
        assert_eq!(
            restored.pointer("/stores/settings.json/theme"),
            Some(&json!("dark"))
        );
    }

    #[test]
    fn envelope_has_expected_format() {
        let sealed = seal(&payload(), PASS, KIND_PROFILE).unwrap();
        let envelope: Value = serde_json::from_slice(&sealed).unwrap();
        assert_eq!(envelope["app"], "c411-debrid-app");
        assert_eq!(envelope["version"], FORMAT_VERSION);
        assert_eq!(envelope["kdf"]["algo"], "argon2id");
        // Le payload en clair ne doit pas apparaitre dans le fichier.
        assert!(!String::from_utf8_lossy(&sealed).contains("abc"));
    }

    #[test]
    fn wrong_passphrase_is_rejected() {
        let sealed = seal(&payload(), PASS, KIND_PROFILE).unwrap();
        let err = unseal(&sealed, "mauvaise-phrase", KIND_PROFILE).unwrap_err();
        assert!(err.contains("Phrase secrete incorrecte"));
    }

    #[test]
    fn tampered_ciphertext_is_rejected() {
        let sealed = seal(&payload(), PASS, KIND_PROFILE).unwrap();
        let mut envelope: Value = serde_json::from_slice(&sealed).unwrap();
        let mut ct = B64.decode(envelope["ciphertext"].as_str().unwrap()).unwrap();
        ct[0] ^= 0xff;
        envelope["ciphertext"] = Value::String(B64.encode(&ct));
        let err = unseal(&serde_json::to_vec(&envelope).unwrap(), PASS, KIND_PROFILE).unwrap_err();
        assert!(err.contains("Phrase secrete incorrecte"));
    }

    #[test]
    fn non_json_file_is_rejected() {
        let err = unseal(b"pas du json", PASS, KIND_PROFILE).unwrap_err();
        assert!(err.contains("pas une sauvegarde valide"));
    }

    #[test]
    fn foreign_app_is_rejected() {
        let bytes = serde_json::to_vec(&json!({ "app": "autre-app", "version": 1 })).unwrap();
        let err = unseal(&bytes, PASS, KIND_PROFILE).unwrap_err();
        assert!(err.contains("pas une sauvegarde XingXing"));
    }

    #[test]
    fn library_file_is_refused_by_profile_import() {
        let sealed = seal(b"{}", PASS, KIND_LIBRARY).unwrap();
        let err = unseal(&sealed, PASS, KIND_PROFILE).unwrap_err();
        assert!(err.contains("export de bibliotheque"));
    }

    #[test]
    fn profile_file_is_refused_by_library_import() {
        let sealed = seal(&payload(), PASS, KIND_PROFILE).unwrap();
        let err = unseal(&sealed, PASS, KIND_LIBRARY).unwrap_err();
        assert!(err.contains("sauvegarde de profil"));
    }

    // Les fichiers ecrits avant l'introduction du champ sont des profils.
    #[test]
    fn envelope_without_kind_is_a_profile() {
        let sealed = seal(&payload(), PASS, KIND_PROFILE).unwrap();
        let mut envelope: Value = serde_json::from_slice(&sealed).unwrap();
        envelope.as_object_mut().unwrap().remove("kind");
        let bytes = serde_json::to_vec(&envelope).unwrap();
        assert!(unseal(&bytes, PASS, KIND_PROFILE).is_ok());
    }

    #[test]
    fn unsupported_version_is_rejected() {
        let sealed = seal(&payload(), PASS, KIND_PROFILE).unwrap();
        let mut envelope: Value = serde_json::from_slice(&sealed).unwrap();
        envelope["version"] = json!(99);
        let err = unseal(&serde_json::to_vec(&envelope).unwrap(), PASS, KIND_PROFILE).unwrap_err();
        assert!(err.contains("version 99 non supportee"));
    }

    #[test]
    fn bad_nonce_length_is_rejected() {
        let sealed = seal(&payload(), PASS, KIND_PROFILE).unwrap();
        let mut envelope: Value = serde_json::from_slice(&sealed).unwrap();
        envelope["nonce"] = Value::String(B64.encode([0u8; 12]));
        let err = unseal(&serde_json::to_vec(&envelope).unwrap(), PASS, KIND_PROFILE).unwrap_err();
        assert!(err.contains("malformee"));
    }
}
