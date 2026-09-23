import { useEffect, useRef } from "react";
import { Folder, Library, MousePointer2, Search } from "lucide-react";
import c411Logo from "@/assets/sources/C411.webp";
import allDebridLogo from "@/assets/sources/alldebrid.webp";
import { LINKS, NODE, NODES, PACKET, RESULTS, STAGE } from "./journeyStage";

// Entre les deux sorties d'AllDebrid, a mi-chemin de la colonne de droite.
const CHOICE = {
  x: NODES.vlc.left - 34,
  y: (NODES.vlc.top + NODES.folder.top + NODE.height) / 2 - 8,
};
import { VlcPlayerNode } from "./VlcPlayerNode";
import { playJourney, type JourneySequence } from "./journeyTimeline";

function FlowNode({
  id,
  label,
  children,
  bar,
}: {
  id: keyof typeof NODES;
  label: string;
  children: React.ReactNode;
  bar?: string;
}) {
  const { left, top } = NODES[id];
  return (
    <div
      className="absolute z-10 flex flex-col items-center justify-center gap-1 rounded-xl bg-white px-2 ring-1 ring-black/8 dark:bg-zinc-900 dark:ring-white/10"
      style={{ left, top, width: NODE.width, height: NODE.height }}
    >
      <div
        data-highlight={id}
        className="pointer-events-none absolute inset-0 rounded-xl opacity-0 ring-2 ring-indigo-500/70 shadow-[0_0_24px_rgba(99,102,241,0.35)]"
      />
      {children}
      <p className="text-[10px] font-semibold leading-none text-zinc-900 dark:text-white">
        {label}
      </p>
      {bar && (
        <div className="absolute inset-x-2 bottom-1.5 h-1 overflow-hidden rounded-full bg-black/8 dark:bg-white/10">
          <div
            {...{ [bar]: "" }}
            className="h-full origin-left rounded-full bg-indigo-500"
            style={{ transform: "scaleX(0)" }}
          />
        </div>
      )}
    </div>
  );
}

export function JourneyScene({
  onStep,
  sequenceRef,
}: {
  onStep: (step: number) => void;
  sequenceRef: React.RefObject<JourneySequence | null>;
}) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const sequence = playJourney(root, reduced, onStep);
    sequenceRef.current = sequence;
    return () => {
      sequence.revert();
      sequenceRef.current = null;
    };
    // onStep est un setter d'etat stable ; relancer la timeline le ferait repartir de zero.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div ref={rootRef} className="overflow-x-auto">
      <div
        className="relative mx-auto overflow-hidden rounded-2xl bg-zinc-50 ring-1 ring-black/8 dark:bg-zinc-950/70 dark:ring-white/10"
        style={{ width: STAGE.width, height: STAGE.height }}
      >
        {/* 1. Recherche sur C411 */}
        <div data-scene-search className="absolute inset-0 p-4">
          <div className="flex h-9 items-center gap-2 rounded-xl bg-white px-3 ring-1 ring-black/8 dark:bg-zinc-900 dark:ring-white/10">
            <Search className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
            <span
              data-query
              className="text-[13px] font-medium text-zinc-900 dark:text-white"
              style={{ clipPath: "inset(0 100% 0 0)" }}
            >
              Dune
            </span>
          </div>
          <div className="mt-3 space-y-1.5">
            {RESULTS.map((r, i) => (
              <div
                key={r.name}
                data-result
                {...(i === 0 ? { "data-result-pick": "" } : {})}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-[11px] opacity-0 ${
                  i === 0
                    ? "bg-indigo-500/10 ring-1 ring-indigo-500/30"
                    : "bg-white ring-1 ring-black/6 dark:bg-zinc-900 dark:ring-white/8"
                }`}
              >
                <span className="min-w-0 flex-1 truncate font-medium text-zinc-800 dark:text-zinc-200">
                  {r.name}
                </span>
                <span className="text-zinc-500">{r.size}</span>
                <span className="w-14 text-right text-emerald-600 dark:text-emerald-400">
                  {r.seeders} S
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 2 a 4. Le trajet du fichier */}
        <div data-scene-flow className="absolute inset-0 opacity-0">
          <svg className="absolute inset-0" width={STAGE.width} height={STAGE.height}>
            {Object.entries(LINKS).map(([id, { from, to }]) => {
              const midX = (from.x + to.x) / 2;
              return (
                <path
                  key={id}
                  d={`M ${from.x} ${from.y} C ${midX} ${from.y}, ${midX} ${to.y}, ${to.x} ${to.y}`}
                  className="fill-none stroke-zinc-300 dark:stroke-zinc-700"
                  strokeWidth={1}
                  strokeDasharray="4 4"
                />
              );
            })}
          </svg>

          {(["debrid", "library", "vlc", "folder"] as const).map((id) => (
            <span
              key={id}
              data-packet={id}
              className="absolute left-0 top-0 z-20 rounded-full bg-indigo-500 opacity-0 shadow-[0_0_10px_rgba(99,102,241,0.8)]"
              style={{ width: PACKET, height: PACKET }}
            />
          ))}

          {/* Le "ou" entre les deux sorties d'AllDebrid : c'est un choix, pas les deux. */}
          <span
            data-choice
            className="absolute z-20 rounded-full bg-indigo-600 px-1.5 py-0.5 text-[9px] font-bold uppercase text-white opacity-0"
            style={{ left: CHOICE.x, top: CHOICE.y }}
          >
            ou
          </span>

          <FlowNode id="c411" label="C411">
            <img src={c411Logo} alt="" className="h-5 w-5 rounded object-contain" />
          </FlowNode>
          <FlowNode id="debrid" label="AllDebrid" bar="data-debrid-bar">
            <img src={allDebridLogo} alt="" className="h-5 w-5 rounded object-contain" />
          </FlowNode>
          <VlcPlayerNode />
          <FlowNode id="folder" label="Télécharger" bar="data-folder-bar">
            <Folder className="h-5 w-5 text-sky-500" />
          </FlowNode>
          <FlowNode id="library" label="Bibliothèque">
            <Library className="h-5 w-5 text-zinc-400" />
          </FlowNode>
        </div>

        {/* Le curseur est dans une div : sur un SVG, anime ecrit x/y en attributs, pas en transform. */}
        <div data-cursor className="absolute left-0 top-0 z-30 opacity-0">
          <MousePointer2 className="h-4 w-4 fill-white text-zinc-900 drop-shadow" />
        </div>
      </div>
    </div>
  );
}
