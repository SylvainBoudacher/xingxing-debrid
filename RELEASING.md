# Publier une mise a jour

L'app utilise l'auto-update Tauri (`tauri-plugin-updater`). Les utilisateurs recoivent les
mises a jour automatiquement au demarrage, sans passer par Google Drive.

## Processus

1. Bump la version dans les deux fichiers (meme numero) :
   - `src-tauri/tauri.conf.json` -> `"version": "1.2.0"`
   - `package.json` -> `"version": "1.2.0"`

2. Commit, tag, push :

   ```bash
   git add -A && git commit -m "release v1.2.0"
   git tag v1.2.0
   git push origin main --tags
   ```

3. Le workflow `.github/workflows/build-windows.yml` se declenche sur le tag `v*.*.*` :
   build Windows -> signature -> creation de la GitHub Release avec `.msi`, `.exe`,
   leurs `.sig`, et `latest.json`.

4. Les apps installees detectent la nouvelle version via
   `https://github.com/SylvainBoudacher/xingxing-debrid/releases/latest/download/latest.json`
   et proposent la mise a jour.

## Comment ca marche

- **Signature** : Tauri signe chaque binaire avec la cle privee
  (`~/.tauri/xingxing.key`, passee au CI via le secret `TAURI_SIGNING_PRIVATE_KEY`).
  L'app verifie la signature avec la cle publique (`pubkey` dans `tauri.conf.json`)
  avant d'installer. Une update non signee par cette cle est refusee.
- **Manifeste** : `latest.json` (genere par `tauri-apps/tauri-action`) liste la version,
  les URLs de telechargement et les signatures.

## Secrets GitHub requis

- `TAURI_SIGNING_PRIVATE_KEY` : contenu de `~/.tauri/xingxing.key`
- `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` : mot de passe de la cle

## IMPORTANT : ne perds pas la cle privee

Sauvegarde `~/.tauri/xingxing.key` ET son mot de passe en lieu sur.
Sans cette cle, impossible de signer une mise a jour acceptee par les apps deja
installees : il faudrait redistribuer manuellement une nouvelle version (avec une
nouvelle `pubkey`) a tous les utilisateurs.
