import { useState } from "react";
import { motion } from "motion/react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { UpdateInfo } from "@/lib/updater";
import mascotImg from "@/assets/wingxingMaj.webp";

type Props = {
  update: UpdateInfo;
  onDismiss: () => void;
};

const PREVIEW_COUNT = 3;

function parseNotes(body: string | null | undefined) {
  return (body ?? "")
    .split("\n")
    .map((line) => line.replace(/^\s*[-*]\s*/, "").trim())
    .filter(Boolean);
}

export function UpdateDialog({ update, onDismiss }: Props) {
  const [status, setStatus] = useState<"idle" | "downloading" | "done">("idle");
  const [expanded, setExpanded] = useState(false);

  const notes = parseNotes(update.body);
  const visible = expanded ? notes : notes.slice(0, PREVIEW_COUNT);
  const hiddenCount = notes.length - PREVIEW_COUNT;

  async function handleInstall() {
    setStatus("downloading");
    await update.download();
    setStatus("done");
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="fixed bottom-5 right-5 z-50 w-88 rounded-xl border border-border bg-card p-4 shadow-xl"
    >
      <div className="mb-3 flex items-center gap-3">
        <div className="size-16 shrink-0 overflow-hidden rounded-lg border border-border bg-gradient-to-b from-amber-100/15 to-muted">
          <img
            src={mascotImg}
            alt=""
            className="size-full object-cover object-[50%_0%] pt-1"
            draggable={false}
          />
        </div>
        <div>
          <div className="text-sm font-semibold">Mise à jour disponible</div>
          <span className="mt-1 inline-block rounded-md bg-primary/10 px-1.5 py-0.5 font-mono text-xs font-medium text-primary">
            v{update.version}
          </span>
        </div>
      </div>

      {notes.length > 0 && (
        <div className="mb-4">
          <ul className="max-h-56 space-y-1 overflow-y-auto text-xs text-muted-foreground">
            {visible.map((note, i) => (
              <li key={i} className="flex gap-2">
                <span className="mt-1.5 size-1 shrink-0 rounded-full bg-muted-foreground/60" />
                <span>{note}</span>
              </li>
            ))}
          </ul>
          {hiddenCount > 0 && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="mt-2 flex items-center gap-1 text-xs font-medium text-foreground/80 hover:text-foreground"
            >
              {expanded ? "Voir moins" : `Voir les ${notes.length} nouveautés`}
              <ChevronDown
                className={`size-3.5 transition-transform ${expanded ? "rotate-180" : ""}`}
              />
            </button>
          )}
        </div>
      )}

      <div className="flex gap-2">
        <Button size="sm" onClick={handleInstall} disabled={status !== "idle"} className="flex-1">
          {status === "idle" && "Installer"}
          {status === "downloading" && "Téléchargement..."}
          {status === "done" && "Redémarrage..."}
        </Button>
        <Button size="sm" variant="ghost" onClick={onDismiss} disabled={status !== "idle"}>
          Plus tard
        </Button>
      </div>
    </motion.div>
  );
}
