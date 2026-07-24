import type { ReactNode } from "react";
import { Archive, Check, ChevronDown, DoorOpen, Pencil, Waves } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { SavedDuck } from "@/lib/savedDucks";
import { getRarity, type Rarity } from "./duckRandom";
import { DuckPreview } from "./DuckPreview";

const RARITY_LABEL: Record<Rarity, string> = {
  god: "★★★★★",
  mythic: "★★★★",
  legendary: "★★★",
  rare: "★★",
  uncommon: "★",
  common: "",
};
const RARITY_BADGE: Record<Rarity, string> = {
  god: "bg-yellow-100/25 text-yellow-100 ring-1 ring-yellow-100/50",
  mythic: "bg-yellow-300/20 text-yellow-300 ring-1 ring-yellow-300/40",
  legendary: "bg-amber-400/15 text-amber-400 ring-1 ring-amber-400/30",
  rare: "bg-blue-400/15 text-blue-400 ring-1 ring-blue-400/30",
  uncommon: "bg-green-400/15 text-green-400 ring-1 ring-green-400/30",
  common: "",
};

export interface DuckShopRowProps {
  duck: SavedDuck;
  editing: boolean;
  editName: string;
  onEditNameChange: (v: string) => void;
  onStartEdit: () => void;
  onCommitRename: () => void;
  onCancelEdit: () => void;
  onPutInWater: () => void;
  onPutInReserve: () => void;
  onRelease: () => void;
  stackCount?: number;
  stackOpen?: boolean;
  onToggleStack?: () => void;
  nested?: boolean;
}

export function DuckShopRow({
  duck: d,
  editing,
  editName,
  onEditNameChange,
  onStartEdit,
  onCommitRename,
  onCancelEdit,
  onPutInWater,
  onPutInReserve,
  onRelease,
  stackCount,
  stackOpen,
  onToggleStack,
  nested,
}: DuckShopRowProps) {
  const rarity = getRarity(d.variant);
  return (
    <li
      className={`flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted/60${
        nested ? " ml-4 border-l border-border/60" : ""
      }`}
    >
      <span className={`relative ${d.reserved ? "opacity-40" : ""}`}>
        <DuckPreview variant={d.variant} size={40} />
        {stackCount !== undefined && stackCount > 1 && (
          <span className="absolute -right-0.5 -top-0.5 rounded-full bg-primary px-1 text-[10px] font-semibold leading-4 text-primary-foreground">
            {stackCount}
          </span>
        )}
      </span>
      {editing ? (
        <Input
          value={editName}
          onChange={(e) => onEditNameChange(e.target.value)}
          onBlur={onCommitRename}
          onKeyDown={(e) => {
            if (e.key === "Enter") onCommitRename();
            if (e.key === "Escape") onCancelEdit();
          }}
          maxLength={40}
          autoFocus
          className="h-7 flex-1"
        />
      ) : (
        <span className="flex flex-1 items-center gap-1.5 truncate text-sm">
          <span className={`truncate ${d.reserved ? "text-muted-foreground" : ""}`}>{d.name}</span>
          {rarity !== "common" && (
            <span
              className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold ${RARITY_BADGE[rarity]}`}
            >
              {RARITY_LABEL[rarity]}
            </span>
          )}
          {d.variant.shiny && (
            <span className="shrink-0 text-[11px] text-fuchsia-400" title="Shiny">
              ✦
            </span>
          )}
          {d.reserved && (
            <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
              réserve
            </span>
          )}
        </span>
      )}
      {editing ? (
        <IconAction label="Valider le nom" onClick={onCommitRename}>
          <Check className="h-3 w-3" />
        </IconAction>
      ) : (
        <div className="flex shrink-0 items-center [&_button]:cursor-pointer">
          {stackCount !== undefined && stackCount > 1 && (
            <IconAction
              label={stackOpen ? "Replier la pile" : `Deplier les ${stackCount} doublons`}
              onClick={() => onToggleStack?.()}
            >
              <ChevronDown
                className={`h-3 w-3 transition-transform ${stackOpen ? "rotate-180" : ""}`}
              />
            </IconAction>
          )}
          {d.reserved ? (
            <IconAction label="Remettre a l'eau" onClick={onPutInWater}>
              <Waves className="h-3 w-3" />
            </IconAction>
          ) : (
            <IconAction label="Mettre en reserve" onClick={onPutInReserve}>
              <Archive className="h-3 w-3" />
            </IconAction>
          )}
          <IconAction label="Renommer" onClick={onStartEdit}>
            <Pencil className="h-3 w-3" />
          </IconAction>
          <IconAction
            label="Relacher ce canard"
            className="text-muted-foreground hover:text-foreground"
            onClick={onRelease}
          >
            <DoorOpen className="h-3 w-3" />
          </IconAction>
        </div>
      )}
    </li>
  );
}

function IconAction({
  label,
  onClick,
  className,
  children,
}: {
  label: string;
  onClick: () => void;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={`h-6 w-6 shrink-0${className ? ` ${className}` : ""}`}
          onClick={onClick}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
