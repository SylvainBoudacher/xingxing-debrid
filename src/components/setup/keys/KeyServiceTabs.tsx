import { AlertTriangle, Check, Loader2 } from "lucide-react";
import { KEY_SERVICES } from "@/lib/keyServices";
import type { ScreenStatus } from "./KeyScreen";

function StatusDot({ status }: { status: ScreenStatus }) {
  if (status === "checking")
    return <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-500" />;
  if (status === "valid")
    return (
      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500">
        <Check className="h-2.5 w-2.5 text-white" />
      </span>
    );
  if (status === "invalid" || status === "unreachable")
    return <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />;
  return <span className="h-2 w-2 rounded-full bg-zinc-300 dark:bg-zinc-700" />;
}

export function KeyServiceTabs({
  activeId,
  statuses,
  onSelect,
}: {
  activeId: string;
  statuses: Record<string, ScreenStatus>;
  onSelect: (index: number) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-2.5">
      {KEY_SERVICES.map((service, i) => {
        const active = service.id === activeId;
        return (
          <button
            key={service.id}
            type="button"
            onClick={() => onSelect(i)}
            className={`flex flex-col items-center gap-2 rounded-xl px-3 py-3 transition-all duration-150 ${
              active
                ? "bg-indigo-500/[0.07] ring-2 ring-indigo-500"
                : "bg-white/60 dark:bg-zinc-900/50 ring-1 ring-black/6 dark:ring-white/6 hover:ring-black/20 dark:hover:ring-white/20"
            }`}
          >
            <img src={service.logo} alt="" className="h-7 w-7 object-contain" />
            <div className="flex items-center gap-1.5">
              <span
                className={`text-xs font-semibold ${
                  active
                    ? "text-indigo-700 dark:text-indigo-300"
                    : "text-zinc-600 dark:text-zinc-300"
                }`}
              >
                {service.name}
              </span>
              <StatusDot status={statuses[service.id] ?? "idle"} />
            </div>
          </button>
        );
      })}
    </div>
  );
}
