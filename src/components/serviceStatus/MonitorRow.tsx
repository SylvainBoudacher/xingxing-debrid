import type { ProbeSample } from "@/lib/serviceProbes";
import { UptimeBar } from "./UptimeBar";

export function MonitorRow({ label, samples }: { label: string; samples: ProbeSample[] }) {
  const ok = samples.filter((s) => s.success).length;
  const uptime = samples.length ? Math.round((ok / samples.length) * 1000) / 10 : null;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-[11px]">
        <span className="font-medium text-zinc-600 dark:text-zinc-300">{label}</span>
        <span className="tabular-nums text-zinc-400">
          {uptime === null ? "Aucune donnée" : `${uptime} % de disponibilité`}
        </span>
      </div>
      <UptimeBar samples={samples} />
    </div>
  );
}
