import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, Pencil, Trash2, Waves, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getSavedDucks,
  removeSavedDuck,
  renameSavedDuck,
  upsertSavedDuck,
  type SavedDuck,
} from "@/lib/savedDucks";
import { DuckPreview } from "./DuckPreview";
import { injectDuck, onDuckDrop, onShopOpen, type DroppedDuck } from "./duckShopBridge";

// Saved ducks are injected into the pool only once per app launch, even if this
// component remounts (e.g. summer toggled off then on).
let injectedOnce = false;

export function DuckShop() {
  const [saved, setSaved] = useState<SavedDuck[]>([]);
  const [open, setOpen] = useState(false);
  const [dropped, setDropped] = useState<DroppedDuck | null>(null);
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  // keep a ref so the event handlers always see the current dropped duck
  const droppedRef = useRef<DroppedDuck | null>(null);
  useEffect(() => {
    droppedRef.current = dropped;
  }, [dropped]);

  useEffect(() => {
    getSavedDucks().then((list) => {
      setSaved(list);
      if (!injectedOnce) {
        injectedOnce = true;
        for (const d of list)
          injectDuck({ id: d.id, name: d.name, variant: d.variant, scale: d.scale });
      }
    });
  }, []);

  useEffect(() => {
    onDuckDrop((d) => {
      droppedRef.current?.release(); // free a previously held duck, if any
      setDropped(d);
      setName(d.name);
      setOpen(true);
    });
    onShopOpen(() => setOpen(true)); // browse the collection; keep any dropped duck
    return () => {
      onDuckDrop(null);
      onShopOpen(null);
    };
  }, []);

  function close() {
    droppedRef.current?.release(); // the held duck swims again
    setDropped(null);
    setOpen(false);
    setEditingId(null);
  }

  async function save() {
    if (!dropped) return;
    const finalName = name.trim() || "Canard sans nom";
    const entry: SavedDuck = {
      id: dropped.id,
      name: finalName,
      variant: dropped.variant,
      scale: dropped.scale,
      savedAt: Date.now(),
    };
    setSaved(await upsertSavedDuck(entry));
    dropped.markSaved(finalName);
    setDropped({ ...dropped, saved: true, name: finalName });
    toast.success(`${finalName} a rejoint ta collection`);
  }

  function release(d: SavedDuck) {
    injectDuck({ id: d.id, name: d.name, variant: d.variant, scale: d.scale });
    toast.success(`${d.name} repart nager`);
  }

  async function remove(d: SavedDuck) {
    setSaved(await removeSavedDuck(d.id));
    toast.success(`${d.name} a été relâché pour de bon`);
  }

  async function commitRename(id: string) {
    const n = editName.trim();
    if (n) setSaved(await renameSavedDuck(id, n));
    setEditingId(null);
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="duck-shop"
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.96 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className="fixed bottom-4 left-4 z-50 flex max-h-[80vh] w-80 flex-col overflow-hidden rounded-xl border border-border bg-background/95 shadow-2xl backdrop-blur"
        >
          <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
            <h2 className="text-sm font-semibold">Le Coin des Canards</h2>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={close}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {dropped && (
            <div className="flex flex-col items-center gap-3 border-b border-border bg-muted/40 px-4 py-4">
              <DuckPreview variant={dropped.variant} size={104} />
              <div className="flex w-full gap-2">
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nomme ton canard"
                  maxLength={40}
                  onKeyDown={(e) => e.key === "Enter" && save()}
                  autoFocus
                />
                <Button onClick={save}>{dropped.saved ? "Mettre à jour" : "Enregistrer"}</Button>
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto px-2 py-2">
            <p className="px-2 pb-1.5 text-xs font-medium text-muted-foreground">
              Ma collection ({saved.length})
            </p>
            {saved.length === 0 ? (
              <p className="px-2 py-6 text-center text-xs text-muted-foreground">
                Dépose un canard ici pour le sauvegarder.
              </p>
            ) : (
              <ul className="flex flex-col gap-1">
                {saved.map((d) => (
                  <li
                    key={d.id}
                    className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted/60"
                  >
                    <DuckPreview variant={d.variant} size={40} />
                    {editingId === d.id ? (
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onBlur={() => commitRename(d.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") commitRename(d.id);
                          if (e.key === "Escape") setEditingId(null);
                        }}
                        maxLength={40}
                        autoFocus
                        className="h-7 flex-1"
                      />
                    ) : (
                      <span className="flex-1 truncate text-sm">{d.name}</span>
                    )}
                    {editingId === d.id ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => commitRename(d.id)}
                        title="Valider"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </Button>
                    ) : (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => release(d)}
                          title="Relâcher dans le bassin"
                        >
                          <Waves className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => {
                            setEditingId(d.id);
                            setEditName(d.name);
                          }}
                          title="Renommer"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => remove(d)}
                          title="Supprimer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
