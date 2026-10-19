import { ExternalLink, KeyRound, Settings } from "lucide-react";
import { openUrl } from "@tauri-apps/plugin-opener";
import { SettingsPanel } from "@/components/settings/SettingsPanel";
import { KEY_SERVICES } from "@/lib/keyServices";
import { openSettingsPanel } from "@/lib/settingsNavigation";

// Les etapes sont ecrites pour l'ecran de saisie du setup ("collez-la ci-dessous").
const helpStep = (step: string) =>
  step.replace("ci-dessous", "dans Paramètres, rubrique Comptes et clés API");

export function ApiKeysHelpTab() {
  return (
    <SettingsPanel
      icon={KeyRound}
      title="Récupérer ses clés API"
      subtitle="Où trouver les clés C411, AllDebrid et TMDB."
    >
      <p className="mb-5 text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
        Une clé API permet à XingXing de parler à un service en votre nom. Si une clé a expiré ou si
        vous changez de compte, voici où en récupérer une nouvelle.
      </p>

      <div className="flex flex-col gap-3">
        {KEY_SERVICES.map((service) => {
          return (
            <div
              key={service.id}
              className="rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 ring-1 ring-black/6 dark:ring-white/6 px-5 py-4"
            >
              <div className="flex items-center gap-3">
                <img
                  src={service.logo}
                  alt=""
                  className="h-9 w-9 shrink-0 rounded-xl object-contain"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                    {service.name}
                  </p>
                  <p className="text-xs text-zinc-500">{service.tagline}</p>
                </div>
                <button
                  onClick={() => openUrl(service.url)}
                  className="flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 h-8 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/10 transition-colors"
                >
                  {service.urlLabel}
                  <ExternalLink className="h-3 w-3" />
                </button>
              </div>

              <ol className="mt-4 space-y-2">
                {service.steps.map((step, i) => (
                  <li
                    key={i}
                    className="flex gap-3 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400"
                  >
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-500/12 text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                      {i + 1}
                    </span>
                    {helpStep(step)}
                  </li>
                ))}
              </ol>
            </div>
          );
        })}
      </div>

      <button
        onClick={() => openSettingsPanel("api-keys")}
        className="mt-5 flex w-full items-center justify-center gap-2 h-10 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-sm font-semibold text-white transition-colors"
      >
        <Settings className="h-4 w-4" />
        Modifier mes clés
      </button>
    </SettingsPanel>
  );
}
