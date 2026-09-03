import { Copy, Terminal } from "lucide-react";
import { toast } from "sonner";

export function Strong({ children }: { children: React.ReactNode }) {
  return <span className="font-medium text-zinc-700 dark:text-zinc-200">{children}</span>;
}

export function WinKey() {
  return (
    <kbd className="inline-flex items-center rounded bg-zinc-200 dark:bg-zinc-700 px-1.5 py-0.5 text-[11px] font-mono font-medium text-zinc-700 dark:text-zinc-200">
      <svg viewBox="0 0 24 24" className="h-3 w-3" fill="currentColor" aria-label="Windows">
        <path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-13.051-1.949" />
      </svg>
    </kbd>
  );
}

export function Key({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="rounded bg-zinc-200 dark:bg-zinc-700 px-1.5 py-0.5 text-[11px] font-mono font-medium text-zinc-700 dark:text-zinc-200">
      {children}
    </kbd>
  );
}

function copy(value: string) {
  navigator.clipboard.writeText(value);
  toast.success("Copie");
}

export function CopyChip({ value }: { value: string }) {
  return (
    <button
      type="button"
      onClick={() => copy(value)}
      title="Copier"
      className="group inline-flex items-center align-baseline font-mono text-[12px] font-semibold text-zinc-700 dark:text-zinc-200 bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 rounded px-1.5 py-0.5 transition-colors"
    >
      {value}
      <Copy className="h-3 w-0 ml-0 opacity-0 text-zinc-500 dark:text-zinc-400 transition-all group-hover:w-3 group-hover:ml-1 group-hover:opacity-100" />
    </button>
  );
}

export function Mono({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-mono text-[12px] text-zinc-700 dark:text-zinc-200 bg-zinc-200 dark:bg-zinc-700 rounded px-1.5 py-0.5">
      {children}
    </span>
  );
}

export function CommandBlock({ command }: { command: string }) {
  return (
    <div className="flex items-start gap-2 rounded-lg bg-zinc-900 dark:bg-black/40 px-3 py-2 ring-1 ring-white/8">
      <Terminal className="h-3.5 w-3.5 shrink-0 mt-0.5 text-zinc-500" />
      <code className="flex-1 text-[11px] font-mono text-zinc-200 leading-relaxed break-all">
        {command}
      </code>
      <button
        onClick={() => copy(command)}
        className="shrink-0 text-[11px] font-medium text-violet-400 hover:text-violet-300 transition-colors"
      >
        Copier
      </button>
    </div>
  );
}

/** Les adresses a saisir, posees juste sous l'instruction qui les demande. */
export function Addresses({ list }: { list: string[] }) {
  return (
    <span className="mt-1.5 flex flex-wrap gap-1.5">
      {list.map((a) => (
        <CopyChip key={a} value={a} />
      ))}
    </span>
  );
}
