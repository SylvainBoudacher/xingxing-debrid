export type GardenTab = "champ" | "herbier" | "sachets" | "progression" | "atelier";

const TABS: { id: GardenTab; label: string }[] = [
  { id: "champ", label: "Champ" },
  { id: "herbier", label: "Herbier" },
  { id: "sachets", label: "Sachets" },
  { id: "progression", label: "Progression" },
  { id: "atelier", label: "Atelier" },
];

export function GardenTabs({
  tab,
  onTab,
  sachets,
  ready,
  atelier,
  brewReady,
}: {
  tab: GardenTab;
  onTab: (tab: GardenTab) => void;
  sachets: number;
  ready: number;
  atelier: boolean;
  brewReady: boolean;
}) {
  const badge = (id: GardenTab) =>
    id === "sachets"
      ? sachets
      : id === "progression"
        ? ready
        : id === "atelier"
          ? Number(brewReady)
          : 0;
  return (
    <nav className="flex gap-1 border-b border-amber-300/25 px-4 pt-2">
      {TABS.filter((t) => t.id !== "atelier" || atelier).map(({ id, label }) => (
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
          {badge(id) > 0 && (
            <span className="ml-1.5 rounded-full bg-[#c0452f] px-1.5 py-px align-middle text-[10px] font-bold text-white">
              {badge(id)}
            </span>
          )}
        </button>
      ))}
    </nav>
  );
}
