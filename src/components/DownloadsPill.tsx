import type { DownloadsSummary } from "@/lib/downloadsSummary";
import { formatBytes } from "@/lib/formatBytes";
import { Check, ChevronUp, CircleAlert, Download, X } from "lucide-react";
import { motion } from "motion/react";

const SIZE = 34;
const STROKE = 3;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const RING_COLOR = {
  active: "stroke-primary",
  done: "stroke-emerald-500",
  error: "stroke-red-500",
};

function texts({ active, progress, speed, pending, state }: DownloadsSummary) {
  if (state === "error")
    return { title: "Échec d'un téléchargement", detail: "Voir les détails", pending: null };
  if (state === "done")
    return { title: "Téléchargements terminés", detail: "Afficher la liste", pending: null };
  return {
    // Entre deux fichiers d'un lot, aucun n'est actif pendant un instant.
    title: active ? `${active} téléchargement${active > 1 ? "s" : ""}` : "Démarrage",
    pending: pending > 0 ? `${pending} en attente` : null,
    detail: `${Math.round(progress * 100)} %${speed ? ` · ${formatBytes(speed)}/s` : ""}`,
  };
}

// État des téléchargements : une pilule avec un anneau de progression globale,
// le résumé en texte et un chevron qui ouvre ou ferme le panneau. Une fois tout
// terminé, une croix à côté permet de la faire disparaître.
export function DownloadsPill({
  summary,
  open,
  onToggle,
  onDismiss,
}: {
  summary: DownloadsSummary;
  open: boolean;
  onToggle: () => void;
  onDismiss: () => void;
}) {
  const { progress, state } = summary;
  const { title, detail, pending } = texts(summary);
  const label = open ? "Masquer les téléchargements" : "Afficher les téléchargements";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className="flex items-center gap-1.5"
    >
      {state !== "active" && (
        <button
          type="button"
          onClick={onDismiss}
          className="bg-background border-border text-muted-foreground hover:text-foreground flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border shadow-lg transition-colors"
          aria-label="Effacer les téléchargements terminés"
          title="Effacer les téléchargements terminés"
        >
          <X className="h-4 w-4" />
        </button>
      )}
      <motion.button
        type="button"
        onClick={onToggle}
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.97 }}
        title={label}
        aria-expanded={open}
        className="group bg-background border-border hover:border-foreground/30 hover:bg-muted flex cursor-pointer items-center gap-2.5 rounded-full border py-2 pl-2 pr-3 shadow-lg transition-colors"
      >
        <span
          className="relative flex shrink-0 items-center justify-center"
          style={{ width: SIZE, height: SIZE }}
        >
          <svg width={SIZE} height={SIZE} className="absolute inset-0 -rotate-90">
            <circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              fill="none"
              strokeWidth={STROKE}
              className="stroke-foreground/15"
            />
            <motion.circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              fill="none"
              strokeWidth={STROKE}
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              className={RING_COLOR[state]}
              initial={false}
              animate={{ strokeDashoffset: CIRCUMFERENCE * (1 - progress) }}
              transition={{ ease: "easeOut", duration: 0.3 }}
            />
          </svg>
          {state === "active" ? (
            <motion.span
              animate={{ opacity: [1, 0.35, 1] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            >
              <Download className="text-foreground h-3.5 w-3.5" />
            </motion.span>
          ) : state === "error" ? (
            <CircleAlert className="h-4 w-4 text-red-500" />
          ) : (
            <Check className="h-4 w-4 text-emerald-500" strokeWidth={2.5} />
          )}
        </span>

        <span className="text-left leading-tight">
          <span className="text-foreground block text-[13px] font-semibold">
            {title}
            {pending && (
              <span className="text-muted-foreground font-normal tabular-nums"> · {pending}</span>
            )}
          </span>
          <span className="text-muted-foreground block text-[11px] tabular-nums">{detail}</span>
        </span>

        <ChevronUp
          className={`text-muted-foreground group-hover:text-foreground h-4 w-4 shrink-0 transition-transform ${
            open ? "rotate-180" : "group-hover:-translate-y-0.5"
          }`}
        />
      </motion.button>
    </motion.div>
  );
}
