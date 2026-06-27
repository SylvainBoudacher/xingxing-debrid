import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import type { PanelAccent } from "./settingsNav";

const ACCENTS: Record<PanelAccent, { box: string; icon: string }> = {
  indigo: {
    box: "bg-indigo-500/12 ring-indigo-500/25",
    icon: "text-indigo-600 dark:text-indigo-400",
  },
  amber: {
    box: "bg-amber-500/12 ring-amber-500/25",
    icon: "text-amber-600 dark:text-amber-400",
  },
};

export function SettingsPanel({
  icon: Icon,
  iconImg,
  accent = "indigo",
  title,
  subtitle,
  children,
}: {
  icon?: LucideIcon;
  iconImg?: string;
  accent?: PanelAccent;
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  const a = ACCENTS[accent];
  return (
    <section className="rounded-2xl bg-white dark:bg-[#0b0c13] ring-1 ring-black/6 dark:ring-white/6 overflow-hidden">
      <div className="flex items-center gap-3 border-b border-black/6 dark:border-white/6 bg-black/[0.02] dark:bg-white/[0.02] px-6 py-4">
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1 overflow-hidden ${a.box}`}
        >
          {iconImg ? (
            <img src={iconImg} alt="" className="h-5 w-5 rounded-full object-cover" />
          ) : (
            Icon && <Icon className={`h-4 w-4 ${a.icon}`} />
          )}
        </div>
        <div>
          <h2 className="text-base font-semibold text-zinc-900 dark:text-white tracking-tight">
            {title}
          </h2>
          <p className="text-xs text-zinc-500">{subtitle}</p>
        </div>
      </div>

      <div className="px-6 py-5">{children}</div>
    </section>
  );
}
