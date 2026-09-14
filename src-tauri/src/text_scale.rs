/// Taille du texte Windows (Parametres > Accessibilite > Taille du texte), de 1.0 a 2.25.
/// La valeur n'existe dans le registre qu'une fois le reglage modifie : absente = 100 %.
#[tauri::command]
pub fn get_system_text_scale() -> f64 {
    #[cfg(target_os = "windows")]
    {
        use winreg::enums::HKEY_CURRENT_USER;
        use winreg::RegKey;

        if let Ok(percent) = RegKey::predef(HKEY_CURRENT_USER)
            .open_subkey(r"Software\Microsoft\Accessibility")
            .and_then(|key| key.get_value::<u32, _>("TextScaleFactor"))
        {
            return f64::from(percent) / 100.0;
        }
    }
    1.0
}
