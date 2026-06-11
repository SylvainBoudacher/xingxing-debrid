import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowLeft, ArrowRight, Check, Download, ExternalLink, FileText, KeyRound, Loader2, Magnet, Search, Zap,
  type LucideIcon,
} from "lucide-react";
import logo from "@/assets/logo.png";
import { LazyStore } from "@tauri-apps/plugin-store";
import { openUrl } from "@tauri-apps/plugin-opener";
import { toast } from "sonner";
import { parseRelease } from "@/lib/parseRelease";
import { getApiKey, setApiKey } from "@/lib/apiKeys";
import type { ViewMode } from "./PreferencesPage";

const store = new LazyStore("settings.json", { defaults: {}, autoSave: false });

const C411_STEPS = [
  "Connectez-vous à votre compte C411.",
  "Cliquez sur votre profil en haut à droite.",
  'Allez dans "Intégration API".',
  'Cliquez sur "Créer une clé".',
  "Copiez la clé générée et collez-la ci-dessous.",
];

const ALLDEBRID_STEPS = [
  "Connectez-vous à votre compte sur alldebrid.fr.",
  'Allez dans "Mon compte".',
  'Cliquez sur "Apikey Manager".',
  'Cliquez sur "Nouvelle clé".',
  "Copiez la clé générée et collez-la ci-dessous.",
];

const FEATURES = [
  {
    icon: Search,
    title: "Recherchez",
    text: "Trouvez films, séries, musiques et plus encore grâce au catalogue C411.",
  },
  {
    icon: Zap,
    title: "Débridez",
    text: "Convertissez les liens magnet en téléchargements premium instantanés via AllDebrid.",
  },
  {
    icon: Download,
    title: "Téléchargez ou regardez",
    text: "Téléchargement direct ou lecture immédiate dans VLC, sans attendre.",
  },
];

const item = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  },
};

const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } };

function KeyCard({
  number, title, url, urlLabel, steps, value, placeholder, onChange,
}: {
  number: number;
  title: string;
  url: string;
  urlLabel: string;
  steps: string[];
  value: string;
  placeholder: string;
  onChange: (v: string) => void;
}) {
  return (
    <motion.div variants={item} className="rounded-2xl bg-zinc-900/70 ring-1 ring-white/6 px-5 py-5">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
            {number}
          </span>
          <p className="text-sm font-semibold text-white">{title}</p>
        </div>
        <button
          type="button"
          onClick={() => openUrl(url)}
          className="flex items-center gap-1.5 text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          {urlLabel}
          <ExternalLink className="h-3 w-3" />
        </button>
      </div>

      <ol className="space-y-1.5 mb-4">
        {steps.map((step, i) => (
          <li key={i} className="flex gap-2 text-xs text-zinc-400 leading-relaxed">
            <span className="shrink-0 font-semibold text-zinc-500">{i + 1}.</span>
            {step}
          </li>
        ))}
      </ol>

      <div className="relative flex items-center">
        <KeyRound className="absolute left-3 h-3.5 w-3.5 text-zinc-500 pointer-events-none" />
        <input
          type="password"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-xl bg-zinc-950/60 ring-1 ring-white/6 pl-9 pr-3 py-2.5 text-sm text-white placeholder:text-zinc-600 outline-none focus:ring-indigo-500/40 transition-all"
        />
      </div>
    </motion.div>
  );
}

function ViewOption({ label, selected, onClick, children }: {
  label: string;
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col rounded-xl px-4 py-3 text-left transition-all ${
        selected
          ? "bg-indigo-500/[0.07] ring-2 ring-indigo-500"
          : "bg-zinc-950/60 ring-1 ring-white/6 hover:ring-white/20"
      }`}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className={`text-xs font-semibold ${selected ? "text-indigo-300" : "text-zinc-400"}`}>{label}</span>
        <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${selected ? "bg-indigo-500" : "ring-1 ring-white/15"}`}>
          {selected && <Check className="h-2.5 w-2.5 text-white" />}
        </span>
      </div>
      {children}
    </button>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
        checked ? "bg-indigo-600" : "bg-zinc-700"
      }`}
    >
      <motion.div
        initial={false}
        animate={{ x: checked ? 20 : 0 }}
        transition={{ type: "spring", stiffness: 500, damping: 35 }}
        className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow"
      />
    </button>
  );
}

function ViewModeCard({
  icon: Icon, title, description, example, value, onChange,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  example: string;
  value: ViewMode;
  onChange: (v: ViewMode) => void;
}) {
  const parsed = parseRelease(example);
  return (
    <motion.div variants={item} className="rounded-2xl bg-zinc-900/70 ring-1 ring-white/6 px-5 py-5">
      <div className="flex items-center gap-3 mb-1">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-500/12 ring-1 ring-indigo-500/20">
          <Icon className="h-4 w-4 text-indigo-400" />
        </div>
        <p className="text-sm font-semibold text-white">{title}</p>
      </div>
      <p className="text-xs text-zinc-500 mb-4">{description}</p>

      <div className="grid gap-3 sm:grid-cols-2">
        <ViewOption label="Simplifiée" selected={value === "simple"} onClick={() => onChange("simple")}>
          <div className="flex items-center gap-1.5 mb-1">
            {parsed.quality && (
              <span className="rounded-md bg-indigo-500/12 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-indigo-300">{parsed.quality}</span>
            )}
            {parsed.codec && (
              <span className="rounded-md bg-white/6 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">{parsed.codec}</span>
            )}
          </div>
          <p className="text-sm font-semibold text-white leading-snug">{parsed.title}</p>
        </ViewOption>

        <ViewOption label="Détaillée" selected={value === "detailed"} onClick={() => onChange("detailed")}>
          <p className="text-sm font-semibold text-white leading-snug break-all">{example}</p>
        </ViewOption>
      </div>
    </motion.div>
  );
}

interface SetupPageProps {
  onComplete: () => void;
}

export function SetupPage({ onComplete }: SetupPageProps) {
  const [step, setStep] = useState<"intro" | "keys" | "display">("intro");
  const [c411Key, setC411Key] = useState("");
  const [allDebridKey, setAllDebridKey] = useState("");
  const [searchViewMode, setSearchViewMode] = useState<ViewMode>("simple");
  const [viewMode, setViewMode] = useState<ViewMode>("simple");
  const [hideNfo, setHideNfo] = useState(true);
  const [skipNfoDownload, setSkipNfoDownload] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getApiKey("c411_api_key").then((v) => { if (v) setC411Key(v); });
    getApiKey("alldebrid_api_key").then((v) => { if (v) setAllDebridKey(v); });
    store.get<ViewMode>("search_view_mode").then((v) => { if (v) setSearchViewMode(v); });
    store.get<ViewMode>("view_mode").then((v) => { if (v) setViewMode(v); });
    store.get<boolean>("hide_nfo_files").then((v) => setHideNfo(v ?? true));
    store.get<boolean>("skip_nfo_download").then((v) => setSkipNfoDownload(v ?? true));
  }, []);

  const bothFilled = c411Key.trim() !== "" && allDebridKey.trim() !== "";

  async function handleKeysNext() {
    setSaving(true);
    try {
      await setApiKey("c411_api_key", c411Key.trim());
      await setApiKey("alldebrid_api_key", allDebridKey.trim());
      setStep("display");
    } catch (err) {
      toast.error(String(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleStart() {
    setSaving(true);
    try {
      await store.set("search_view_mode", searchViewMode);
      await store.set("view_mode", viewMode);
      await store.set("hide_nfo_files", hideNfo);
      await store.set("skip_nfo_download", skipNfoDownload);
      await store.save();
      onComplete();
    } catch (err) {
      toast.error(String(err));
      setSaving(false);
    }
  }

  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden bg-[#04050c]">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0">
        <motion.div
          animate={{ opacity: [0.7, 1, 0.7], scale: [1, 1.08, 1] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-40 left-1/2 -translate-x-1/2 h-[440px] w-[700px] rounded-full bg-indigo-600/25 blur-[120px]"
        />
        <div className="absolute top-1/3 -left-40 h-80 w-80 rounded-full bg-violet-600/15 blur-[100px]" />
        <div className="absolute -bottom-24 -right-32 h-96 w-96 rounded-full bg-sky-500/10 blur-[110px]" />
        <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.14)_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_45%_at_50%_22%,black,transparent_75%)]" />
      </div>

      <AnimatePresence mode="wait">
        {step === "intro" && (
          <motion.div
            key="intro"
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0, x: -24, transition: { duration: 0.2 } }}
            variants={stagger}
            className="relative mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-6 py-12 sm:px-8"
          >
            <motion.div variants={item} className="flex flex-col items-center text-center mb-10">
              <div className="relative mb-6">
                <motion.div
                  animate={{ opacity: [0.4, 0.9, 0.4], scale: [0.95, 1.15, 0.95] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute -inset-4 rounded-full bg-indigo-500/50 blur-2xl"
                />
                <img
                  src={logo}
                  alt="XingXing Debrid"
                  className="relative h-24 w-24 rounded-2xl ring-1 ring-white/10 shadow-[0_0_50px_rgba(79,70,229,0.5)]"
                />
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-white mb-3">XingXing Debrid</h1>
              <p className="text-sm text-zinc-400 max-w-sm leading-relaxed">
                De la recherche au visionnage, tout votre contenu en un seul endroit.
              </p>
            </motion.div>

            <div className="space-y-3 mb-10">
              {FEATURES.map((f) => (
                <motion.div
                  key={f.title}
                  variants={item}
                  className="flex items-start gap-4 rounded-2xl bg-zinc-900/70 ring-1 ring-white/6 px-5 py-4"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-500/12 ring-1 ring-indigo-500/20">
                    <f.icon className="h-4 w-4 text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white mb-0.5">{f.title}</p>
                    <p className="text-xs text-zinc-400 leading-relaxed">{f.text}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.div variants={item}>
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => setStep("keys")}
                className="flex w-full items-center justify-center gap-2 h-11 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-sm font-semibold text-white transition-colors"
              >
                Continuer
                <ArrowRight className="h-4 w-4" />
              </motion.button>
            </motion.div>
          </motion.div>
        )}

        {step === "keys" && (
          <motion.div
            key="keys"
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0, x: 24, transition: { duration: 0.2 } }}
            variants={stagger}
            className="relative mx-auto w-full max-w-xl px-6 pt-10 pb-12 sm:px-8 space-y-4"
          >
            <motion.div variants={item}>
              <motion.button
                whileTap={{ scale: 0.93 }}
                onClick={() => setStep("intro")}
                className="flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 transition-colors mb-6"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="text-sm font-medium">Retour</span>
              </motion.button>

              <div className="text-center mb-2">
                <h1 className="text-2xl font-bold tracking-tight text-white mb-2">Configurez vos clés API</h1>
                <p className="text-sm text-zinc-400 max-w-sm mx-auto">
                  Deux clés gratuites suffisent pour relier l'application à C411 et AllDebrid.
                </p>
              </div>
            </motion.div>

            <KeyCard
              number={1}
              title="Clé API C411"
              url="https://c411.org"
              urlLabel="c411.org"
              steps={C411_STEPS}
              value={c411Key}
              placeholder="Collez votre clé C411"
              onChange={setC411Key}
            />
            <KeyCard
              number={2}
              title="Clé API AllDebrid"
              url="https://alldebrid.fr"
              urlLabel="alldebrid.fr"
              steps={ALLDEBRID_STEPS}
              value={allDebridKey}
              placeholder="Collez votre clé AllDebrid"
              onChange={setAllDebridKey}
            />

            <motion.div variants={item} className="pt-2">
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={handleKeysNext}
                disabled={!bothFilled || saving}
                className="flex w-full items-center justify-center gap-2 h-11 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-sm font-semibold text-white transition-colors"
              >
                {saving
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <>Continuer<ArrowRight className="h-4 w-4" /></>
                }
              </motion.button>
              {!bothFilled && (
                <p className="mt-2 text-center text-[11px] text-zinc-600">Renseignez les deux clés pour continuer.</p>
              )}
            </motion.div>
          </motion.div>
        )}

        {step === "display" && (
          <motion.div
            key="display"
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0, x: 24, transition: { duration: 0.2 } }}
            variants={stagger}
            className="relative mx-auto w-full max-w-xl px-6 pt-10 pb-12 sm:px-8 space-y-4"
          >
            <motion.div variants={item}>
              <motion.button
                whileTap={{ scale: 0.93 }}
                onClick={() => setStep("keys")}
                className="flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 transition-colors mb-6"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="text-sm font-medium">Retour</span>
              </motion.button>

              <div className="text-center mb-2">
                <h1 className="text-2xl font-bold tracking-tight text-white mb-2">Choisissez votre affichage</h1>
                <p className="text-sm text-zinc-400 max-w-sm mx-auto">
                  Cliquez sur l'affichage que vous préférez. Modifiable à tout moment dans les Paramètres.
                </p>
              </div>
            </motion.div>

            <ViewModeCard
              icon={Search}
              title="Affichage des résultats de recherche"
              description="Les résultats de recherche sur la page d'accueil."
              example="Dune.Part.Two.2024.MULTi.2160p.WEB.H265-Slay3R"
              value={searchViewMode}
              onChange={setSearchViewMode}
            />
            <ViewModeCard
              icon={Magnet}
              title="Affichage des noms de fichiers"
              description="Les noms de fichiers dans la page Magnets."
              example="Apple.Cider.Vinegar.S01E01.MULTi.1080p.WEB.H265-CHiLL.mkv"
              value={viewMode}
              onChange={setViewMode}
            />

            <motion.div variants={item} className="rounded-2xl bg-zinc-900/70 ring-1 ring-white/6 px-5 py-5">
              <div className="flex items-center gap-3 mb-1">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-500/12 ring-1 ring-indigo-500/20">
                  <FileText className="h-4 w-4 text-indigo-400" />
                </div>
                <p className="text-sm font-semibold text-white">Fichiers .nfo</p>
              </div>
              <p className="text-xs text-zinc-500 mb-4 leading-relaxed">
                Un fichier .nfo est un petit fichier texte ajouté par les teams de release pour décrire le contenu (qualité, langue, source). Il n'est pas nécessaire pour regarder vos films et séries.
              </p>

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-4 rounded-xl bg-zinc-950/60 ring-1 ring-white/6 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-white">Ne pas afficher les fichiers .nfo</p>
                    <p className="text-xs text-zinc-500 mt-0.5">Les masque dans la liste des fichiers d'un magnet.</p>
                  </div>
                  <Toggle checked={hideNfo} onChange={setHideNfo} />
                </div>

                <div className="flex items-center justify-between gap-4 rounded-xl bg-zinc-950/60 ring-1 ring-white/6 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-white">Ne pas télécharger les fichiers .nfo</p>
                    <p className="text-xs text-zinc-500 mt-0.5">Les exclut des téléchargements groupés ("Tout télécharger").</p>
                  </div>
                  <Toggle checked={skipNfoDownload} onChange={setSkipNfoDownload} />
                </div>
              </div>
            </motion.div>

            <motion.div variants={item} className="pt-2">
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={handleStart}
                disabled={saving}
                className="flex w-full items-center justify-center gap-2 h-11 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-sm font-semibold text-white transition-colors"
              >
                {saving
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <>Commencer<ArrowRight className="h-4 w-4" /></>
                }
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
