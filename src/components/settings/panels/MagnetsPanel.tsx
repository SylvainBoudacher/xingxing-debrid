import { Magnet } from "lucide-react";
import { useEffect, useState } from "react";
import { SettingsPanel } from "../SettingsPanel";
import { FieldTitle, SettingRow, Toggle } from "../controls";
import { settingsStore as store } from "../store";

export function MagnetsPanel() {
  const [hideNfo, setHideNfo] = useState(true);
  const [skipNfoDownload, setSkipNfoDownload] = useState(true);

  useEffect(() => {
    store.get<boolean>("hide_nfo_files").then((v) => setHideNfo(v ?? true));
    store.get<boolean>("skip_nfo_download").then((v) => setSkipNfoDownload(v ?? true));
  }, []);

  async function handleHideNfo(v: boolean) {
    setHideNfo(v);
    await store.set("hide_nfo_files", v);
    await store.save();
  }

  async function handleSkipNfoDownload(v: boolean) {
    setSkipNfoDownload(v);
    await store.set("skip_nfo_download", v);
    await store.save();
  }

  return (
    <SettingsPanel
      icon={Magnet}
      title="Magnets et fichiers"
      subtitle="Téléchargements et fichiers .nfo."
    >
      <FieldTitle
        title="Fichiers .nfo"
        hint="Un fichier .nfo est un petit fichier texte ajouté par les teams de release pour décrire le contenu (qualité, langue, source). Il n'est pas nécessaire pour regarder vos films et séries."
      />

      <div className="space-y-3">
        <SettingRow
          title="Ne pas afficher les fichiers .nfo"
          description="Les masque dans la liste des fichiers d'un magnet."
        >
          <Toggle checked={hideNfo} onChange={handleHideNfo} />
        </SettingRow>

        <SettingRow
          title="Ne pas télécharger les fichiers .nfo"
          description={'Les exclut des téléchargements groupés ("Tout télécharger").'}
        >
          <Toggle checked={skipNfoDownload} onChange={handleSkipNfoDownload} />
        </SettingRow>
      </div>
    </SettingsPanel>
  );
}
