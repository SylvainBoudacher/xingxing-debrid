import { RadarDialog } from "@/components/radar/RadarDialog";
import { RadarExpectationFields } from "@/components/radar/RadarExpectationFields";
import { RadarSearch } from "@/components/radar/RadarSearch";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { latestSeason, newRadarEntry, radarEntryId } from "@/lib/radar/addEntry";
import { addRadarEntry } from "@/lib/radar/radarStore";
import { checkRadarEntry } from "@/lib/radar/runRadarCheck";
import { useRadar } from "@/lib/radar/useRadar";
import { tvDetail } from "@/lib/services/tmdb";
import type { TmdbItem } from "@/lib/tmdbItem";
import { useEffect, useState } from "react";

interface RadarAddDialogProps {
  item?: TmdbItem;
  season?: number;
  tmdbKey: string;
  onClose: () => void;
}

export function RadarAddDialog({
  item: initialItem,
  season,
  tmdbKey,
  onClose,
}: RadarAddDialogProps) {
  const radar = useRadar();
  const [item, setItem] = useState(initialItem ?? null);
  const [seasons, setSeasons] = useState<number[] | null>(null);
  const [selectedSeason, setSelectedSeason] = useState<number | null>(season ?? null);
  const [expectation, setExpectation] = useState(radar.defaults);

  const isSeries = item?.mediaType === "tv";

  useEffect(() => {
    if (!item || item.mediaType !== "tv") return;
    let stale = false;
    void tvDetail(item.id, tmdbKey)
      .then((detail) => {
        if (stale) return;
        const available = detail.seasons?.filter((s) => s.season_number > 0) ?? [];
        setSeasons(available.map((s) => s.season_number));
        setSelectedSeason((current) => current ?? latestSeason(available));
      })
      .catch(() => {
        if (!stale) setSeasons([]);
      });
    return () => {
      stale = true;
    };
  }, [item, tmdbKey]);

  if (!item) {
    return (
      <RadarDialog title="Ajouter au Radar" onClose={onClose}>
        <RadarSearch tmdbKey={tmdbKey} onPick={setItem} />
      </RadarDialog>
    );
  }

  const targetSeason = isSeries ? selectedSeason : null;
  const ready = !isSeries || targetSeason !== null;
  const duplicate = ready && radar.entries.some((e) => e.id === radarEntryId(item, targetSeason));

  function add() {
    const entry = newRadarEntry(item!, targetSeason, expectation, Date.now());
    addRadarEntry(entry);
    checkRadarEntry(entry.id).catch(() => {});
    onClose();
  }

  return (
    <RadarDialog title={`Ajouter : ${item.title}`} onClose={onClose}>
      {isSeries && seasons?.length === 0 && (
        <p className="text-sm text-zinc-500">Aucune saison trouvée pour cette série.</p>
      )}
      {isSeries && !!seasons?.length && selectedSeason !== null && (
        <Select value={String(selectedSeason)} onValueChange={(v) => setSelectedSeason(Number(v))}>
          <SelectTrigger aria-label="Saison">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="z-[60]">
            {seasons.map((n) => (
              <SelectItem key={n} value={String(n)}>
                Saison {n}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      <RadarExpectationFields value={expectation} onChange={setExpectation} />
      <Button disabled={!ready || duplicate} onClick={add}>
        {duplicate ? "Déjà dans Radar" : "Ajouter"}
      </Button>
    </RadarDialog>
  );
}
