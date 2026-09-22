import { GOLD } from "./nodeStyle";

const ITEMS = [
  { label: "Terminé", dot: { background: GOLD } },
  { label: "En cours", dot: { background: "#8fcf5a" } },
  { label: "Prêt", dot: { background: "#f3dca0", boxShadow: "0 0 6px #f3dca0" } },
  { label: "Verrouillé", dot: { border: "1px dashed #8a7866" } },
];

export function TreeLegend() {
  return (
    <ul className="absolute bottom-3 left-4 flex gap-3 text-[11px] text-[#a99a8a]">
      {ITEMS.map(({ label, dot }) => (
        <li key={label} className="flex items-center gap-1.5">
          <i className="block size-2.5 rounded-full" style={dot} />
          {label}
        </li>
      ))}
    </ul>
  );
}
