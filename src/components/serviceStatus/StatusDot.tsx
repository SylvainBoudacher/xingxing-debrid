import { cn } from "@/lib/utils";

export type DotTone = "ok" | "down" | "unknown";

const TONES: Record<DotTone, string> = {
  ok: "bg-emerald-500",
  down: "bg-red-500",
  unknown: "bg-zinc-400",
};

// Pastille avec onde qui pulse (sauf état inconnu).
export function StatusDot({ tone, className }: { tone: DotTone; className?: string }) {
  return (
    <span className={cn("relative flex h-2.5 w-2.5 shrink-0", className)}>
      {tone !== "unknown" && (
        <span
          className={cn(
            "absolute inline-flex h-full w-full animate-ping rounded-full opacity-60",
            TONES[tone],
            tone === "ok" && "[animation-duration:2.4s]",
          )}
        />
      )}
      <span className={cn("relative inline-flex h-full w-full rounded-full", TONES[tone])} />
    </span>
  );
}
