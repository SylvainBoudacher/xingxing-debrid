import { Button } from "@/components/ui/button";
import { KeyRound } from "lucide-react";

interface RadarMissingKeysProps {
  missing: string[];
  onOpenPreferences: () => void;
}

export function RadarMissingKeys({ missing, onOpenPreferences }: RadarMissingKeysProps) {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <KeyRound className="h-6 w-6 text-amber-500" />
      <p className="text-sm text-zinc-600 dark:text-zinc-300">
        Radar a besoin de {missing.join(" et ")} pour identifier les titres et chercher les sorties.
      </p>
      <Button size="sm" onClick={onOpenPreferences}>
        Ouvrir les préférences
      </Button>
    </div>
  );
}
