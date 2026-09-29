import { DownloadsPanel } from "@/components/DownloadsPanel";
import { DownloadsPill } from "@/components/DownloadsPill";
import {
  clearFinishedDownloads,
  getBulkDownloadSnapshot,
  getDownloadsSnapshot,
  subscribeBulkDownload,
  subscribeDownloads,
} from "@/lib/downloads";
import { summarizeDownloads } from "@/lib/downloadsSummary";
import { AnimatePresence } from "motion/react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

export function DownloadsOverlay() {
  const downloads = useSyncExternalStore(subscribeDownloads, getDownloadsSnapshot);
  const bulk = useSyncExternalStore(subscribeBulkDownload, getBulkDownloadSnapshot);
  // Un lot d'un seul fichier n'a pas besoin de récapitulatif : sa carte suffit.
  const showBulk = !!bulk && bulk.total > 1;
  const visible = downloads.length > 0 || showBulk;

  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // Liste vidée : le prochain téléchargement repart panneau fermé.
  if (!visible && open) setOpen(false);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!visible) return null;

  return (
    <div ref={rootRef} className="fixed bottom-4 right-4 z-[60] flex flex-col items-end gap-2">
      <AnimatePresence>
        {open && (
          <DownloadsPanel
            key="panel"
            downloads={downloads}
            showBulk={showBulk}
            onClose={() => setOpen(false)}
          />
        )}
      </AnimatePresence>
      <DownloadsPill
        summary={summarizeDownloads(downloads, bulk)}
        open={open}
        onToggle={() => setOpen((o) => !o)}
        onDismiss={clearFinishedDownloads}
      />
    </div>
  );
}
