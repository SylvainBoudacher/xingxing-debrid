import { RadarLayoutToggle } from "@/components/radar/RadarLayoutToggle";
import { Button } from "@/components/ui/button";
import { simulateRadarCheck } from "@/lib/radar/devSimulation";
import { formatLastCheck } from "@/lib/radar/labels";
import type { RadarLayout } from "@/lib/radar/types";
import { FlaskConical, Plus, RefreshCw } from "lucide-react";

interface RadarToolbarProps {
  lastCheckAt: number | null;
  checking: boolean;
  layout: RadarLayout;
  onLayoutChange: (layout: RadarLayout) => void;
  onCheck: () => void;
  onAdd: () => void;
}

export function RadarToolbar({
  lastCheckAt,
  checking,
  layout,
  onLayoutChange,
  onCheck,
  onAdd,
}: RadarToolbarProps) {
  return (
    <div className="flex items-center justify-between gap-3">
      <p className="text-xs text-zinc-500">
        Dernière vérification : {formatLastCheck(lastCheckAt)}
      </p>
      <div className="flex shrink-0 items-center gap-2">
        {import.meta.env.DEV && (
          <Button
            variant="outline"
            size="sm"
            className="opacity-0 transition-opacity hover:opacity-100 focus-visible:opacity-100"
            disabled={checking}
            onClick={simulateRadarCheck}
            title="Simule une vérification qui trouve l'épisode 5 sur 10"
          >
            <FlaskConical className="mr-1.5 h-3.5 w-3.5" />
            Simuler
          </Button>
        )}
        <RadarLayoutToggle layout={layout} onChange={onLayoutChange} />
        <Button
          variant="secondary"
          size="sm"
          className="transition-colors hover:bg-zinc-600 hover:text-white"
          disabled={checking}
          onClick={onCheck}
        >
          <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${checking ? "animate-spin" : ""}`} />
          Vérifier
        </Button>
        <Button size="sm" className="transition-colors hover:bg-primary/75" onClick={onAdd}>
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Ajouter
        </Button>
      </div>
    </div>
  );
}
