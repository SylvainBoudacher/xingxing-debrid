import { posterUrl } from "@/lib/posterPreload";
import { Clapperboard } from "lucide-react";

interface RadarToastPostersProps {
  posters: (string | null)[];
}

const STACK = [
  "z-30",
  "z-20 translate-x-3 rotate-6 scale-95",
  "z-10 translate-x-6 rotate-12 scale-90",
];

// Une affiche seule, ou un petit paquet en éventail pour une alerte groupée.
export function RadarToastPosters({ posters }: RadarToastPostersProps) {
  return (
    <div className={`relative h-[104px] w-[70px] shrink-0 ${posters.length > 1 ? "mr-5" : ""}`}>
      {posters.map((path, i) => (
        <div
          key={i}
          className={`absolute inset-0 overflow-hidden rounded-lg bg-zinc-800 shadow-lg ring-1 ring-white/15 ${STACK[i]}`}
        >
          {path ? (
            <img src={posterUrl(path, "w154")} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-zinc-500">
              <Clapperboard className="h-6 w-6" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
