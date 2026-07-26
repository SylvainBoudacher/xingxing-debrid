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

// Demande la phrase secrete une fois le fichier choisi. En cas d'erreur, la
// fenetre reste ouverte pour permettre un nouvel essai.
export function ImportPassphraseDialog({
  file,
  error,
  busy,
  onCancel,
  onSubmit,
}: {
  file: string | null;
  error: string | null;
  busy: boolean;
  onCancel: () => void;
  onSubmit: (passphrase: string) => void;
}) {
  const [passphrase, setPassphrase] = useState("");

  if (!file) return null;

  function submit() {
    if (!passphrase || busy) return;
    onSubmit(passphrase);
  }

  return (
    <AlertDialog open onOpenChange={(open) => !open && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Phrase secrète</AlertDialogTitle>
          <AlertDialogDescription className="break-all">
            Celle utilisée pour exporter {file.split(/[\\/]/).pop()}.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-2">
          <Input
            autoFocus
            type="password"
            value={passphrase}
            onChange={(e) => setPassphrase(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
          />
          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <button
            onClick={submit}
            disabled={!passphrase || busy}
            className="rounded-full bg-indigo-600 px-4 py-2 text-xs font-medium text-white hover:bg-indigo-500 transition-colors disabled:opacity-40 disabled:pointer-events-none"
          >
            {busy ? "Lecture..." : "Continuer"}
          </button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
