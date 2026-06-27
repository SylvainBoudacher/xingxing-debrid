import { Library } from "lucide-react";
import { useEffect, useState } from "react";
import { SettingsPanel } from "../SettingsPanel";
import { FieldTitle, SettingRow, Toggle } from "../controls";
import { settingsStore as store } from "../store";

export function LibraryPanel() {
  const [autoWatchOnPlay, setAutoWatchOnPlay] = useState(true);

  useEffect(() => {
    store.get<boolean>("auto_watch_on_play").then((v) => setAutoWatchOnPlay(v ?? true));
  }, []);

  async function handleChange(v: boolean) {
    setAutoWatchOnPlay(v);
    await store.set("auto_watch_on_play", v);
    await store.save();
  }

  return (
    <SettingsPanel
      icon={Library}
      title="Bibliothèque"
      subtitle="Marquage automatique des contenus vus."
    >
      <FieldTitle
        title="Marquage automatique"
        hint="Lorsque vous lancez un film ou un épisode depuis VLC, l'entrée peut être automatiquement cochée comme visionnée."
      />

      <SettingRow
        title="Marquer comme vu à la lecture"
        description="Coche l'épisode ou le film dès que vous cliquez sur le bouton VLC."
      >
        <Toggle checked={autoWatchOnPlay} onChange={handleChange} />
      </SettingRow>
    </SettingsPanel>
  );
}
