import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { UpdateInfo } from "@/lib/updater";

type Props = {
  update: UpdateInfo;
  onDismiss: () => void;
};

export function UpdateDialog({ update, onDismiss }: Props) {
  const [status, setStatus] = useState<"idle" | "downloading" | "done">("idle");

  async function handleInstall() {
    setStatus("downloading");
    await update.download();
    setStatus("done");
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 w-80 rounded-xl border border-border bg-card p-4 shadow-xl">
      <div className="mb-1 text-sm font-semibold">Mise a jour disponible</div>
      <div className="mb-3 text-xs text-muted-foreground">
        Version <span className="font-mono font-medium text-foreground">{update.version}</span>
        {update.body && <p className="mt-1 line-clamp-3 whitespace-pre-wrap">{update.body}</p>}
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={handleInstall} disabled={status !== "idle"} className="flex-1">
          {status === "idle" && "Installer"}
          {status === "downloading" && "Telechargement..."}
          {status === "done" && "Redemarrage..."}
        </Button>
        <Button size="sm" variant="ghost" onClick={onDismiss} disabled={status !== "idle"}>
          Plus tard
        </Button>
      </div>
    </div>
  );
}
