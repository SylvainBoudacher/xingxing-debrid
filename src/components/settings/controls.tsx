import { Check } from "lucide-react";
import { motion } from "motion/react";
import type { ReactNode } from "react";

export function ViewOptionCard({
  label,
  selected,
  onClick,
  children,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col rounded-xl px-4 py-3 text-left transition-all ${
        selected
          ? "bg-indigo-500/[0.07] ring-2 ring-indigo-500"
          : "bg-white dark:bg-zinc-900/80 ring-1 ring-black/8 dark:ring-white/8 hover:ring-black/20 dark:hover:ring-white/20"
      }`}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <span
          className={`text-xs font-semibold ${selected ? "text-indigo-700 dark:text-indigo-300" : "text-zinc-500 dark:text-zinc-400"}`}
        >
          {label}
        </span>
        <span
          className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${selected ? "bg-indigo-500" : "ring-1 ring-black/15 dark:ring-white/15"}`}
        >
          {selected && <Check className="h-2.5 w-2.5 text-white" />}
        </span>
      </div>
      {children}
    </button>
  );
}

export function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
        checked ? "bg-indigo-600" : "bg-zinc-300 dark:bg-zinc-700"
      }`}
    >
      <motion.div
        initial={false}
        animate={{ x: checked ? 20 : 0 }}
        transition={{ type: "spring", stiffness: 500, damping: 35 }}
        className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow"
      />
    </button>
  );
}

/** Sélecteur segmenté (onglets pilule) pour 2-3 options courtes. */
export function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex shrink-0 rounded-lg bg-black/6 dark:bg-white/6 p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`rounded-md px-3 py-1 text-xs font-semibold transition-colors ${
            value === o.value
              ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm"
              : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** Ligne réglage standard : titre + description à gauche, contrôle à droite. */
export function SettingRow({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl bg-white dark:bg-zinc-900/80 ring-1 ring-black/8 dark:ring-white/8 px-4 py-3">
      <div>
        <p className="text-sm font-medium text-zinc-900 dark:text-white">{title}</p>
        <p className="text-xs text-zinc-500 mt-0.5">{description}</p>
      </div>
      {children}
    </div>
  );
}

/** Petit titre de sous-section à l'intérieur d'un panneau. */
export function FieldTitle({ title, hint }: { title: string; hint?: string }) {
  return (
    <>
      <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-1">{title}</h3>
      {hint && <p className="text-xs text-zinc-500 mb-5 leading-relaxed">{hint}</p>}
    </>
  );
}

export function PanelDivider() {
  return <div className="my-6 h-px bg-black/8 dark:bg-white/8" />;
}
