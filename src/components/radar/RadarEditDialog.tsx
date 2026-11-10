import { RadarDialog } from "@/components/radar/RadarDialog";
import { RadarExpectationFields } from "@/components/radar/RadarExpectationFields";
import { Button } from "@/components/ui/button";
import { setRadarExpectation } from "@/lib/radar/radarStore";
import { checkRadarEntry } from "@/lib/radar/runRadarCheck";
import type { RadarEntry } from "@/lib/radar/types";
import { useState } from "react";

interface RadarEditDialogProps {
  entry: RadarEntry;
  onClose: () => void;
}

export function RadarEditDialog({ entry, onClose }: RadarEditDialogProps) {
  const [expectation, setExpectation] = useState(entry.expectation);

  function save() {
    setRadarExpectation(entry.id, expectation);
    checkRadarEntry(entry.id).catch(() => {});
    onClose();
  }

  return (
    <RadarDialog title={`Modifier : ${entry.item.title}`} onClose={onClose}>
      <RadarExpectationFields value={expectation} onChange={setExpectation} />
      <Button onClick={save}>Enregistrer</Button>
    </RadarDialog>
  );
}
