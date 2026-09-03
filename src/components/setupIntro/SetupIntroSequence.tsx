import { useEffect, useRef } from "react";
import { Check, Play, Plus, Search } from "lucide-react";
import film from "@/assets/xingxingImg.png";
import { CAPTIONS, STAGE } from "./stage";
import { playIntroSequence } from "./timeline";

const ROW_WIDTHS = ["62%", "45%", "54%"];

export function SetupIntroSequence() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const sequence = playIntroSequence(root, reduced);
    return () => sequence.revert();
  }, []);

  return (
    <div ref={rootRef} className="mx-auto w-full" style={{ maxWidth: STAGE.width }}>
      <div
        className="relative w-full overflow-hidden rounded-2xl bg-white/70 ring-1 ring-black/8 dark:bg-zinc-950/70 dark:ring-white/10"
        style={{ height: STAGE.height }}
      >
        {/* Temps 1 et 2 : la recherche puis l'ajout */}
        <div data-scene-search className="absolute inset-0 p-4">
          <div
            data-searchbar
            className="flex h-9 items-center gap-2 rounded-xl bg-zinc-100 px-3 opacity-0 ring-1 ring-black/6 dark:bg-zinc-900 dark:ring-white/8"
          >
            <Search className="h-3.5 w-3.5 shrink-0 text-zinc-400 dark:text-zinc-500" />
            <span
              data-query
              className="text-[13px] font-medium text-zinc-900 dark:text-white"
              style={{ clipPath: "inset(0 100% 0 0)" }}
            >
              Inception
            </span>
            <span data-caret className="h-4 w-px bg-indigo-500 opacity-0" />
          </div>

          <div className="mt-2.5 space-y-1.5">
            {ROW_WIDTHS.map((w, i) => (
              <div
                key={i}
                data-row
                className={`flex items-center gap-2.5 rounded-lg px-2 py-1.5 opacity-0 ${
                  i === 0 ? "bg-indigo-500/8 ring-1 ring-indigo-500/20" : ""
                }`}
              >
                <div className="h-8 w-6 shrink-0 rounded bg-zinc-200 dark:bg-zinc-800" />
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div
                    className="h-2 rounded-full bg-zinc-300 dark:bg-zinc-700"
                    style={{ width: w }}
                  />
                  <div className="h-1.5 w-14 rounded-full bg-zinc-200 dark:bg-zinc-800" />
                </div>
                {i === 0 && (
                  <div className="relative flex shrink-0 items-center">
                    <span
                      data-added
                      className="mr-1.5 flex items-center gap-1 rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-600 opacity-0 dark:text-emerald-400"
                    >
                      Dans la bibliothèque
                    </span>
                    <span
                      data-add
                      className="relative grid h-6 w-6 place-items-center rounded-md bg-indigo-600 text-white"
                    >
                      <Plus data-add-plus className="absolute h-3.5 w-3.5" />
                      <Check data-add-check className="absolute h-3.5 w-3.5 opacity-0" />
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Temps 3 : le lecteur */}
        <div data-scene-player className="absolute inset-0 opacity-0">
          <img data-film src={film} alt="" className="h-full w-full object-cover object-top" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-black/25" />
          <div data-controls className="absolute inset-x-3 bottom-3 opacity-0">
            <div className="h-1 overflow-hidden rounded-full bg-white/25">
              <div
                data-progress
                className="h-full w-full origin-left scale-x-0 rounded-full bg-indigo-500"
              />
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span data-play className="grid h-7 w-7 place-items-center rounded-full bg-white">
                <Play className="h-3 w-3 fill-zinc-900 text-zinc-900" />
              </span>
              <span data-time className="font-mono text-[10px] text-white/70">
                0:00
              </span>
            </div>
          </div>
        </div>

        {/* Le curseur qui joue la scene */}
        <div data-cursor className="pointer-events-none absolute left-0 top-0 opacity-0">
          <span
            data-ripple
            className="absolute -left-2.5 -top-2.5 block h-5 w-5 rounded-full bg-indigo-500/40 opacity-0"
          />
          <svg viewBox="0 0 12 18" className="relative h-4 w-3 drop-shadow-md">
            <path
              d="M1 1l9.5 8.2-4.3.5 2.4 5.1-2 1-2.4-5.2-3.2 3z"
              fill="#fff"
              stroke="#18181b"
              strokeWidth="1"
            />
          </svg>
        </div>
      </div>

      <div className="relative mt-3 h-5">
        {CAPTIONS.map((c) => (
          <span
            key={c}
            data-caption
            className="absolute inset-x-0 text-center text-sm font-semibold text-zinc-900 opacity-0 dark:text-white"
          >
            {c}
          </span>
        ))}
      </div>
    </div>
  );
}
