import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Check, Globe, Laptop, Server, X } from "lucide-react";

/** Largeur interieure de la carte qui porte le schema : max-w-2xl (672) moins
 *  les paddings de la page (sm:px-8) et de la carte (px-5). */
const STAGE = { width: 568, height: 188 };
const PHASE_MS = 5600;

const PHASES = [
  {
    key: "blocked",
    dnsLabel: "DNS de votre box",
    dnsHint: "celui de votre opérateur",
    caption:
      "Certains opérateurs ne répondent pas pour c411.org : l'annuaire renvoie une erreur et le site semble hors ligne.",
    liveLabel: "Votre DNS actuel",
    liveHint: "celui de votre réseau",
    liveCaption:
      "C'est ce qui se passe chez vous : votre annuaire ne répond pas pour c411.org. Changez de DNS, puis relancez le test.",
    ok: false,
  },
  {
    key: "ok",
    dnsLabel: "DNS 1.1.1.1",
    dnsHint: "Cloudflare, gratuit et public",
    caption:
      "Avec un autre annuaire, l'adresse est renvoyée normalement et XingXing joint le site. Rien d'autre ne change sur votre connexion.",
    liveLabel: "Votre DNS actuel",
    liveHint: "celui de votre réseau",
    liveCaption:
      "C'est ce qui se passe chez vous : votre annuaire répond pour c411.org et XingXing joint le site.",
    ok: true,
  },
];

/** Bandeau reserve a la legende en bas de scene : les noeuds se centrent dans
 *  ce qui reste, pas dans la scene entiere. */
const CAPTION_H = 44;
const NODE = { width: 100, height: 72, top: (STAGE.height - CAPTION_H - 72) / 2 };
const MID_W = 140;
const LEFT_X = 24;
const RIGHT_X = STAGE.width - LEFT_X - NODE.width;
/** Le noeud DNS est le pivot du schema : il doit tomber pile au centre de la scene. */
const MID_X = (STAGE.width - MID_W) / 2;

function Node({
  x,
  width,
  icon: Icon,
  title,
  subtitle,
  tone,
}: {
  x: number;
  width: number;
  icon: typeof Globe;
  title: string;
  subtitle?: string;
  tone: "neutral" | "ok" | "fail";
}) {
  const ring =
    tone === "ok"
      ? "ring-emerald-500/50"
      : tone === "fail"
        ? "ring-red-500/40"
        : "ring-black/8 dark:ring-white/10";
  return (
    <div
      className={`absolute z-10 flex flex-col items-center justify-center rounded-xl bg-white px-2 text-center ring-1 dark:bg-zinc-900 ${ring}`}
      style={{ left: x, top: NODE.top, width, height: NODE.height }}
    >
      <Icon className="mb-1 h-4 w-4 text-zinc-500 dark:text-zinc-400" />
      <p className="text-[11px] font-semibold leading-tight text-zinc-900 dark:text-white">
        {title}
      </p>
      {subtitle && (
        <p className="text-[9px] leading-tight text-zinc-500 dark:text-zinc-500">{subtitle}</p>
      )}
    </div>
  );
}

/** Sans `live`, le schema alterne les deux cas pour expliquer le principe.
 *  Avec `live`, il fige le cas reellement mesure chez l'utilisateur. */
export function DnsFlow({ live }: { live?: "ok" | "fail" }) {
  const reduced = useReducedMotion();
  const [index, setIndex] = useState(0);
  const phase = live ? PHASES[live === "ok" ? 1 : 0] : PHASES[index];

  useEffect(() => {
    if (reduced || live) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % PHASES.length), PHASE_MS);
    return () => clearInterval(id);
  }, [reduced, live]);

  const packetStart = LEFT_X + NODE.width;
  const packetEnd = RIGHT_X - packetStart;
  const packetStop = MID_X - packetStart;

  return (
    <div className="mx-auto w-full" style={{ maxWidth: STAGE.width }}>
      <div
        className="relative w-full overflow-hidden rounded-2xl bg-white/70 ring-1 ring-black/8 dark:bg-zinc-950/70 dark:ring-white/10"
        style={{ height: STAGE.height }}
      >
        {/* Cablage : trait plein avant le DNS, pointille apres tant que ca ne repond pas */}
        <div
          className="absolute h-px bg-zinc-300 dark:bg-zinc-700"
          style={{ left: packetStart, top: NODE.top + NODE.height / 2, width: MID_X - packetStart }}
        />
        <div
          className={`absolute h-px transition-colors duration-500 ${
            phase.ok
              ? "bg-emerald-500/60"
              : "bg-[repeating-linear-gradient(90deg,currentColor_0_4px,transparent_4px_8px)] text-zinc-300 dark:text-zinc-700"
          }`}
          style={{
            left: MID_X + MID_W,
            top: NODE.top + NODE.height / 2,
            width: RIGHT_X - (MID_X + MID_W),
          }}
        />

        {!reduced && (
          <motion.span
            key={phase.key}
            aria-hidden
            className={`absolute z-0 h-2 w-2 rounded-full ${phase.ok ? "bg-emerald-500" : "bg-indigo-500"}`}
            style={{ left: packetStart, top: NODE.top + NODE.height / 2 - 4 }}
            initial={{ x: 0, opacity: 0 }}
            animate={
              phase.ok
                ? { x: [0, packetEnd], opacity: [0, 1, 1, 1] }
                : { x: [0, packetStop, packetStop], opacity: [0, 1, 0] }
            }
            transition={{ duration: phase.ok ? 1.8 : 1.2, repeat: Infinity, ease: "easeInOut" }}
          />
        )}

        <Node
          x={LEFT_X}
          width={NODE.width}
          icon={Laptop}
          title="XingXing"
          subtitle="sur votre PC"
          tone="neutral"
        />

        <div
          className="absolute"
          style={{ left: MID_X, top: 0, height: STAGE.height, width: MID_W }}
        >
          <Node
            x={0}
            width={MID_W}
            icon={Server}
            title={live ? phase.liveLabel : phase.dnsLabel}
            subtitle={live ? phase.liveHint : phase.dnsHint}
            tone={phase.ok ? "ok" : "fail"}
          />
          <motion.span
            key={`${phase.key}-badge`}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: reduced ? 0 : 1.1, type: "spring", stiffness: 400, damping: 20 }}
            className={`absolute z-20 grid h-5 w-5 place-items-center rounded-full text-white ${
              phase.ok ? "bg-emerald-500" : "bg-red-500"
            }`}
            style={{ left: MID_W - 10, top: NODE.top - 10 }}
          >
            {phase.ok ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
          </motion.span>
        </div>

        <Node
          x={RIGHT_X}
          width={NODE.width}
          icon={Globe}
          title="c411.org"
          subtitle={phase.ok ? "joignable" : "injoignable"}
          tone={phase.ok ? "ok" : "neutral"}
        />

        <div className="absolute inset-x-4 bottom-3">
          <AnimatePresence mode="wait">
            <motion.p
              key={phase.key}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
              className="text-center text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400"
            >
              {live ? phase.liveCaption : phase.caption}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>

      {!live && (
        <div className="mt-2 flex items-center justify-center gap-1.5">
          {PHASES.map((p, i) => (
            <button
              key={p.key}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={p.dnsLabel}
              className={`h-1.5 rounded-full transition-all ${
                i === index ? "w-5 bg-indigo-500" : "w-1.5 bg-zinc-300 dark:bg-zinc-700"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
