import { Download, FolderSync, Upload } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loadLibrary } from "@/lib/library";
import { loadCategories } from "@/lib/libraryCategories";
import {
  applyImport,
  exportLibrary,
  getExportPath,
  pickExportPath,
  pickImportFile,
  readLibraryFile,
} from "@/lib/librarySync/file";
import { mergeLibrary } from "@/lib/librarySync/merge";
import { PASSPHRASE_MIN_LENGTH } from "@/lib/profileBackup";
import { SettingsPanel } from "../SettingsPanel";
import { FieldTitle, PanelDivider } from "../controls";
import { ImportLibraryDialog, type ImportPreview } from "./ImportLibraryDialog";
import { ImportPassphraseDialog } from "./ImportPassphraseDialog";

export function LibraryTransferPanel() {
  const [path, setPath] = useState<string | undefined>();
  const [passphrase, setPassphrase] = useState("");
  const [busy, setBusy] = useState(false);
  // Import en trois temps : choix du fichier, phrase secrete, apercu.
  const [importFile, setImportFile] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [pending, setPending] = useState<ImportPreview | null>(null);

  useEffect(() => {
    void getExportPath().then(setPath);
  }, []);

  const tooShort = passphrase.length > 0 && passphrase.length < PASSPHRASE_MIN_LENGTH;
  const canExport = passphrase.length >= PASSPHRASE_MIN_LENGTH && !busy;

  async function run(action: () => Promise<void>) {
    setBusy(true);
    try {
      await action();
    } catch (e) {
      toast.error(String(e));
    } finally {
      setBusy(false);
    }
  }

  const handleExport = () =>
    run(async () => {
      const written = await exportLibrary(passphrase);
      if (!written) return;
      setPath(written);
      setPassphrase("");
      toast.success(`Bibliothèque exportée : ${written}`);
    });

  const handleChangePath = () =>
    run(async () => {
      const picked = await pickExportPath();
      if (picked) setPath(picked);
    });

  const handlePickImport = () =>
    run(async () => {
      const file = await pickImportFile();
      if (!file) return;
      setImportError(null);
      setImportFile(file);
    });

  // Le fichier est dechiffre et la fusion simulee avant d'afficher quoi que ce
  // soit : rien n'est ecrit tant que l'utilisateur n'a pas tranche.
  function handlePassphrase(entered: string) {
    if (!importFile) return;
    setBusy(true);
    void (async () => {
      try {
        const payload = await readLibraryFile(entered, importFile);
        const local = { entries: await loadLibrary(), categories: await loadCategories() };
        setImportFile(null);
        setPending({
          payload,
          preview: mergeLibrary(local, payload),
          localCount: local.entries.length,
        });
      } catch (e) {
        setImportError(String(e));
      } finally {
        setBusy(false);
      }
    })();
  }

  const handleMerge = (toRemove: Set<string>) =>
    run(async () => {
      if (!pending) return;
      const local = { entries: await loadLibrary(), categories: await loadCategories() };
      const merged = mergeLibrary(local, pending.payload, toRemove);
      await applyImport(merged.entries, merged.categories);
      setPending(null);
      toast.success(`Bibliothèque fusionnée : ${merged.entries.length} titres.`);
    });

  const handleReplace = () =>
    run(async () => {
      if (!pending) return;
      await applyImport(pending.payload.entries, pending.payload.categories);
      setPending(null);
      toast.success(`Bibliothèque remplacée : ${pending.payload.entries.length} titres.`);
    });

  return (
    <SettingsPanel
      icon={FolderSync}
      title="Transfert de bibliothèque"
      subtitle="Emportez votre bibliothèque d'un ordinateur à l'autre."
    >
      <FieldTitle
        title="Exporter"
        hint="Écrit vos titres et vos catégories dans un fichier chiffré. Placez-le dans un dossier synchronisé (Google Drive, Dropbox, Syncthing) pour le retrouver sur vos autres ordinateurs. La phrase secrète protège le fichier et vous est demandée à chaque export : choisissez celle que vous voulez, elle n'est enregistrée nulle part."
      />

      <div className="max-w-sm space-y-3">
        <div className="space-y-2">
          <Label htmlFor="library-passphrase">Phrase secrète</Label>
          <Input
            id="library-passphrase"
            type="password"
            placeholder={`${PASSPHRASE_MIN_LENGTH} caractères minimum`}
            value={passphrase}
            onChange={(e) => setPassphrase(e.target.value)}
          />
          {tooShort && (
            <p className="text-xs text-red-500">Au moins {PASSPHRASE_MIN_LENGTH} caractères.</p>
          )}
        </div>

        {path && (
          <p className="text-xs text-neutral-500 break-all">
            Destination : {path}{" "}
            <button
              onClick={handleChangePath}
              className="text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              changer
            </button>
          </p>
        )}

        <button
          onClick={handleExport}
          disabled={!canExport}
          className="flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-2 text-xs font-medium text-white hover:bg-indigo-500 transition-colors disabled:opacity-40 disabled:pointer-events-none"
        >
          <Download className="h-3.5 w-3.5" />
          {busy ? "En cours..." : "Exporter ma bibliothèque"}
        </button>
      </div>

      <PanelDivider />

      <FieldTitle
        title="Importer"
        hint="Choisissez le fichier, sa phrase secrète vous sera demandée ensuite. Un récapitulatif s'affiche avant toute modification : vous choisissez de fusionner avec votre bibliothèque actuelle ou de la remplacer."
      />

      <button
        onClick={handlePickImport}
        disabled={busy}
        className="flex items-center gap-2 rounded-full px-4 py-2 text-xs font-medium ring-1 ring-black/10 dark:ring-white/15 hover:bg-black/5 dark:hover:bg-white/5 transition-colors disabled:opacity-40 disabled:pointer-events-none"
      >
        <Upload className="h-3.5 w-3.5" />
        Importer une bibliothèque
      </button>

      <ImportPassphraseDialog
        key={importFile}
        file={importFile}
        error={importError}
        busy={busy}
        onCancel={() => setImportFile(null)}
        onSubmit={handlePassphrase}
      />

      <ImportLibraryDialog
        data={pending}
        onCancel={() => setPending(null)}
        onMerge={handleMerge}
        onReplace={handleReplace}
      />
    </SettingsPanel>
  );
}
