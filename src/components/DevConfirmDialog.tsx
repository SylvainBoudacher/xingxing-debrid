import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export type DevAction = "reset-first-launch" | "clear-store";

const COPY: Record<DevAction, { title: string; description: string; confirm: string }> = {
  "reset-first-launch": {
    title: "Réinitialiser le premier lancement ?",
    description:
      "Le prochain démarrage relancera l'assistant de configuration. Vos clés et données ne sont pas supprimées.",
    confirm: "Réinitialiser",
  },
  "clear-store": {
    title: "Vider le store ?",
    description:
      "Toutes les préférences et données locales seront effacées, puis l'application sera rechargée. Action irréversible.",
    confirm: "Vider",
  },
};

interface DevConfirmDialogProps {
  action: DevAction | null;
  onCancel: () => void;
  onConfirm: () => void;
}

export function DevConfirmDialog({ action, onCancel, onConfirm }: DevConfirmDialogProps) {
  const copy = action ? COPY[action] : null;

  return (
    <AlertDialog open={action !== null} onOpenChange={(open) => !open && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{copy?.title}</AlertDialogTitle>
          <AlertDialogDescription>{copy?.description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>{copy?.confirm}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
