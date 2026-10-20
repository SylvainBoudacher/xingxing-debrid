import { Fragment } from "react";
import type { Hint, KeyLabel } from "./minigameHints";

const ARROW_PATH: Record<string, string> = {
  up: "M5 1 L9 7 L1 7 Z",
  down: "M1 3 L9 3 L5 9 Z",
  left: "M1 5 L7 1 L7 9 Z",
  right: "M3 1 L9 5 L3 9 Z",
};

function Key({ label }: { label: KeyLabel }) {
  const arrow = ARROW_PATH[label];
  return (
    <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-[3px] border border-[#b8975a] border-b-2 bg-[#2e2216] px-1 font-sans text-[11px] leading-none font-semibold text-[#f2e2b0] not-italic">
      {arrow ? (
        <svg viewBox="0 0 10 10" className="h-2.5 w-2.5" fill="currentColor" aria-hidden>
          <path d={arrow} />
        </svg>
      ) : (
        label
      )}
    </span>
  );
}

// Consigne du mini-jeu et touches à utiliser, sous la toile.
export function MinigameHint({ hint }: { hint: Hint }) {
  return (
    <div className="px-1 pt-1.5 leading-snug">
      <p className="text-[15px]">{hint.goal}</p>
      <div className="mt-1 flex flex-wrap items-center gap-1 text-[13px] text-[#c8b890]">
        {hint.hold && <span className="mr-0.5">Maintenir</span>}
        {hint.keys.map((group, i) => (
          <Fragment key={i}>
            {i > 0 && <span className="mx-0.5">ou</span>}
            {group.map((k) => (
              <Key key={k} label={k} />
            ))}
          </Fragment>
        ))}
      </div>
    </div>
  );
}
