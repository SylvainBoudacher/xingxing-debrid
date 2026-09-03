import { motion, useReducedMotion } from "motion/react";
import appLogo from "@/assets/logo.png";
import c411Logo from "@/assets/sources/C411.webp";
import allDebridLogo from "@/assets/sources/alldebrid.svg";
import tmdbLogo from "@/assets/sources/tmdb.svg";

const STAGE = { width: 420, height: 244 };
const CARD = { width: 238, height: 56, left: 176 };
const CARD_TOPS = [22, 94, 166];
const CARD_CENTERS = CARD_TOPS.map((t) => t + CARD.height / 2);
/** Tuile de l'app, centree sur le rang du milieu : les traits partent de son bord droit. */
const APP = { size: 64, left: 12, centerY: CARD_CENTERS[1] };
const LINK_X = APP.left + APP.size;
/** Duree d'un trajet : aller puis retour, pour montrer que l'echange va dans les deux sens. */
const PULSE_MS = 1.5;

const NODES = [
  {
    logo: c411Logo,
    name: "C411",
    role: "Trouve les films, series et musiques",
    path: `M${LINK_X},${APP.centerY} C126,${APP.centerY} 126,${CARD_CENTERS[0]} ${CARD.left},${CARD_CENTERS[0]}`,
    stroke: "#6366f1",
  },
  {
    logo: allDebridLogo,
    name: "AllDebrid",
    role: "Transforme le resultat en telechargement rapide",
    path: `M${LINK_X},${APP.centerY} L${CARD.left},${APP.centerY}`,
    stroke: "#f59e0b",
  },
  {
    logo: tmdbLogo,
    name: "TMDB",
    role: "Fournit jaquettes, resumes et notes",
    path: `M${LINK_X},${APP.centerY} C126,${APP.centerY} 126,${CARD_CENTERS[2]} ${CARD.left},${CARD_CENTERS[2]}`,
    stroke: "#10b981",
  },
];

export function ServicesFlow() {
  const reduced = useReducedMotion();

  return (
    <div
      className="relative w-full overflow-hidden rounded-2xl bg-white/70 ring-1 ring-black/8 dark:bg-zinc-950/70 dark:ring-white/10"
      style={{ height: STAGE.height }}
    >
      <div className="relative mx-auto h-full" style={{ width: STAGE.width }}>
        <svg
          className="absolute inset-0"
          width={STAGE.width}
          height={STAGE.height}
          viewBox={`0 0 ${STAGE.width} ${STAGE.height}`}
          fill="none"
          aria-hidden
        >
          {NODES.map((n, i) => (
            <g key={n.name}>
              <motion.path
                d={n.path}
                stroke={n.stroke}
                strokeOpacity={0.28}
                strokeWidth={2}
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.6, delay: 0.15 + i * 0.12, ease: "easeOut" }}
              />
              {!reduced && (
                <>
                  {/* Aller : la demande part de l'app */}
                  <motion.path
                    d={n.path}
                    pathLength={1}
                    stroke={n.stroke}
                    strokeWidth={2.5}
                    strokeLinecap="round"
                    strokeDasharray="0.14 1"
                    initial={{ strokeDashoffset: 1.14 }}
                    animate={{ strokeDashoffset: 0 }}
                    transition={{
                      duration: PULSE_MS,
                      delay: 0.6 + i * 0.3,
                      repeat: Infinity,
                      repeatDelay: PULSE_MS,
                      ease: "easeInOut",
                    }}
                  />
                  {/* Retour : le service repond a l'app */}
                  <motion.path
                    d={n.path}
                    pathLength={1}
                    stroke={n.stroke}
                    strokeOpacity={0.55}
                    strokeWidth={2.5}
                    strokeLinecap="round"
                    strokeDasharray="0.14 1"
                    initial={{ strokeDashoffset: 0 }}
                    animate={{ strokeDashoffset: 1.14 }}
                    transition={{
                      duration: PULSE_MS,
                      delay: 0.6 + i * 0.3 + PULSE_MS,
                      repeat: Infinity,
                      repeatDelay: PULSE_MS,
                      ease: "easeInOut",
                    }}
                  />
                </>
              )}
            </g>
          ))}
        </svg>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="absolute flex flex-col items-center"
          style={{ left: APP.left, top: APP.centerY - APP.size / 2, width: APP.size }}
        >
          <div
            className="relative grid w-full place-items-center rounded-2xl bg-white ring-1 ring-black/10 dark:bg-zinc-900 dark:ring-white/10"
            style={{ height: APP.size }}
          >
            {!reduced && (
              <motion.span
                aria-hidden
                className="absolute inset-0 rounded-2xl ring-2 ring-indigo-500/40"
                animate={{ opacity: [0.6, 0, 0.6], scale: [1, 1.18, 1] }}
                transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
              />
            )}
            <img src={appLogo} alt="" className="h-10 w-10 object-contain" />
          </div>
          <p className="mt-1.5 text-[10px] font-semibold text-zinc-700 dark:text-zinc-300">
            XingXing
          </p>
        </motion.div>

        {NODES.map((n, i) => (
          <motion.div
            key={n.name}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.35 + i * 0.12, ease: "easeOut" }}
            className="absolute flex items-center gap-2.5 rounded-xl bg-white px-3 ring-1 ring-black/8 dark:bg-zinc-900 dark:ring-white/10"
            style={{
              left: CARD.left,
              top: CARD_TOPS[i],
              width: CARD.width,
              height: CARD.height,
            }}
          >
            <img src={n.logo} alt="" className="h-7 w-7 shrink-0 rounded-md object-contain" />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-zinc-900 dark:text-white">{n.name}</p>
              <p className="text-[10px] leading-snug text-zinc-500 dark:text-zinc-400">{n.role}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
