import type { ReactNode } from "react";

export function RadarField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-zinc-600 dark:text-zinc-300">{label}</p>
      {children}
    </div>
  );
}
