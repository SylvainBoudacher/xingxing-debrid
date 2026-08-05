import { Pointer } from "@/components/ui/pointer";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ReaderTurnPointerProps {
  side: "left" | "right";
}

/** Curseur des zones de tourne : un chevron vers le bord survole. */
export function ReaderTurnPointer({ side }: ReaderTurnPointerProps) {
  const Icon = side === "left" ? ChevronLeft : ChevronRight;
  return (
    <Pointer className="flex h-10 w-10 items-center justify-center rounded-full bg-black/70 text-white ring-1 ring-white/20 backdrop-blur-sm">
      <Icon className="h-5 w-5" />
    </Pointer>
  );
}
