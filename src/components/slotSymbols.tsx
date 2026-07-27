import type { SlotSymbol } from "@/game/slots";
import { SYMBOL_LABELS } from "./slotCopy";

// Les symboles des rouleaux, en SVG plutôt qu'en canvas: ils vivent dans un
// rouleau qui défile en CSS, et un <svg> se laisse empiler et animer sans
// contexte de dessin.

function DuckBody({ body, beak = "#F5811F" }: { body: string; beak?: string }) {
  return (
    <>
      <ellipse cx="15" cy="21.5" rx="10.5" ry="6.5" fill={body} />
      <circle cx="21" cy="12.5" r="5.5" fill={body} />
      <path d="M26 11.5 L31.5 13 L26 14.6 Z" fill={beak} />
      <circle cx="22.6" cy="10.8" r="1.1" fill="#22222A" />
    </>
  );
}

function Symbol({ symbol }: { symbol: SlotSymbol }) {
  if (symbol === "seven") {
    return (
      <>
        <path d="M8 6 H24 L16 27 H10.5 L17.5 11 H8 Z" fill="#FF3B7B" />
        <path d="M10.5 8 H21.5 L14.5 25 H13 L19.5 9.8 H10.5 Z" fill="#FFE9F2" />
      </>
    );
  }
  if (symbol === "crown") {
    return (
      <>
        <path d="M5 22 L7 9 L12.5 15 L16 7 L19.5 15 L25 9 L27 22 Z" fill="#F5C518" />
        <rect x="5" y="22" width="22" height="4" rx="1" fill="#E8A400" />
        <circle cx="16" cy="18" r="1.8" fill="#FFF3B0" />
      </>
    );
  }
  if (symbol === "golden") {
    return (
      <>
        <DuckBody body="#F5C518" beak="#E8A400" />
        <path d="M6 8 l1.2 2.6 L10 12 l-2.8 1.2 L6 16 l-1.2-2.8 L2 12 l2.8-1.4 Z" fill="#FFF3B0" />
      </>
    );
  }
  if (symbol === "wizard") {
    return (
      <>
        <DuckBody body="#C9A8FF" />
        <path d="M13 8 L21 -1 L27 8 Z" fill="#5B3FA8" transform="translate(0,2)" />
        <rect x="12.5" y="9.5" width="15" height="2.6" rx="1.3" fill="#3E2B78" />
        <path
          d="M20 3 l0.8 1.8 L22.6 5.6 l-1.8 0.8 L20 8.2 l-0.8-1.8 L17.4 5.6 l1.8-0.8 Z"
          fill="#FFE066"
        />
      </>
    );
  }
  if (symbol === "glasses") {
    return (
      <>
        <DuckBody body="#A7D8FF" />
        <rect x="17" y="9.2" width="10.5" height="3.4" rx="1.2" fill="#22222A" />
        <rect x="15.8" y="10" width="1.6" height="1.6" fill="#22222A" />
      </>
    );
  }
  return <DuckBody body="#FFD21E" />;
}

export function SlotSymbolIcon({ symbol, size = 44 }: { symbol: SlotSymbol; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-label={SYMBOL_LABELS[symbol]}>
      <Symbol symbol={symbol} />
    </svg>
  );
}
