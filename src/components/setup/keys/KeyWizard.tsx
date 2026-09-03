import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { ArrowLeft, Info } from "lucide-react";
import { getApiKey } from "@/lib/apiKeys";
import { KEY_SERVICES } from "@/lib/keyServices";
import { KeyScreen, type ScreenStatus } from "./KeyScreen";
import { KeyServiceTabs } from "./KeyServiceTabs";

/** Delai avant de glisser vers l'ecran suivant : laisse voir la coche verte. */
const ADVANCE_MS = 400;

type ById = Record<string, string>;
type Statuses = Record<string, ScreenStatus>;

export function KeyWizard({
  onBack,
  onDone,
}: {
  /** Retour depuis le premier service : sort du wizard. */
  onBack: () => void;
  onDone: (values: ById) => void;
}) {
  const [index, setIndex] = useState(0);
  const [values, setValues] = useState<ById>({});
  const [statuses, setStatuses] = useState<Statuses>({});

  useEffect(() => {
    // Cles deja presentes dans le keyring (reinstallation, retour au setup).
    for (const s of KEY_SERVICES) {
      getApiKey(s.keyName).then((v) => {
        if (v) setValues((prev) => ({ ...prev, [s.id]: v }));
      });
    }
  }, []);

  const service = KEY_SERVICES[index];
  const isLast = index === KEY_SERVICES.length - 1;
  const status = statuses[service.id] ?? "idle";
  const doubtful = KEY_SERVICES.filter(
    (s) => statuses[s.id] === "invalid" || statuses[s.id] === "unreachable",
  );

  function advance() {
    if (isLast) onDone(values);
    else setIndex(index + 1);
  }

  async function verify() {
    // Apres un echec, le bouton ne rejoue pas le test : il fait passer.
    if (status === "invalid" || status === "unreachable") return advance();
    setStatuses((prev) => ({ ...prev, [service.id]: "checking" }));
    const result = await service.check(values[service.id].trim());
    setStatuses((prev) => ({ ...prev, [service.id]: result }));
    if (result === "valid") setTimeout(advance, ADVANCE_MS);
  }

  function change(v: string) {
    setValues((prev) => ({ ...prev, [service.id]: v }));
    // Modifier la cle invalide le verdict precedent.
    if (status !== "idle") setStatuses((prev) => ({ ...prev, [service.id]: "idle" }));
  }

  return (
    <motion.div
      key="keys"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.15 } }}
      className="relative mx-auto w-full max-w-xl px-6 pt-10 pb-12 sm:px-8"
    >
      <motion.button
        whileTap={{ scale: 0.93 }}
        onClick={() => (index === 0 ? onBack() : setIndex(index - 1))}
        className="mb-6 flex items-center gap-1.5 text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        <span className="text-sm font-medium">Retour</span>
      </motion.button>

      <div className="mb-5 text-center">
        <h1 className="mb-2 text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
          Connectez l'application a vos comptes
        </h1>
        <p className="mx-auto max-w-lg text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
          Chaque service a besoin d'une cle pour que XingXing puisse s'y connecter. On les recupere
          une par une. Elles restent sur votre machine et ne sont envoyees a personne d'autre.
        </p>
      </div>

      <div className="mb-4">
        <KeyServiceTabs activeId={service.id} statuses={statuses} onSelect={setIndex} />
      </div>

      {/* Aucune transition entre les services : la carte n'est jamais
          demontee, React remplace juste son contenu. */}
      <KeyScreen
        service={service}
        value={values[service.id] ?? ""}
        status={status}
        onChange={change}
        onVerify={verify}
        notice={
          isLast && doubtful.length > 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-start gap-3 rounded-xl bg-zinc-500/8 ring-1 ring-black/6 dark:ring-white/8 px-4 py-3"
            >
              <Info className="h-4 w-4 shrink-0 mt-0.5 text-zinc-500" />
              <p className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                A revoir plus tard : {doubtful.map((s) => s.name).join(", ")}. Ces cles se corrigent
                a tout moment dans les Preferences, section Cles API.
              </p>
            </motion.div>
          ) : null
        }
      />
    </motion.div>
  );
}
