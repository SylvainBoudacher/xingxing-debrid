import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Archive, Check, ListFilter, Pencil, Search, Trash2, Waves, X } from "lucide-react";
import { toast } from "sonner";
import { LazyStore } from "@tauri-apps/plugin-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  getSavedDucks,
  removeSavedDuck,
  renameSavedDuck,
  reserveDucks,
  setDuckReserved,
  upsertSavedDuck,
  type SavedDuck,
} from "@/lib/savedDucks";
import { recordDiscovery } from "@/lib/duckDex";
import { getRarity, type Rarity } from "./duckRandom";
import { DuckPreview } from "./DuckPreview";
import {
  injectDuck,
  isOverShopIcon,
  onDuckDrop,
  onDucksReserved,
  onShopOpen,
  poolSize,
  releaseDuck,
  removeDuck,
  type DroppedDuck,
} from "./duckShopBridge";

// Saved ducks are injected into the pool only once per app launch, even if this
// component remounts (e.g. summer toggled off then on).
let injectedOnce = false;

// Same settings file as App: read the display cap directly so the launch
// reservation isn't racing the prop that App loads asynchronously.
const settings = new LazyStore("settings.json", { defaults: {}, autoSave: false });
async function getMaxDucks(): Promise<number> {
  return (await settings.get<number>("summer_pool_max_ducks")) ?? 15;
}

const RARITY_LABEL: Record<Rarity, string> = {
  mythic: "★★★★",
  legendary: "★★★",
  rare: "★★",
  uncommon: "★",
  common: "",
};
const RARITY_BADGE: Record<Rarity, string> = {
  mythic: "bg-yellow-300/20 text-yellow-300 ring-1 ring-yellow-300/40",
  legendary: "bg-amber-400/15 text-amber-400 ring-1 ring-amber-400/30",
  rare: "bg-blue-400/15 text-blue-400 ring-1 ring-blue-400/30",
  uncommon: "bg-green-400/15 text-green-400 ring-1 ring-green-400/30",
  common: "",
};

type Filter = "all" | "water" | "reserve";
const FILTER_LABELS: Record<Filter, string> = {
  all: "Tous",
  water: "À l'eau",
  reserve: "En réserve",
};

type Sort = "default" | "rarity";
const RARITY_ORDER: Record<Rarity, number> = {
  mythic: 0,
  legendary: 1,
  rare: 2,
  uncommon: 3,
  common: 4,
};

export function DuckShop() {
  const [saved, setSaved] = useState<SavedDuck[]>([]);
  const [open, setOpen] = useState(false);
  const [dropped, setDropped] = useState<DroppedDuck | null>(null);
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<Sort>("default");

  // keep a ref so the event handlers always see the current dropped duck
  const droppedRef = useRef<DroppedDuck | null>(null);
  useEffect(() => {
    droppedRef.current = dropped;
  }, [dropped]);

  const panelRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [scroll, setScroll] = useState({ up: false, down: false });

  function updateScroll() {
    const el = listRef.current;
    if (!el) return;
    const up = el.scrollTop > 4;
    const down = el.scrollTop + el.clientHeight < el.scrollHeight - 4;
    setScroll((s) => (s.up === up && s.down === down ? s : { up, down }));
  }
  useEffect(updateScroll, [saved, open, query, filter]);

  useEffect(() => {
    (async () => {
      let list = await getSavedDucks();
      if (!injectedOnce) {
        injectedOnce = true;
        const max = await getMaxDucks();
        const inWater = list.filter((d) => !d.reserved);
        if (inWater.length > max) {
          const overflow = inWater.slice(max).map((d) => d.id);
          list = await reserveDucks(overflow);
          toast.info(
            `${overflow.length} canard${overflow.length > 1 ? "s" : ""} mis en réserve (limite d'affichage : ${max})`,
          );
        }
        for (const d of list)
          if (!d.reserved)
            injectDuck({ id: d.id, name: d.name, variant: d.variant, scale: d.scale });
      }
      setSaved(list);
    })();
  }, []);

  useEffect(() => {
    onDuckDrop((d) => {
      droppedRef.current?.release(); // free a previously held duck, if any
      setDropped(d);
      setName(d.name);
      setOpen(true);
    });
    onShopOpen(() => setOpen((prev) => !prev)); // toggle the collection panel
    onDucksReserved((ids) => {
      reserveDucks(ids).then((list) => {
        setSaved(list);
        toast.info(
          `${ids.length} canard${ids.length > 1 ? "s" : ""} mis en réserve (limite abaissée)`,
        );
      });
    });
    return () => {
      onDuckDrop(null);
      onShopOpen(null);
      onDucksReserved(null);
    };
  }, []);

  // Close when clicking anywhere outside the panel. Clicks on the canvas shop
  // icon are ignored here so the icon keeps owning open/close.
  useEffect(() => {
    if (!open) return;
    function onDown(e: PointerEvent) {
      const t = e.target as HTMLElement;
      if (panelRef.current?.contains(t)) return;
      if (t.closest("[data-radix-popper-content-wrapper]")) return; // filter dropdown (portaled)
      if (isOverShopIcon(e.clientX, e.clientY)) return;
      close();
    }
    window.addEventListener("pointerdown", onDown);
    return () => window.removeEventListener("pointerdown", onDown);
  }, [open]);

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
    const disc = await recordDiscovery(entry.variant);
    dropped.markSaved(finalName);
    setDropped({ ...dropped, saved: true, name: finalName });
    toast.success(`${finalName} a rejoint ta collection`);
    if (disc.newSpecies) {
      const complete = disc.discoveredSpecies === disc.totalSpecies;
      toast.success(`Nouvelle espèce découverte : ${disc.species.name} !`, {
        description: complete
          ? "Canardex complet ! Ouvre le pokédex pour réclamer ta récompense."
          : `Canardex : ${disc.discoveredSpecies}/${disc.totalSpecies} espèces`,
        duration: 6000,
      });
    } else if (disc.newColor) {
      toast.info(`Nouvelle couleur pour ${disc.species.name}`, {
        description: `${disc.colorCount}/${disc.species.maxColors} couleurs collectionnées`,
      });
    }
  }

  async function putInWater(d: SavedDuck) {
    const max = await getMaxDucks();
    if (poolSize() >= max) {
      toast.warning(
        `Le bassin est plein (${max} canards). Retire un canard de l'eau, ou augmente la limite dans les paramètres.`,
      );
      return;
    }
    setSaved(await setDuckReserved(d.id, false));
    injectDuck({ id: d.id, name: d.name, variant: d.variant, scale: d.scale });
    toast.success(`${d.name} repart nager`);
  }

  async function putInReserve(d: SavedDuck) {
    setSaved(await setDuckReserved(d.id, true));
    removeDuck(d.id);
    toast.success(`${d.name} est mis en réserve`);
  }

  async function remove(d: SavedDuck) {
    setSaved(await removeSavedDuck(d.id));
    releaseDuck(d.id);
    toast.success(`${d.name} a été relâché pour de bon`);
  }

  async function commitRename(id: string) {
    const n = editName.trim();
    if (n) setSaved(await renameSavedDuck(id, n));
    setEditingId(null);
  }

  const q = query.trim().toLowerCase();
  const visible = saved
    .filter((d) => {
      if (filter === "water" && d.reserved) return false;
      if (filter === "reserve" && !d.reserved) return false;
      return d.name.toLowerCase().includes(q);
    })
    .sort((a, b) => {
      if (sort !== "rarity") return 0;
      return RARITY_ORDER[getRarity(a.variant)] - RARITY_ORDER[getRarity(b.variant)];
    });

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={panelRef}
          key="duck-shop"
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.96 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className="fixed bottom-24 left-4 z-50 flex max-h-[80vh] w-80 flex-col overflow-hidden rounded-xl border border-border bg-background/95 shadow-2xl backdrop-blur"
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

          <div className="px-2 py-2">
            <p className="px-2 pb-1.5 text-xs font-medium text-muted-foreground">
              Ma collection ({saved.length}) · {saved.filter((d) => !d.reserved).length} à l'eau
            </p>
            {saved.length > 0 && (
              <div className="mb-1.5 flex items-center gap-1.5 px-2">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Rechercher un canard"
                    className="h-8 pl-8"
                  />
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8 shrink-0 gap-1.5 px-2.5">
                      <ListFilter className="h-3.5 w-3.5" />
                      <span className="text-xs">{FILTER_LABELS[filter]}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuRadioGroup
                      value={filter}
                      onValueChange={(v) => setFilter(v as Filter)}
                    >
                      <DropdownMenuRadioItem value="all">Tous</DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="water">À l'eau</DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="reserve">En réserve</DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                    <DropdownMenuSeparator />
                    <DropdownMenuRadioGroup value={sort} onValueChange={(v) => setSort(v as Sort)}>
                      <DropdownMenuRadioItem value="default">
                        Ordre par défaut
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="rarity">Par rareté</DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
            {saved.length === 0 ? (
              <p className="px-2 py-6 text-center text-xs text-muted-foreground">
                Dépose un canard ici pour le sauvegarder.
              </p>
            ) : visible.length === 0 ? (
              <p className="px-2 py-6 text-center text-xs text-muted-foreground">
                Aucun canard ne correspond.
              </p>
            ) : (
              // ~7.5 ducks visible (row ≈ 52px + 4px gap) so the next one peeks,
              // plus a fade mask top/bottom that signals there's more to scroll
              <ul
                ref={listRef}
                onScroll={updateScroll}
                className="flex max-h-[418px] flex-col gap-1 overflow-y-auto"
                style={{
                  maskImage: `linear-gradient(to bottom, ${scroll.up ? "transparent" : "black"}, black 24px, black calc(100% - 24px), ${scroll.down ? "transparent" : "black"})`,
                  WebkitMaskImage: `linear-gradient(to bottom, ${scroll.up ? "transparent" : "black"}, black 24px, black calc(100% - 24px), ${scroll.down ? "transparent" : "black"})`,
                }}
              >
                {visible.map((d) => {
                  const rarity = getRarity(d.variant);
                  return (
                    <li
                      key={d.id}
                      className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted/60"
                    >
                      <span className={d.reserved ? "opacity-40" : ""}>
                        <DuckPreview variant={d.variant} size={40} />
                      </span>
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
                        <span className="flex flex-1 items-center gap-1.5 truncate text-sm">
                          <span className={`truncate ${d.reserved ? "text-muted-foreground" : ""}`}>
                            {d.name}
                          </span>
                          {rarity !== "common" && (
                            <span
                              className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold ${RARITY_BADGE[rarity]}`}
                            >
                              {RARITY_LABEL[rarity]}
                            </span>
                          )}
                          {d.reserved && (
                            <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                              réserve
                            </span>
                          )}
                        </span>
                      )}
                      {editingId === d.id ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 shrink-0"
                          onClick={() => commitRename(d.id)}
                          title="Valider"
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                      ) : (
                        <div className="flex shrink-0 items-center [&_button]:cursor-pointer">
                          {d.reserved ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => putInWater(d)}
                              title="Mettre à l'eau"
                            >
                              <Waves className="h-3 w-3" />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => putInReserve(d)}
                              title="Mettre en réserve"
                            >
                              <Archive className="h-3 w-3" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => {
                              setEditingId(d.id);
                              setEditName(d.name);
                            }}
                            title="Renommer"
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-destructive hover:text-destructive"
                            onClick={() => remove(d)}
                            title="Supprimer"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
