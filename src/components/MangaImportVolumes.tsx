import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { PlannedImport } from "@/lib/mangaImport";
import type { MangaItem } from "@/lib/mangaItem";
import { ArrowLeft, Loader2, Plus } from "lucide-react";

interface MangaImportVolumesProps {
  item: MangaItem;
  planned: PlannedImport[];
  importing: boolean;
  onNumber: (path: string, number: number | null) => void;
  onBack: () => void;
  onConfirm: () => void;
}

/**
 * Etape 2 de l'import : confirmer le numero de chaque fichier. Le numero est
 * pre-rempli depuis le nom du fichier, et peut rester vide (tome non
 * identifie, range en fin de liste comme les tomes de torrent non reconnus).
 */
export function MangaImportVolumes({
  item,
  planned,
  importing,
  onNumber,
  onBack,
  onConfirm,
}: MangaImportVolumesProps) {
  return (
    <>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
        <ul className="flex flex-col gap-1.5">
          {planned.map((file) => (
            <li
              key={file.path}
              className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-black/[0.03] dark:hover:bg-white/[0.04]"
            >
              <p
                title={file.path}
                className="min-w-0 flex-1 truncate text-xs text-zinc-700 dark:text-zinc-300"
              >
                {file.fileName}
              </p>
              <div className="flex flex-none items-center gap-2">
                <span className="text-[11px] text-zinc-500">Tome</span>
                <Input
                  type="number"
                  min={0}
                  value={file.number ?? ""}
                  placeholder="—"
                  onChange={(e) => {
                    const raw = e.target.value.trim();
                    onNumber(file.path, raw === "" ? null : Number(raw));
                  }}
                  className="h-8 w-20 text-center text-xs"
                />
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-black/5 p-4 dark:border-white/5">
        <Button variant="ghost" size="sm" onClick={onBack} disabled={importing}>
          <ArrowLeft />
          Changer d'oeuvre
        </Button>
        <div className="flex min-w-0 items-center gap-3">
          <p className="truncate text-xs text-zinc-500">vers « {item.title} »</p>
          <Button size="sm" onClick={onConfirm} disabled={importing}>
            {importing ? <Loader2 className="animate-spin" /> : <Plus />}
            Importer {planned.length} fichier{planned.length > 1 ? "s" : ""}
          </Button>
        </div>
      </div>
    </>
  );
}
