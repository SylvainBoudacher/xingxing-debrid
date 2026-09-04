import { AlertTriangle, CheckCircle2, Loader2, RefreshCw, Wifi, XCircle } from "lucide-react";
import { DnsFlow } from "./DnsFlow";
import type { DnsStatus } from "./NetworkStep";

export function NetworkCheck({
  sectionRef,
  dnsStatus,
  dnsError,
  onCheck,
}: {
  sectionRef: React.Ref<HTMLElement>;
  dnsStatus: DnsStatus;
  dnsError: string;
  onCheck: () => void;
}) {
  return (
    <section ref={sectionRef}>
      <div className="flex items-center gap-2 px-1 pb-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
          Votre test
        </span>
        <span className="h-px flex-1 bg-black/8 dark:bg-white/8" />
      </div>

      <div
        className={`rounded-2xl bg-white/80 dark:bg-zinc-900/70 ring-1 px-5 py-4 transition-colors ${
          dnsStatus === "ok"
            ? "ring-emerald-500/50"
            : dnsStatus === "fail"
              ? "ring-red-500/50"
              : "ring-black/6 dark:ring-white/6"
        }`}
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

        {(dnsStatus === "ok" || dnsStatus === "fail") && (
          <div className="mt-4">
            <DnsFlow live={dnsStatus} />
          </div>
        )}

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
          </div>
        </div>

        {dnsStatus === "fail" && (
          <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
            Changer le DNS en <span className="font-semibold">IPv4</span> ne suffit pas toujours :
            faites de meme en <span className="font-semibold">IPv6</span>, sinon le systeme peut
            continuer a utiliser l'ancien annuaire. Un antivirus, un pare-feu ou un VPN peuvent
            aussi bloquer l'acces : verifiez leurs reglages si le test echoue malgre un DNS correct.
          </p>
        )}
      </div>
    </section>
  );
}
