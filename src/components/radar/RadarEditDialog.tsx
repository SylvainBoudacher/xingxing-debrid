import { RadarDialog } from "@/components/radar/RadarDialog";
import { RadarExpectationFields } from "@/components/radar/RadarExpectationFields";
import { RadarPoster } from "@/components/radar/RadarPoster";
import { Button } from "@/components/ui/button";
import { mediaSubtitle } from "@/lib/radar/labels";
import { setRadarExpectation } from "@/lib/radar/radarStore";
import { checkRadarEntry } from "@/lib/radar/runRadarCheck";
import type { RadarEntry } from "@/lib/radar/types";
import { useState } from "react";

interface RadarEditDialogProps {
  entry: RadarEntry;
  onClose: () => void;
}

export function RadarEditDialog({ entry, onClose }: RadarEditDialogProps) {
  const { item, season } = entry;
  const [expectation, setExpectation] = useState(entry.expectation);

  function save() {
    setRadarExpectation(entry.id, expectation);
    checkRadarEntry(entry.id).catch(() => {});
    onClose();
  }

  return (
    <RadarDialog
      title={season === null ? item.title : `${item.title}, saison ${season}`}
      subtitle={mediaSubtitle(item)}
      aside={<RadarPoster path={item.posterPath} />}
      onClose={onClose}
    >
      <RadarExpectationFields value={expectation} onChange={setExpectation} />
      <Button onClick={save}>Enregistrer</Button>
    </RadarDialog>
  );
}
