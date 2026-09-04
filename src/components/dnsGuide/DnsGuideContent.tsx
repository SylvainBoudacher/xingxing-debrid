import { DNS_MAC_COMMAND, DNS_PS_COMMAND, type Os } from "./dnsData";
import { MACOS_STEPS, WINDOWS_STEPS } from "./steps";
import { CommandBlock, CopyChip, Mono, Strong } from "./ui";

export const OS_TABS = [
  ["windows", "Windows"],
  ["macos", "macOS"],
] as const;

export function OsTabs({ os, onChange }: { os: Os; onChange: (os: Os) => void }) {
  return (
    <div className="flex gap-1 rounded-xl bg-zinc-200/70 dark:bg-zinc-950/60 p-1">
      {OS_TABS.map(([value, label]) => (
        <button
          key={value}
          type="button"
          onClick={() => onChange(value)}
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
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-3 flex items-center gap-2.5">
        <span className="h-4 w-1 shrink-0 rounded-full bg-violet-500" />
        <h3 className="text-sm font-bold tracking-tight text-zinc-900 dark:text-white">{title}</h3>
        <span className="h-px flex-1 bg-black/8 dark:bg-white/8" />
      </div>
      {children}
    </section>
  );
}

export function DnsGuideContent({
  os,
  afterSteps,
}: {
  os: Os;
  /** Insere juste apres les etapes, avant le depannage : c'est la que l'action
   *  suivante a du sens une fois le DNS change. */
  afterSteps?: React.ReactNode;
}) {
  const steps = os === "windows" ? WINDOWS_STEPS : MACOS_STEPS;
  const command = os === "windows" ? DNS_PS_COMMAND : DNS_MAC_COMMAND;

  return (
    <div className="space-y-6">
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
              <p className="text-sm font-semibold text-zinc-900 dark:text-white mb-2">{title}</p>
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

      {afterSteps && <div className="pb-4">{afterSteps}</div>}

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
            Cette commande remplace toutes les etapes ci-dessus : elle applique les quatre adresses
            sur toutes vos connexions, VPN compris, et vide le cache.{" "}
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
  );
}
