export type GardenTab = "champ" | "herbier";

const TABS: { id: GardenTab; label: string }[] = [
  { id: "champ", label: "Champ" },
  { id: "herbier", label: "Herbier" },
];

export function GardenTabs({ tab, onTab }: { tab: GardenTab; onTab: (tab: GardenTab) => void }) {
  return (
    <nav className="flex gap-1 border-b border-amber-300/25 px-4 pt-2">
      {TABS.map(({ id, label }) => (
        <button
          key={id}
          onClick={() => onTab(id)}
          aria-pressed={tab === id}
          className={`rounded-t-lg px-4 py-2 font-serif text-lg font-semibold ${
            tab === id
              ? "bg-amber-300/10 text-[#f3dca0] shadow-[inset_0_-2px_0_#d9b46a]"
              : "text-[#a99a8a] hover:text-[#f3dca0]"
          }`}
        >
          {label}
        </button>
      ))}
    </nav>
  );
}
