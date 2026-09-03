import { motion } from "motion/react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Globe,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Wifi,
  XCircle,
} from "lucide-react";
import { DnsFlow } from "./DnsFlow";
import { item, stagger } from "./motionVariants";

export type DnsStatus = "idle" | "checking" | "ok" | "fail";

const REASSURANCE = [
  "Ce n'est pas un VPN : votre connexion, votre debit et votre adresse IP ne changent pas.",
  "C'est un reglage systeme standard, reversible en trente secondes.",
  "1.1.1.1 (Cloudflare) et 8.8.8.8 (Google) sont des annuaires publics et gratuits.",
];

export function NetworkStep({
  dnsStatus,
  dnsError,
  onCheck,
  onOpenGuide,
  onBack,
  onNext,
}: {
  dnsStatus: DnsStatus;
  dnsError: string;
  onCheck: () => void;
  onOpenGuide: () => void;
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <motion.div
      key="network"
      initial="hidden"
      animate="visible"
      exit={{ opacity: 0, x: -24, transition: { duration: 0.2 } }}
      variants={stagger}
      className="relative mx-auto w-full max-w-2xl px-6 pt-10 pb-12 sm:px-8 space-y-4"
    >
      <motion.div variants={item}>
        <motion.button
          whileTap={{ scale: 0.93 }}
          onClick={onBack}
          className="flex items-center gap-1.5 text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm font-medium">Retour</span>
        </motion.button>

        <div className="text-center mb-4">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white mb-2">
            Votre connexion internet
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
            XingXing a besoin d'internet, et surtout de pouvoir joindre C411. Chez certains
            operateurs, cet acces est bloque au niveau du DNS. On verifie ca tout de suite.
          </p>
        </div>
      </motion.div>

      <motion.div
        variants={item}
        className="rounded-2xl bg-white/80 dark:bg-zinc-900/70 ring-1 ring-black/6 dark:ring-white/6 px-5 py-4"
      >
        <div className="flex items-start gap-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-500/12 ring-1 ring-violet-500/20">
            <Globe className="h-4 w-4 text-violet-600 dark:text-violet-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-zinc-900 dark:text-white mb-0.5">
              Le DNS, c'est l'annuaire d'internet
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Vous tapez un nom de site, le DNS renvoie l'adresse de la machine qui l'heberge. Par
              defaut, c'est l'annuaire de votre operateur qui repond. S'il refuse de repondre pour
              c411.org, le site parait hors ligne alors qu'il fonctionne. La solution est de
              demander a un autre annuaire.
            </p>
          </div>
        </div>

        <div className="mt-4">
          <DnsFlow />
        </div>
      </motion.div>

      <motion.div
        variants={item}
        className="rounded-2xl bg-emerald-500/8 ring-1 ring-emerald-500/20 px-5 py-4"
      >
        <div className="flex items-center gap-2 mb-2">
          <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
            Changer de DNS n'a rien de risque
          </p>
        </div>
        <ul className="space-y-1.5">
          {REASSURANCE.map((line) => (
            <li
              key={line}
              className="flex gap-2 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed"
            >
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-emerald-500" />
              {line}
            </li>
          ))}
        </ul>
      </motion.div>

      <motion.div
        variants={item}
        className="rounded-2xl bg-white/80 dark:bg-zinc-900/70 ring-1 ring-black/6 dark:ring-white/6 px-5 py-4"
      >
        <div className="flex items-start gap-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-500/12 ring-1 ring-sky-500/20">
            <Wifi className="h-4 w-4 text-sky-600 dark:text-sky-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-zinc-900 dark:text-white mb-0.5">
              Ou en est votre connexion ?
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              On tente de joindre c411.org depuis votre reseau, avec vos reglages actuels.
            </p>
          </div>
        </div>

        <div className="mt-4 rounded-xl bg-zinc-100 dark:bg-zinc-950/60 ring-1 ring-black/6 dark:ring-white/6 px-4 py-3">
          <div className="flex items-center gap-3">
            {dnsStatus === "checking" && (
              <>
                <Loader2 className="h-4 w-4 shrink-0 animate-spin text-zinc-400" />
                <p className="text-xs text-zinc-500">Verification de l'acces a c411.org...</p>
              </>
            )}
            {dnsStatus === "ok" && (
              <>
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                    Votre DNS est bon.
                  </p>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    c411.org repond depuis votre reseau : vous n'avez rien a changer.
                  </p>
                </div>
              </>
            )}
            {dnsStatus === "fail" && (
              <>
                <XCircle className="h-4 w-4 shrink-0 text-red-500" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-red-600 dark:text-red-400">
                    c411.org n'est pas joignable.
                  </p>
                  <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed">
                    C'est le cas classique du DNS qui bloque. Suivez le guide, puis relancez le test
                    ici.
                  </p>
                  {dnsError && (
                    <p className="text-[10px] text-zinc-500 mt-1 font-mono break-all select-text">
                      {dnsError}
                    </p>
                  )}
                </div>
              </>
            )}
            {dnsStatus === "idle" && (
              <>
                <AlertTriangle className="h-4 w-4 shrink-0 text-zinc-400" />
                <p className="text-xs text-zinc-500">Acces a c411.org non verifie.</p>
              </>
            )}
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onCheck}
              disabled={dnsStatus === "checking"}
              className="flex items-center gap-1.5 rounded-lg bg-white dark:bg-zinc-900 ring-1 ring-black/8 dark:ring-white/10 px-2.5 h-8 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={`h-3 w-3 ${dnsStatus === "checking" ? "animate-spin" : ""}`} />
              Retester ma connexion
            </button>
            <button
              type="button"
              onClick={onOpenGuide}
              className="flex items-center gap-1.5 rounded-lg bg-violet-500/12 ring-1 ring-violet-500/20 px-2.5 h-8 text-xs font-medium text-violet-700 dark:text-violet-300 hover:bg-violet-500/20 transition-colors"
            >
              <BookOpen className="h-3 w-3" />
              Comment changer mon DNS
            </button>
          </div>
        </div>

        <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
          Changer le DNS en <span className="font-semibold">IPv4</span> ne suffit pas toujours :
          faites de meme en <span className="font-semibold">IPv6</span>, sinon le systeme peut
          continuer a utiliser l'ancien annuaire. Un antivirus, un pare-feu ou un VPN peuvent aussi
          bloquer l'acces : verifiez leurs reglages si le test echoue malgre un DNS correct.
        </p>
      </motion.div>

      <motion.div variants={item} className="pt-2">
        <motion.button
          whileTap={{ scale: dnsStatus === "ok" ? 0.98 : 1 }}
          onClick={onNext}
          disabled={dnsStatus !== "ok"}
          className="flex w-full items-center justify-center gap-2 h-11 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-indigo-600 text-sm font-semibold text-white transition-colors"
        >
          {dnsStatus === "checking" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              Continuer
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </motion.button>
        {dnsStatus === "fail" && (
          <p className="mt-2 text-center text-[11px] text-red-500 dark:text-red-400">
            c411.org doit etre joignable pour continuer : sans cela l'application ne peut rien
            chercher.
          </p>
        )}
        {dnsStatus === "idle" && (
          <p className="mt-2 text-center text-[11px] text-zinc-400 dark:text-zinc-600">
            Lancez le test d'acces a c411.org pour continuer.
          </p>
        )}
      </motion.div>
    </motion.div>
  );
}
