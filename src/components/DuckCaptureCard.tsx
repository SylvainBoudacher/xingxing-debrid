import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DuckPreview } from "./DuckPreview";
import type { Variant } from "./duckTypes";

export interface DuckCaptureCardProps {
  variant: Variant;
  name: string;
  onNameChange: (v: string) => void;
  saved: boolean;
  toReserve: boolean;
  onToReserveChange: (v: boolean) => void;
  onSave: () => void;
}

// Bloc affiché quand un canard est déposé sur la boutique : aperçu, nom, et
// destination après l'enregistrement (bassin ou réserve).
export function DuckCaptureCard({
  variant,
  name,
  onNameChange,
  saved,
  toReserve,
  onToReserveChange,
  onSave,
}: DuckCaptureCardProps) {
  return (
    <div className="flex flex-col items-center gap-3 border-b border-border bg-muted/40 px-4 py-4">
      <DuckPreview variant={variant} size={104} />
      <div className="flex w-full flex-col gap-2">
        <div className="flex gap-2">
          <Input
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="Nomme ton canard"
            maxLength={40}
            onKeyDown={(e) => e.key === "Enter" && onSave()}
            autoFocus
          />
          <Button onClick={onSave}>{saved ? "Mettre à jour" : "Enregistrer"}</Button>
        </div>
        <button
          type="button"
          role="checkbox"
          aria-checked={toReserve}
          onClick={() => onToReserveChange(!toReserve)}
          className="flex items-center gap-2 text-left text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <span
            className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
              toReserve
                ? "border-primary bg-primary text-primary-foreground"
                : "border-input bg-background"
            }`}
          >
            {toReserve && <Check className="h-3 w-3" />}
          </span>
          Mettre en réserve directement
        </button>
      </div>
    </div>
  );
}
