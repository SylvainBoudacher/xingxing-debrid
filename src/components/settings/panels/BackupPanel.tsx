import { DatabaseBackup, Download } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { exportProfile, PASSPHRASE_MIN_LENGTH } from "@/lib/profileBackup";
import { SettingsPanel } from "../SettingsPanel";
import { FieldTitle } from "../controls";

export function BackupPanel() {
  const [passphrase, setPassphrase] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  const tooShort = passphrase.length > 0 && passphrase.length < PASSPHRASE_MIN_LENGTH;
  const mismatch = confirm.length > 0 && confirm !== passphrase;
  const canExport = passphrase.length >= PASSPHRASE_MIN_LENGTH && confirm === passphrase && !busy;

  async function handleExport() {
    setBusy(true);
    try {
      const path = await exportProfile(passphrase);
      if (path) {
        toast.success(`Profil exporté : ${path}`);
        setPassphrase("");
        setConfirm("");
      }
    } catch (e) {
      toast.error(`Export impossible : ${e}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <SettingsPanel
      icon={DatabaseBackup}
      title="Sauvegarde du profil"
      subtitle="Exportez tout votre profil dans un fichier chiffré."
    >
      <FieldTitle
        title="Exporter mon profil"
        hint="Regroupe vos clés API, votre bibliothèque, vos paramètres, vos likes et vos canards dans un seul fichier chiffré. Sans la phrase secrète, le fichier est illisible : notez-la, elle n'est enregistrée nulle part et ne peut pas être récupérée."
      />

      <div className="max-w-sm space-y-4">
        <div className="space-y-2">
          <Label htmlFor="backup-passphrase">Phrase secrète</Label>
          <Input
            id="backup-passphrase"
            type="password"
            placeholder={`${PASSPHRASE_MIN_LENGTH} caractères minimum`}
            value={passphrase}
            onChange={(e) => setPassphrase(e.target.value)}
          />
          {tooShort && (
            <p className="text-xs text-red-500">Au moins {PASSPHRASE_MIN_LENGTH} caractères.</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="backup-passphrase-confirm">Confirmer la phrase secrète</Label>
          <Input
            id="backup-passphrase-confirm"
            type="password"
            placeholder="Retapez la même phrase"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
          {mismatch && (
            <p className="text-xs text-red-500">Les deux phrases ne correspondent pas.</p>
          )}
        </div>

        <button
          onClick={handleExport}
          disabled={!canExport}
          className="flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-2 text-xs font-medium text-white hover:bg-indigo-500 transition-colors disabled:opacity-40 disabled:pointer-events-none"
        >
          <Download className="h-3.5 w-3.5" />
          {busy ? "Export en cours..." : "Exporter mon profil"}
        </button>
      </div>
    </SettingsPanel>
  );
}
