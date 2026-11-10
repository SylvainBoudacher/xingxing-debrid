import { Button } from "@/components/ui/button";
import { formatLastCheck } from "@/lib/radar/labels";
import { Plus, RefreshCw } from "lucide-react";

interface RadarToolbarProps {
  lastCheckAt: number | null;
  checking: boolean;
  onCheck: () => void;
  onAdd: () => void;
}

export function RadarToolbar({ lastCheckAt, checking, onCheck, onAdd }: RadarToolbarProps) {
  return (
    <div className="flex items-center justify-between gap-3">
      <p className="text-xs text-zinc-500">
        Dernière vérification : {formatLastCheck(lastCheckAt)}
      </p>
      <div className="flex shrink-0 items-center gap-2">
        <Button variant="secondary" size="sm" disabled={checking} onClick={onCheck}>
          <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${checking ? "animate-spin" : ""}`} />
          Vérifier
        </Button>
        <Button size="sm" onClick={onAdd}>
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Ajouter
        </Button>
      </div>
    </div>
  );
}
