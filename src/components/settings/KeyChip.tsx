export function KeyChip({ children }: { children: string }) {
  return (
    <kbd className="rounded-md bg-black/6 dark:bg-white/10 px-2 py-1 text-[11px] font-semibold text-zinc-700 dark:text-zinc-200 ring-1 ring-black/10 dark:ring-white/10">
      {children}
    </kbd>
  );
}
