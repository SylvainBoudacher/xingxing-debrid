import { useState } from "react";
import { motion } from "motion/react";
import { Globe, X } from "lucide-react";
import { DNS_MAC_COMMAND, DNS_PS_COMMAND, detectedOs, type Os } from "./dnsGuide/dnsData";
import { MACOS_STEPS, WINDOWS_STEPS } from "./dnsGuide/steps";
import { CommandBlock, CopyChip, Mono, Strong } from "./dnsGuide/ui";

const OS_TABS = [
  ["windows", "Windows"],
  ["macos", "macOS"],
] as const;

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">{title}</h3>
      {children}
    </section>
  );
}

export function DnsGuideModal({ onClose }: { onClose: () => void }) {
  const [os, setOs] = useState<Os>(detectedOs);
  const steps = os === "windows" ? WINDOWS_STEPS : MACOS_STEPS;
  const command = os === "windows" ? DNS_PS_COMMAND : DNS_MAC_COMMAND;

  return (
    <motion.div
      key="dns-guide"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 8 }}
        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl bg-[#f4f6fc] dark:bg-zinc-900 ring-1 ring-black/8 dark:ring-white/8 shadow-2xl overflow-hidden"
      >
        <div className="px-6 pt-5 pb-4 border-b border-black/6 dark:border-white/6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-500/12 ring-1 ring-violet-500/20">
                <Globe className="h-4 w-4 text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <p className="text-base font-semibold text-zinc-900 dark:text-white">
                  Changer son DNS
                </p>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Suivez les etapes dans l'ordre. Comptez deux minutes.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <div className="flex gap-1 rounded-xl bg-zinc-200/70 dark:bg-zinc-950/60 p-1">
                {OS_TABS.map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setOs(value)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                      os === value
                        ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow"
                        : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <button
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-black/6 dark:hover:bg-white/6 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          <ol className="space-y-3">
            {steps.map(({ title, lines, note }, i) => (
              <li
                key={`${os}-${i}`}
                className="flex gap-3.5 rounded-2xl bg-white/70 dark:bg-zinc-950/40 ring-1 ring-black/8 dark:ring-white/8 px-4 py-3.5"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-600 text-[11px] font-bold text-white">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-zinc-900 dark:text-white mb-2">
                    {title}
                  </p>
                  <ul className="space-y-1.5">
                    {lines.map((line, j) => (
                      <li
                        key={j}
                        className="flex gap-2 text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed"
                      >
                        <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-violet-500" />
                        <span>{line}</span>
                      </li>
                    ))}
                  </ul>
                  {note && (
                    <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                      {note}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ol>

          <Section title="Si c411.org reste inaccessible">
            <div className="rounded-2xl bg-white/70 dark:bg-zinc-950/40 ring-1 ring-black/8 dark:ring-white/8 px-4 py-4 space-y-3">
              <div>
                <p className="text-sm font-semibold text-zinc-900 dark:text-white mb-1">
                  Redemarrez XingXing
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  Fermez puis rouvrez l'application avant de retester : elle garde en memoire les
                  adresses deja resolues.
                </p>
              </div>
              <div>
                <p className="text-sm font-semibold text-zinc-900 dark:text-white mb-1">
                  Coupez votre VPN ou votre antivirus le temps d'un test
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  Un antivirus, un pare-feu ou un VPN peut bloquer l'acces meme avec un DNS correct.
                </p>
              </div>
              <div>
                <p className="text-sm font-semibold text-zinc-900 dark:text-white mb-1">
                  Verifiez le fichier hosts
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  {os === "windows" ? (
                    <>
                      Ouvrez le Bloc-notes en administrateur, puis le fichier{" "}
                      <Mono>C:\Windows\System32\drivers\etc\hosts</Mono>.
                    </>
                  ) : (
                    <>
                      Dans le Terminal, tapez <CopyChip value="sudo nano /etc/hosts" /> (Ctrl+O pour
                      enregistrer, Ctrl+X pour quitter).
                    </>
                  )}{" "}
                  Si une ligne mentionne <Mono>c411.org</Mono>, supprimez-la et enregistrez.
                </p>
              </div>
            </div>
          </Section>

          <Section title="Pour les utilisateurs avances">
            <div className="rounded-2xl bg-white/70 dark:bg-zinc-950/40 ring-1 ring-black/8 dark:ring-white/8 px-4 py-4">
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed mb-2">
                Cette commande remplace toutes les etapes ci-dessus : elle applique les quatre
                adresses sur toutes vos connexions, VPN compris, et vide le cache.{" "}
                {os === "windows" ? (
                  <>
                    A coller dans <Strong>PowerShell en administrateur</Strong>.
                  </>
                ) : (
                  <>
                    A coller dans le <Strong>Terminal</Strong> ; votre mot de passe sera demande.
                  </>
                )}
              </p>
              <CommandBlock command={command} />
            </div>
          </Section>
        </div>

        <div className="px-6 py-4 border-t border-black/6 dark:border-white/6">
          <button
            onClick={onClose}
            className="w-full h-10 rounded-xl bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-sm font-medium text-zinc-700 dark:text-zinc-300 transition-colors"
          >
            Fermer
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
