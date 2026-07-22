import { useState } from "react";
import { motion } from "motion/react";
import { AlertTriangle, Copy, Globe, Terminal, X } from "lucide-react";
import { toast } from "sonner";

// Applique le DNS Cloudflare a toutes les cartes actives en une fois (utile si VPN
// ou plusieurs interfaces : changer une seule carte via l'UI ne suffit pas toujours).
const DNS_PS_COMMAND =
  'Get-NetAdapter | Where-Object Status -eq "Up" | Set-DnsClientServerAddress -ServerAddresses ("1.1.1.1","1.0.0.1"); ipconfig /flushdns';

// Idem pour macOS : applique le DNS sur tous les services reseau puis vide le cache.
const DNS_MAC_COMMAND =
  'networksetup -listallnetworkservices | tail -n +2 | while read s; do sudo networksetup -setdnsservers "$s" 1.1.1.1 1.0.0.1; done; sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder';

type Os = "windows" | "macos";

const detectedOs: Os = navigator.userAgent.includes("Mac") ? "macos" : "windows";

function WinKey() {
  return (
    <kbd className="inline-flex items-center rounded bg-zinc-200 dark:bg-zinc-700 px-1.5 py-0.5 text-[11px] font-mono font-medium text-zinc-700 dark:text-zinc-200">
      <svg viewBox="0 0 24 24" className="h-3 w-3" fill="currentColor" aria-label="Windows">
        <path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-13.051-1.949" />
      </svg>
    </kbd>
  );
}

function Strong({ children }: { children: React.ReactNode }) {
  return <span className="font-medium text-zinc-700 dark:text-zinc-300">{children}</span>;
}

function CopyChip({ value }: { value: string }) {
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard.writeText(value);
        toast.success("Commande copiee");
      }}
      title="Copier"
      className="group inline-flex items-center align-baseline font-sans tracking-wide text-[12px] font-semibold text-zinc-700 dark:text-zinc-300 bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 rounded px-1.5 py-0.5 transition-colors"
    >
      {value}
      <Copy className="h-3 w-0 ml-0 opacity-0 text-zinc-500 dark:text-zinc-400 transition-all group-hover:w-3 group-hover:ml-1 group-hover:opacity-100" />
    </button>
  );
}

function Mono({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-mono text-[12px] text-zinc-700 dark:text-zinc-300 bg-zinc-200 dark:bg-zinc-700 rounded px-1.5 py-0.5">
      {children}
    </span>
  );
}

function DnsAddresses() {
  return (
    <div className="mt-2 rounded-lg bg-zinc-200/70 dark:bg-zinc-800 px-3 py-2 space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-zinc-500">DNS principal</span>
        <span className="font-mono text-xs font-semibold text-zinc-800 dark:text-zinc-200">
          1.1.1.1
        </span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-zinc-500">DNS secondaire</span>
        <span className="font-mono text-xs font-semibold text-zinc-800 dark:text-zinc-200">
          1.0.0.1
        </span>
      </div>
    </div>
  );
}

function CommandBlock({ command }: { command: string }) {
  return (
    <div className="mt-2 flex items-start gap-2 rounded-lg bg-zinc-900 dark:bg-black/40 px-3 py-2 ring-1 ring-white/8">
      <Terminal className="h-3.5 w-3.5 shrink-0 mt-0.5 text-zinc-500" />
      <code className="flex-1 text-[11px] font-mono text-zinc-200 leading-relaxed break-all">
        {command}
      </code>
      <button
        onClick={() => {
          navigator.clipboard.writeText(command);
          toast.success("Commande copiee");
        }}
        className="shrink-0 text-[11px] font-medium text-violet-400 hover:text-violet-300 transition-colors"
      >
        Copier
      </button>
    </div>
  );
}

const WINDOWS_STEPS = [
  {
    title: "Ouvrir les connexions reseau",
    detail: (
      <>
        Appuyez sur <WinKey /> +{" "}
        <kbd className="rounded bg-zinc-200 dark:bg-zinc-700 px-1.5 py-0.5 text-[11px] font-mono font-medium text-zinc-700 dark:text-zinc-200">
          R
        </kbd>
        , tapez <CopyChip value="ncpa.cpl" /> et appuyez sur Entree.
      </>
    ),
  },
  {
    title: "Ouvrir les proprietes de votre connexion",
    detail: (
      <>
        Clic droit sur votre connexion active (Wi-Fi ou Ethernet) puis <Strong>Proprietes</Strong>.
      </>
    ),
  },
  {
    title: "Selectionner IPv4",
    detail: (
      <>
        Double-cliquez sur <Strong>Protocole Internet version 4 (TCP/IPv4)</Strong>.
      </>
    ),
  },
  {
    title: "Saisir les adresses DNS",
    detail: (
      <>
        Cochez <Strong>Utiliser les adresses de serveurs DNS suivantes</Strong> puis entrez :
        <DnsAddresses />
      </>
    ),
  },
  {
    title: "Valider",
    detail: (
      <>
        Cliquez sur <Strong>OK</Strong> dans les deux fenetres, puis utilisez le bouton{" "}
        <Strong>Reessayer</Strong> ci-dessous pour verifier l'acces.
      </>
    ),
  },
];

const MACOS_STEPS = [
  {
    title: "Ouvrir les reglages reseau",
    detail: (
      <>
        Ouvrez <Strong>Reglages Systeme</Strong> (menu Pomme) puis cliquez sur{" "}
        <Strong>Reseau</Strong> dans la barre laterale.
      </>
    ),
  },
  {
    title: "Ouvrir les details de votre connexion",
    detail: (
      <>
        Selectionnez votre connexion active (Wi-Fi ou Ethernet) puis cliquez sur{" "}
        <Strong>Details...</Strong>.
      </>
    ),
  },
  {
    title: "Ouvrir l'onglet DNS",
    detail: (
      <>
        Dans la barre laterale de la fenetre, cliquez sur <Strong>DNS</Strong>.
      </>
    ),
  },
  {
    title: "Saisir les adresses DNS",
    detail: (
      <>
        Cliquez sur le bouton <Strong>+</Strong> sous "Serveurs DNS" et ajoutez les deux adresses :
        <DnsAddresses />
      </>
    ),
  },
  {
    title: "Valider",
    detail: (
      <>
        Cliquez sur <Strong>OK</Strong>, puis utilisez le bouton <Strong>Reessayer</Strong>{" "}
        ci-dessous pour verifier l'acces.
      </>
    ),
  },
];

export function DnsGuideModal({ onClose }: { onClose: () => void }) {
  const [os, setOs] = useState<Os>(detectedOs);
  const steps = os === "windows" ? WINDOWS_STEPS : MACOS_STEPS;

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
        className="flex max-h-[90vh] w-full max-w-md flex-col rounded-2xl bg-[#f4f6fc] dark:bg-zinc-900 ring-1 ring-black/8 dark:ring-white/8 shadow-2xl overflow-hidden"
      >
        <div className="px-5 pt-5 pb-4 border-b border-black/6 dark:border-white/6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-500/12 ring-1 ring-violet-500/20">
                <Globe className="h-4 w-4 text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                  Configurer son DNS
                </p>
                <p className="text-[11px] text-zinc-500 mt-0.5">Cloudflare DNS - 1.1.1.1</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-black/6 dark:hover:bg-white/6 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-4 flex gap-1 rounded-xl bg-zinc-200/70 dark:bg-zinc-950/60 p-1">
            {(
              [
                ["windows", "Windows"],
                ["macos", "macOS"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setOs(value)}
                className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition-colors ${
                  os === value
                    ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow"
                    : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {steps.map(({ title, detail }, i) => (
            <div key={`${os}-${i}`} className="flex gap-3">
              <span className="flex h-5 w-5 shrink-0 mt-0.5 items-center justify-center rounded-full bg-violet-600 text-[10px] font-bold text-white">
                {i + 1}
              </span>
              <div>
                <p className="text-xs font-semibold text-zinc-900 dark:text-white mb-0.5">
                  {title}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">{detail}</p>
              </div>
            </div>
          ))}

          <div className="rounded-xl bg-amber-500/8 ring-1 ring-amber-500/20 p-3 space-y-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
              <p className="text-xs font-semibold text-zinc-900 dark:text-white">
                Si c411.org reste inaccessible
              </p>
            </div>

            {os === "windows" ? (
              <>
                <div>
                  <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    1. Verifier le fichier hosts
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    Ouvrez le Bloc-notes en administrateur, puis le fichier{" "}
                    <span className="font-mono text-[11px] text-zinc-700 dark:text-zinc-300 bg-zinc-200 dark:bg-zinc-700 rounded px-1 py-0.5">
                      C:\Windows\System32\drivers\etc\hosts
                    </span>
                    . Si une ligne contenant <span className="font-mono text-[11px]">c411.org</span>{" "}
                    existe (souvent{" "}
                    <span className="font-mono text-[11px]">127.0.0.1 c411.org</span>), supprimez-la
                    et enregistrez. Sinon, passez a l'etape suivante.
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    2. Forcer le DNS sur toutes les cartes
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    Utile si vous avez un VPN ou plusieurs connexions. Ouvrez{" "}
                    <Strong>PowerShell en administrateur</Strong> et collez :
                  </p>
                  <CommandBlock command={DNS_PS_COMMAND} />
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1.5 leading-relaxed">
                    Puis fermez et rouvrez XingXing. Ce reglage reste actif apres redemarrage.
                  </p>
                </div>
              </>
            ) : (
              <>
                <div>
                  <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    1. Verifier le fichier hosts
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    Ouvrez le <Strong>Terminal</Strong> et tapez{" "}
                    <span className="font-mono text-[11px] text-zinc-700 dark:text-zinc-300 bg-zinc-200 dark:bg-zinc-700 rounded px-1 py-0.5">
                      sudo nano /etc/hosts
                    </span>
                    . Si une ligne contenant <span className="font-mono text-[11px]">c411.org</span>{" "}
                    existe (souvent{" "}
                    <span className="font-mono text-[11px]">127.0.0.1 c411.org</span>), supprimez-la
                    puis enregistrez avec Ctrl+O et quittez avec Ctrl+X. Sinon, passez a l'etape
                    suivante.
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    2. Forcer le DNS sur tous les services reseau
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    Utile si vous avez un VPN ou plusieurs connexions. Ouvrez le{" "}
                    <Strong>Terminal</Strong> et collez (votre mot de passe sera demande) :
                  </p>
                  <CommandBlock command={DNS_MAC_COMMAND} />
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1.5 leading-relaxed">
                    Puis fermez et rouvrez XingXing. Ce reglage reste actif apres redemarrage.
                  </p>
                </div>
              </>
            )}

            <div>
              <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                3. Ne pas oublier l'IPv6
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Changer le DNS de l'<Strong>IPv4</Strong> peut ne pas suffire : si votre connexion
                utilise l'<Strong>IPv6</Strong>, appliquez le meme DNS alternatif la aussi (
                <Mono>2606:4700:4700::1111</Mono> pour Cloudflare), sinon l'ancien DNS reste
                utilise.
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                4. Verifier vos logiciels de securite
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Un antivirus, un pare-feu ou un VPN peut bloquer XingXing au niveau reseau, meme
                avec un DNS correct. Autorisez l'application (ou desactivez temporairement le
                filtrage) et reessayez.
              </p>
            </div>
          </div>
        </div>

        <div className="px-5 py-4 border-t border-black/6 dark:border-white/6">
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
