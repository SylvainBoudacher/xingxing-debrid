import { useState } from "react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PASSPHRASE_MIN_LENGTH } from "@/lib/profileBackup";

// Saisie de la phrase secrete, en export comme en import. A l'export elle est
// demandee deux fois (une faute de frappe rendrait le fichier illisible) et
// doit respecter la longueur minimale ; a l'import il n'y a rien a verifier
// localement, c'est le dechiffrement qui tranche. `error` garde la fenetre
// ouverte pour permettre un nouvel essai.
// Montee et demontee par l'appelant : la saisie repart donc vide a chaque
// ouverture, sans etat a reinitialiser.
export function PassphraseDialog({
  title,
  description,
  confirm = false,
  submitLabel,
  error,
  busy,
  onCancel,
  onSubmit,
}: {
  title: string;
  description: string;
  confirm?: boolean;
  submitLabel: string;
  error: string | null;
  busy: boolean;
  onCancel: () => void;
  onSubmit: (passphrase: string) => void;
}) {
  const [passphrase, setPassphrase] = useState("");
  const [repeat, setRepeat] = useState("");

  const tooShort = confirm && passphrase.length > 0 && passphrase.length < PASSPHRASE_MIN_LENGTH;
  const mismatch = confirm && repeat.length > 0 && repeat !== passphrase;
  const valid = confirm
    ? passphrase.length >= PASSPHRASE_MIN_LENGTH && repeat === passphrase
    : passphrase.length > 0;

  function submit() {
    if (!valid || busy) return;
    onSubmit(passphrase);
  }

  return (
    <AlertDialog open onOpenChange={(next) => !next && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription className="break-all">{description}</AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            {confirm && <Label htmlFor="passphrase">Phrase secrète</Label>}
            <Input
              id="passphrase"
              autoFocus
              type="password"
              placeholder={confirm ? `${PASSPHRASE_MIN_LENGTH} caractères minimum` : undefined}
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !confirm && submit()}
            />
            {tooShort && (
              <p className="text-xs text-red-500">Au moins {PASSPHRASE_MIN_LENGTH} caractères.</p>
            )}
          </div>

          {confirm && (
            <div className="space-y-2">
              <Label htmlFor="passphrase-repeat">Confirmer la phrase secrète</Label>
              <Input
                id="passphrase-repeat"
                type="password"
                placeholder="Retapez la même phrase"
                value={repeat}
                onChange={(e) => setRepeat(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submit()}
              />
              {mismatch && (
                <p className="text-xs text-red-500">Les deux phrases ne correspondent pas.</p>
              )}
            </div>
          )}

          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <button
            onClick={submit}
            disabled={!valid || busy}
            className="rounded-full bg-indigo-600 px-4 py-2 text-xs font-medium text-white hover:bg-indigo-500 transition-colors disabled:opacity-40 disabled:pointer-events-none"
          >
            {busy ? "En cours..." : submitLabel}
          </button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
