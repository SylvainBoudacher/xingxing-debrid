import { useState } from "react";
import { motion } from "motion/react";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  ExternalLink,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
} from "lucide-react";
import { openUrl } from "@tauri-apps/plugin-opener";
import type { KeyService } from "@/lib/keyServices";

export type ScreenStatus = "idle" | "checking" | "valid" | "invalid" | "unreachable";

const BADGES = {
  free: { label: "Gratuit", className: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-400" },
  paid: { label: "Payant", className: "bg-amber-500/12 text-amber-700 dark:text-amber-400" },
};

function warning(service: KeyService, status: ScreenStatus): string | null {
  if (status === "invalid")
    return `Cette cle semble incorrecte : ${service.name} l'a refusee. Vous pouvez continuer, mais l'application ne pourra pas s'y connecter tant qu'elle n'est pas corrigee.`;
  if (status === "unreachable")
    return `Impossible de joindre ${service.name} pour verifier la cle. Elle sera peut-etre valide une fois votre connexion retablie.`;
  return null;
}

export function KeyScreen({
  service,
  value,
  status,
  onChange,
  onVerify,
  notice,
}: {
  service: KeyService;
  value: string;
  status: ScreenStatus;
  onChange: (v: string) => void;
  onVerify: () => void;
  /** Rappel affiche juste avant le bouton (cles douteuses, dernier ecran). */
  notice?: React.ReactNode;
}) {
  const [revealed, setRevealed] = useState(false);
  const badge = BADGES[service.badge];
  const message = warning(service, status);
  const empty = value.trim() === "";
  // Apres un echec on ne rejoue pas la verification : le bouton fait passer.
  const skipping = status === "invalid" || status === "unreachable";

  return (
    <div className="space-y-5 rounded-2xl bg-white/80 dark:bg-zinc-900/70 ring-1 ring-black/6 dark:ring-white/6 px-5 py-5 sm:px-6">
      <div className="flex items-center gap-3">
        <img src={service.logo} alt="" className="h-9 w-9 shrink-0 rounded-xl object-contain" />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-base font-semibold text-zinc-900 dark:text-white">
              Cle {service.name}
            </p>
            <span
              className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${badge.className}`}
            >
              {badge.label}
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">{service.tagline}</p>
        </div>
      </div>

      <ol className="space-y-3">
        {service.steps.map((step, i) => (
          <li key={i} className="flex items-center gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-600/10 text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
              {i + 1}
            </span>
            <p className="flex-1 text-sm leading-snug text-zinc-600 dark:text-zinc-300">{step}</p>
            {i === 0 && (
              <button
                type="button"
                onClick={() => openUrl(service.url)}
                className="flex shrink-0 items-center gap-1.5 rounded-lg bg-indigo-600/10 px-2.5 py-1.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-600/20 dark:text-indigo-400 transition-colors"
              >
                Ouvrir
                <ExternalLink className="h-3 w-3" />
              </button>
            )}
          </li>
        ))}
      </ol>

      <div className="relative flex items-center">
        <KeyRound className="absolute left-3 h-3.5 w-3.5 text-zinc-500 pointer-events-none" />
        <input
          type={revealed ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={service.placeholder}
          className="w-full rounded-xl bg-zinc-100 dark:bg-zinc-950/60 ring-1 ring-black/6 dark:ring-white/6 pl-9 pr-11 py-3 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-600 outline-none focus:ring-indigo-500/40 transition-all"
        />
        <button
          type="button"
          onClick={() => setRevealed((r) => !r)}
          aria-label={revealed ? "Masquer la cle" : "Afficher la cle"}
          className="absolute right-3 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
        >
          {revealed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>

      {message && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.16 }}
          className="flex items-start gap-3 rounded-xl bg-amber-500/10 ring-1 ring-amber-500/25 px-4 py-3"
        >
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
          <p className="text-xs leading-relaxed text-amber-800 dark:text-amber-200">{message}</p>
        </motion.div>
      )}

      {notice}

      <div>
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={onVerify}
          disabled={empty || status === "checking" || status === "valid"}
          className="flex w-full items-center justify-center gap-2 h-11 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40 text-sm font-semibold text-white transition-colors"
        >
          {status === "checking" && <Loader2 className="h-4 w-4 animate-spin" />}
          {status === "valid" && (
            <>
              <Check className="h-4 w-4" />
              Cle valide
            </>
          )}
          {status === "idle" && (
            <>
              Verifier
              <ArrowRight className="h-4 w-4" />
            </>
          )}
          {skipping && (
            <>
              Continuer quand meme
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </motion.button>
        {empty && (
          <p className="mt-2 text-center text-[11px] text-zinc-400 dark:text-zinc-600">
            Collez votre cle pour continuer.
          </p>
        )}
      </div>
    </div>
  );
}
