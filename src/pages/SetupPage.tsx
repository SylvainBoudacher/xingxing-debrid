import { lazy, Suspense, useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Download,
  ExternalLink,
  FileText,
  KeyRound,
  Loader2,
  FolderOpen,
  Magnet,
  Moon,
  Search,
  Settings,
  Sparkles,
  Sun,
  Upload,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { SetupIntroSequence } from "@/components/setupIntro/SetupIntroSequence";
import { open as openDialog } from "@tauri-apps/plugin-dialog";
import { LazyStore } from "@tauri-apps/plugin-store";
import { openUrl } from "@tauri-apps/plugin-opener";
import { toast } from "sonner";
import { parseRelease } from "@/lib/parseRelease";
import { getApiKey, setApiKey } from "@/lib/apiKeys";
import { httpFetch } from "@/lib/networkError";
import { pickBackupFile } from "@/lib/profileBackup";
import { ImportProfileModal } from "@/components/ImportProfileModal";
import { DnsGuideModal } from "@/components/DnsGuideModal";
import { ServicesStep } from "@/components/setup/ServicesStep";
import { NetworkStep, type DnsStatus } from "@/components/setup/NetworkStep";
import { item, stagger } from "@/components/setup/motionVariants";
import { validateKey as validateTmdbKey } from "@/lib/services/tmdb";
import { applyTheme, type Theme } from "@/lib/theme";

const PixelPool = lazy(() =>
  import("@/components/PixelPool").then((m) => ({ default: m.PixelPool })),
);
import type { ViewMode } from "@/lib/viewMode";

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

const TMDB_STEPS = [
  "Créez un compte gratuit sur themoviedb.org.",
  'Allez dans "Paramètres" puis "API".',
  "Demandez une clé API (usage personnel).",
  'Copiez la "Clé d\'API" (v3) et collez-la ci-dessous.',
  "Sans cette clé, l'application est bridée : pas de page Découverte, et votre bibliothèque perd les jaquettes et les infos de vos films et séries.",
];

function KeyCard({
  number,
  title,
  url,
  urlLabel,
  steps,
  value,
  placeholder,
  onChange,
  optional,
}: {
  number: number;
  title: string;
  url: string;
  urlLabel: string;
  steps: string[];
  value: string;
  placeholder: string;
  onChange: (v: string) => void;
  optional?: boolean;
}) {
  return (
    <motion.div variants={item}>
      {optional && (
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
          Optionnel, mais fortement recommandé
        </p>
      )}
      <div
        className={`rounded-2xl px-5 py-5 ${
          optional
            ? "bg-white/60 dark:bg-zinc-900/40 border border-dashed border-black/15 dark:border-white/15"
            : "bg-white/80 dark:bg-zinc-900/70 ring-1 ring-black/6 dark:ring-white/6"
        }`}
      >
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                optional
                  ? "bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300"
                  : "bg-indigo-600 text-white"
              }`}
            >
              {number}
            </span>
            <p className="text-sm font-semibold text-zinc-900 dark:text-white">{title}</p>
          </div>
          <button
            type="button"
            onClick={() => openUrl(url)}
            className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
          >
            {urlLabel}
            <ExternalLink className="h-3 w-3" />
          </button>
        </div>

        <ol className="space-y-1.5 mb-4">
          {steps.map((step, i) => (
            <li
              key={i}
              className="flex gap-2 text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed"
            >
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
            className="w-full rounded-xl bg-zinc-100 dark:bg-zinc-950/60 ring-1 ring-black/6 dark:ring-white/6 pl-9 pr-3 py-2.5 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-600 outline-none focus:ring-indigo-500/40 transition-all"
          />
        </div>
      </div>
    </motion.div>
  );
}

function ViewOption({
  label,
  selected,
  onClick,
  children,
}: {
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
          : "bg-zinc-100 dark:bg-zinc-950/60 ring-1 ring-black/6 dark:ring-white/6 hover:ring-black/20 dark:hover:ring-white/20"
      }`}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <span
          className={`text-xs font-semibold ${selected ? "text-indigo-700 dark:text-indigo-300" : "text-zinc-500 dark:text-zinc-400"}`}
        >
          {label}
        </span>
        <span
          className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${selected ? "bg-indigo-500" : "ring-1 ring-black/15 dark:ring-white/15"}`}
        >
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
        checked ? "bg-indigo-600" : "bg-zinc-300 dark:bg-zinc-700"
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
  icon: Icon,
  title,
  description,
  example,
  value,
  onChange,
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
    <motion.div
      variants={item}
      className="rounded-2xl bg-white/80 dark:bg-zinc-900/70 ring-1 ring-black/6 dark:ring-white/6 px-5 py-5"
    >
      <div className="flex items-center gap-3 mb-1">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-500/12 ring-1 ring-indigo-500/20">
          <Icon className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
        </div>
        <p className="text-sm font-semibold text-zinc-900 dark:text-white">{title}</p>
      </div>
      <p className="text-xs text-zinc-500 mb-4">{description}</p>

      <div className="grid gap-3 sm:grid-cols-2">
        <ViewOption
          label="Simplifiée"
          selected={value === "simple"}
          onClick={() => onChange("simple")}
        >
          <div className="flex items-center gap-1.5 mb-1">
            {parsed.quality && (
              <span className="rounded-md bg-indigo-500/12 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-indigo-700 dark:text-indigo-300">
                {parsed.quality}
              </span>
            )}
            {parsed.codec && (
              <span className="rounded-md bg-black/6 dark:bg-white/6 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                {parsed.codec}
              </span>
            )}
          </div>
          <p className="text-sm font-semibold text-zinc-900 dark:text-white leading-snug">
            {parsed.title}
          </p>
        </ViewOption>

        <ViewOption
          label="Détaillée"
          selected={value === "detailed"}
          onClick={() => onChange("detailed")}
        >
          <p className="text-sm font-semibold text-zinc-900 dark:text-white leading-snug break-all">
            {example}
          </p>
        </ViewOption>
      </div>
    </motion.div>
  );
}

interface SetupPageProps {
  onComplete: () => void;
}

export function SetupPage({ onComplete }: SetupPageProps) {
  const [step, setStep] = useState<
    "intro" | "services" | "network" | "keys" | "display" | "downloads" | "theme"
  >("intro");
  const [dnsStatus, setDnsStatus] = useState<DnsStatus>("idle");
  const [showDnsGuide, setShowDnsGuide] = useState(false);
  const [dnsError, setDnsError] = useState("");
  const [c411Key, setC411Key] = useState("");
  const [allDebridKey, setAllDebridKey] = useState("");
  const [tmdbKey, setTmdbKey] = useState("");
  const [searchViewMode, setSearchViewMode] = useState<ViewMode>("simple");
  const [viewMode, setViewMode] = useState<ViewMode>("simple");
  const [hideNfo, setHideNfo] = useState(true);
  const [skipNfoDownload, setSkipNfoDownload] = useState(true);
  const [downloadDir, setDownloadDir] = useState("");
  const [batchSize, setBatchSize] = useState(2);
  const [theme, setThemeState] = useState<Theme>("dark");
  const [summerEnabled, setSummerEnabled] = useState(false);
  const [saving, setSaving] = useState(false);
  const [importPath, setImportPath] = useState<string | null>(null);

  useEffect(() => {
    getApiKey("c411_api_key").then((v) => {
      if (v) setC411Key(v);
    });
    getApiKey("alldebrid_api_key").then((v) => {
      if (v) setAllDebridKey(v);
    });
    getApiKey("tmdb_api_key").then((v) => {
      if (v) setTmdbKey(v);
    });
    store.get<ViewMode>("search_view_mode").then((v) => {
      if (v) setSearchViewMode(v);
    });
    store.get<ViewMode>("view_mode").then((v) => {
      if (v) setViewMode(v);
    });
    store.get<boolean>("hide_nfo_files").then((v) => setHideNfo(v ?? true));
    store.get<boolean>("skip_nfo_download").then((v) => setSkipNfoDownload(v ?? true));
    store.get<string>("download_dir").then((v) => setDownloadDir(v ?? ""));
    store.get<number>("download_batch_size").then((v) => setBatchSize(v ?? 2));
    store.get<Theme>("theme").then((v) => setThemeState(v === "light" ? "light" : "dark"));
    store.get<boolean>("summer_pool_enabled").then((v) => setSummerEnabled(v ?? false));
  }, []);

  async function checkDns() {
    setDnsError("");
    setDnsStatus("checking");
    try {
      await httpFetch("https://c411.org", { method: "HEAD", signal: AbortSignal.timeout(6000) });
      setDnsStatus("ok");
    } catch (e) {
      setDnsError(e instanceof Error ? `${e.name}: ${e.message}` : String(e));
      setDnsStatus("fail");
    }
  }

  function goToServices() {
    setStep("services");
    checkDns();
  }

  async function handlePickImport() {
    const path = await pickBackupFile();
    if (path) setImportPath(path);
  }

  const bothFilled = c411Key.trim() !== "" && allDebridKey.trim() !== "";

  async function handleKeysNext() {
    setSaving(true);
    try {
      await setApiKey("c411_api_key", c411Key.trim());
      await setApiKey("alldebrid_api_key", allDebridKey.trim());
      await setApiKey("tmdb_api_key", tmdbKey.trim());
      // Clé optionnelle : on prévient si elle est invalide mais on ne bloque pas
      // le setup (hors-ligne / TMDB injoignable = on laisse passer).
      if (tmdbKey.trim()) {
        const valid = await validateTmdbKey(tmdbKey.trim()).catch(() => true);
        if (!valid)
          toast.error(
            "Clé TMDB invalide : la page Découverte ne fonctionnera pas sans clé valide.",
          );
      }
      setStep("display");
    } catch (err) {
      toast.error(String(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleDisplayNext() {
    setSaving(true);
    try {
      await store.set("search_view_mode", searchViewMode);
      await store.set("view_mode", viewMode);
      await store.set("hide_nfo_files", hideNfo);
      await store.set("skip_nfo_download", skipNfoDownload);
      await store.save();
      setStep("downloads");
    } catch (err) {
      toast.error(String(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleDownloadsNext() {
    setSaving(true);
    try {
      await store.set("download_dir", downloadDir);
      await store.set("download_batch_size", batchSize);
      await store.save();
      setStep("theme");
    } catch (err) {
      toast.error(String(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleStart() {
    setSaving(true);
    try {
      applyTheme(theme);
      await store.set("theme", theme);
      await store.set("summer_pool_enabled", summerEnabled);
      await store.save();
      onComplete();
    } catch (err) {
      toast.error(String(err));
      setSaving(false);
    }
  }

  return (
    <main
      className={`relative flex min-h-screen flex-col overflow-hidden transition-colors duration-700 ${step === "theme" && summerEnabled ? "bg-[#06183F]" : "bg-[#f4f6fc] dark:bg-[#04050c]"}`}
    >
      {step === "theme" && (
        <div
          aria-hidden
          className={`pointer-events-none absolute inset-0 z-0 transition-opacity duration-700 ${summerEnabled ? "opacity-100" : "opacity-0"}`}
        >
          <Suspense fallback={null}>
            <PixelPool active maxDucks={0} />
          </Suspense>
        </div>
      )}
      {/* Background décoratif — masqué sur le step theme quand summer est actif */}
      <div
        className={`pointer-events-none absolute inset-0 transition-opacity duration-700 ${step === "theme" && summerEnabled ? "opacity-0" : "opacity-100"}`}
      >
        <motion.div
          animate={{ opacity: [0.7, 1, 0.7], scale: [1, 1.08, 1] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-40 left-1/2 -translate-x-1/2 h-[440px] w-[700px] rounded-full bg-indigo-600/25 blur-[120px]"
        />
        <div className="absolute top-1/3 -left-40 h-80 w-80 rounded-full bg-violet-600/15 blur-[100px]" />
        <div className="absolute -bottom-24 -right-32 h-96 w-96 rounded-full bg-sky-500/10 blur-[110px]" />
        <div className="absolute inset-0 bg-[radial-gradient(rgba(15,23,42,0.10)_1px,transparent_1px)] dark:bg-[radial-gradient(rgba(255,255,255,0.14)_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_45%_at_50%_22%,black,transparent_75%)]" />
      </div>

      <div className="relative z-10 flex flex-1 flex-col">
        <AnimatePresence mode="wait">
          {step === "intro" && (
            <motion.div
              key="intro"
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, x: -24, transition: { duration: 0.2 } }}
              variants={stagger}
              className="relative mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-6 py-6 sm:px-8"
            >
              <motion.div variants={item} className="flex flex-col items-center text-center mb-8">
                <div className="mb-6 w-full">
                  <SetupIntroSequence />
                </div>
                <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white mb-2">
                  Bienvenue sur XingXing Debrid
                </h1>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-sm leading-relaxed">
                  De la recherche au visionnage, tout votre contenu en un seul endroit.
                </p>
              </motion.div>

              <motion.div variants={item} className="space-y-2.5">
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={handlePickImport}
                  className="flex w-full items-center justify-center gap-2 h-10 rounded-xl bg-white/80 dark:bg-zinc-900/70 ring-1 ring-black/10 dark:ring-white/10 text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white transition-colors"
                >
                  <Upload className="h-4 w-4" />
                  Importer un profil
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={goToServices}
                  className="flex w-full items-center justify-center gap-2 h-10 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-sm font-semibold text-white transition-colors"
                >
                  Nouveau profil
                  <ArrowRight className="h-4 w-4" />
                </motion.button>
              </motion.div>
            </motion.div>
          )}

          {step === "services" && (
            <ServicesStep onBack={() => setStep("intro")} onNext={() => setStep("network")} />
          )}

          {step === "network" && (
            <NetworkStep
              dnsStatus={dnsStatus}
              dnsError={dnsError}
              onCheck={checkDns}
              onOpenGuide={() => setShowDnsGuide(true)}
              onBack={() => setStep("services")}
              onNext={() => setStep("keys")}
            />
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
                  onClick={() => setStep("network")}
                  className="flex items-center gap-1.5 text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors mb-6"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span className="text-sm font-medium">Retour</span>
                </motion.button>

                <div className="text-center mb-2">
                  <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white mb-2">
                    Configurez vos clés API
                  </h1>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
                    Deux clés gratuites pour relier l'application à C411 et AllDebrid. La clé TMDB
                    est optionnelle, mais sans elle une partie de l'application reste bridée.
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
              <KeyCard
                number={3}
                title="Clé API TMDB"
                url="https://www.themoviedb.org"
                urlLabel="themoviedb.org"
                steps={TMDB_STEPS}
                value={tmdbKey}
                placeholder="Collez votre clé TMDB"
                onChange={setTmdbKey}
              />

              <motion.div variants={item} className="pt-2">
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={handleKeysNext}
                  disabled={!bothFilled || saving}
                  className="flex w-full items-center justify-center gap-2 h-11 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-sm font-semibold text-white transition-colors"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      Continuer
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </motion.button>
                {!bothFilled && (
                  <p className="mt-2 text-center text-[11px] text-zinc-400 dark:text-zinc-600">
                    Renseignez les deux clés pour continuer.
                  </p>
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
                  className="flex items-center gap-1.5 text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors mb-6"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span className="text-sm font-medium">Retour</span>
                </motion.button>

                <div className="text-center mb-2">
                  <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white mb-2">
                    Choisissez votre affichage
                  </h1>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
                    Cliquez sur l'affichage que vous préférez. Modifiable à tout moment dans les
                    Paramètres.
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

              <motion.div
                variants={item}
                className="rounded-2xl bg-white/80 dark:bg-zinc-900/70 ring-1 ring-black/6 dark:ring-white/6 px-5 py-5"
              >
                <div className="flex items-center gap-3 mb-1">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-500/12 ring-1 ring-indigo-500/20">
                    <FileText className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                    Fichiers .nfo
                  </p>
                </div>
                <p className="text-xs text-zinc-500 mb-4 leading-relaxed">
                  Un fichier .nfo est un petit fichier texte ajouté par les teams de release pour
                  décrire le contenu (qualité, langue, source). Il n'est pas nécessaire pour
                  regarder vos films et séries.
                </p>

                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-4 rounded-xl bg-zinc-100 dark:bg-zinc-950/60 ring-1 ring-black/6 dark:ring-white/6 px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-zinc-900 dark:text-white">
                        Ne pas afficher les fichiers .nfo
                      </p>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        Les masque dans la liste des fichiers d'un magnet.
                      </p>
                    </div>
                    <Toggle checked={hideNfo} onChange={setHideNfo} />
                  </div>

                  <div className="flex items-center justify-between gap-4 rounded-xl bg-zinc-100 dark:bg-zinc-950/60 ring-1 ring-black/6 dark:ring-white/6 px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-zinc-900 dark:text-white">
                        Ne pas télécharger les fichiers .nfo
                      </p>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        Les exclut des téléchargements groupés ("Tout télécharger").
                      </p>
                    </div>
                    <Toggle checked={skipNfoDownload} onChange={setSkipNfoDownload} />
                  </div>
                </div>
              </motion.div>

              <motion.div variants={item} className="pt-2">
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={handleDisplayNext}
                  disabled={saving}
                  className="flex w-full items-center justify-center gap-2 h-11 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-sm font-semibold text-white transition-colors"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      Continuer
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </motion.button>
              </motion.div>
            </motion.div>
          )}

          {step === "downloads" && (
            <motion.div
              key="downloads"
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, x: 24, transition: { duration: 0.2 } }}
              variants={stagger}
              className="relative mx-auto w-full max-w-xl px-6 pt-10 pb-12 sm:px-8 space-y-4"
            >
              <motion.div variants={item}>
                <motion.button
                  whileTap={{ scale: 0.93 }}
                  onClick={() => setStep("display")}
                  className="flex items-center gap-1.5 text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors mb-6"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span className="text-sm font-medium">Retour</span>
                </motion.button>

                <div className="text-center mb-2">
                  <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white mb-2">
                    Telechargement
                  </h1>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
                    Definissez ou seront enregistres vos fichiers et combien peuvent etre
                    telecharges en meme temps.
                  </p>
                </div>
              </motion.div>

              {/* Download folder */}
              <motion.div
                variants={item}
                className="rounded-2xl bg-white/80 dark:bg-zinc-900/70 ring-1 ring-black/6 dark:ring-white/6 px-5 py-5"
              >
                <div className="flex items-center gap-3 mb-1">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-500/12 ring-1 ring-indigo-500/20">
                    <Download className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                    Dossier de telechargement
                  </p>
                </div>
                <p className="text-xs text-zinc-500 mb-4 leading-relaxed">
                  Ou les fichiers debrides sont enregistres. Par defaut, le dossier Telechargements
                  de votre systeme.
                </p>

                <div className="flex items-center justify-between gap-4 rounded-xl bg-zinc-100 dark:bg-zinc-950/60 ring-1 ring-black/6 dark:ring-white/6 px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-zinc-900 dark:text-white">
                      {downloadDir || "Dossier Telechargements (par defaut)"}
                    </p>
                    {downloadDir && (
                      <button
                        onClick={() => setDownloadDir("")}
                        className="mt-0.5 text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
                      >
                        Reinitialiser
                      </button>
                    )}
                  </div>
                  <button
                    onClick={async () => {
                      const picked = await openDialog({ directory: true, multiple: false });
                      if (typeof picked === "string") setDownloadDir(picked);
                    }}
                    className="flex shrink-0 items-center gap-2 rounded-full bg-white/90 dark:bg-zinc-800/80 ring-1 ring-black/10 dark:ring-white/10 px-4 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700/80 hover:text-zinc-900 dark:hover:text-white transition-colors"
                  >
                    <FolderOpen className="h-3.5 w-3.5" />
                    Choisir
                  </button>
                </div>
              </motion.div>

              {/* Batch size */}
              <motion.div
                variants={item}
                className="rounded-2xl bg-white/80 dark:bg-zinc-900/70 ring-1 ring-black/6 dark:ring-white/6 px-5 py-5"
              >
                <div className="flex items-center gap-3 mb-1">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-500/12 ring-1 ring-indigo-500/20">
                    <Zap className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                    Telechargements simultanes
                  </p>
                </div>
                <p className="text-xs text-zinc-500 mb-4 leading-relaxed">
                  Lors d'un telechargement groupe (plusieurs episodes), nombre de fichiers
                  telecharges en meme temps. Une valeur plus elevee peut mieux saturer votre
                  connexion.
                </p>

                <div className="flex items-center justify-between gap-4 rounded-xl bg-zinc-100 dark:bg-zinc-950/60 ring-1 ring-black/6 dark:ring-white/6 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-zinc-900 dark:text-white">
                      Fichiers en parallele
                    </p>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      Taille des lots telecharges simultanement.
                    </p>
                  </div>
                  <div className="flex items-center gap-1 rounded-full bg-white/90 dark:bg-zinc-800/80 ring-1 ring-black/10 dark:ring-white/10 p-1">
                    {[1, 2, 3, 4].map((n) => (
                      <button
                        key={n}
                        onClick={() => setBatchSize(n)}
                        className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-all ${
                          batchSize === n
                            ? "bg-indigo-600 text-white shadow"
                            : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>

              <motion.div variants={item} className="pt-2">
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={handleDownloadsNext}
                  disabled={saving}
                  className="flex w-full items-center justify-center gap-2 h-11 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-sm font-semibold text-white transition-colors"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      Continuer
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </motion.button>
              </motion.div>
            </motion.div>
          )}

          {step === "theme" && (
            <motion.div
              key="theme"
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, x: 24, transition: { duration: 0.2 } }}
              variants={stagger}
              className="relative mx-auto w-full max-w-xl px-6 pt-10 pb-12 sm:px-8 space-y-4"
            >
              <motion.div variants={item}>
                <motion.button
                  whileTap={{ scale: 0.93 }}
                  onClick={() => setStep("downloads")}
                  className="flex items-center gap-1.5 text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors mb-6"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span className="text-sm font-medium">Retour</span>
                </motion.button>

                <div className="text-center mb-2">
                  <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white mb-2">
                    Choisissez votre theme
                  </h1>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
                    Tout est modifiable a tout moment dans les Parametres. Il y a surement des
                    choses a decouvrir pour vous dans cette page.
                  </p>
                </div>
              </motion.div>

              {/* Light / Dark */}
              <motion.div variants={item} className="grid grid-cols-2 gap-3">
                {(["dark", "light"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      setThemeState(t);
                      applyTheme(t);
                    }}
                    className={`flex flex-col items-center gap-3 rounded-2xl px-4 py-5 transition-all ${
                      theme === t
                        ? "bg-indigo-500/[0.07] ring-2 ring-indigo-500"
                        : "bg-white/80 dark:bg-zinc-900/70 ring-1 ring-black/6 dark:ring-white/6 hover:ring-black/20 dark:hover:ring-white/20"
                    }`}
                  >
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                        t === "dark"
                          ? "bg-zinc-800 ring-1 ring-white/10"
                          : "bg-zinc-100 ring-1 ring-black/10"
                      }`}
                    >
                      {t === "dark" ? (
                        <Moon className="h-5 w-5 text-indigo-400" />
                      ) : (
                        <Sun className="h-5 w-5 text-amber-500" />
                      )}
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                        {t === "dark" ? "Sombre" : "Clair"}
                      </p>
                    </div>
                    <span
                      className={`flex h-4 w-4 items-center justify-center rounded-full ${
                        theme === t ? "bg-indigo-500" : "ring-1 ring-black/15 dark:ring-white/15"
                      }`}
                    >
                      {theme === t && <Check className="h-2.5 w-2.5 text-white" />}
                    </span>
                  </button>
                ))}
              </motion.div>

              {/* Summer mode */}
              <motion.div
                variants={item}
                className="rounded-2xl bg-white/80 dark:bg-zinc-900/70 ring-1 ring-black/6 dark:ring-white/6 px-5 py-5"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/12 ring-1 ring-amber-500/20">
                      <Sparkles className="h-4 w-4 text-amber-500" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                          Mode Summer
                        </p>
                        <span className="rounded-md bg-amber-500/12 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400">
                          Nouveau
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                        Un theme avec un petit quelque chose en plus. A vous de decouvrir.
                      </p>
                    </div>
                  </div>
                  <Toggle checked={summerEnabled} onChange={setSummerEnabled} />
                </div>
              </motion.div>

              {/* Settings hint */}
              <motion.div
                variants={item}
                className="flex items-center gap-3 rounded-2xl bg-white/60 dark:bg-zinc-900/40 border border-dashed border-black/15 dark:border-white/15 px-5 py-4"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-200/80 dark:bg-zinc-800">
                  <Settings className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  Toutes ces options et bien d'autres sont accessibles dans les{" "}
                  <span className="font-semibold text-zinc-700 dark:text-zinc-300">Parametres</span>
                  . Il y a surement des choses a decouvrir pour vous dans cette page.
                </p>
              </motion.div>

              <motion.div variants={item} className="pt-2">
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={handleStart}
                  disabled={saving}
                  className="flex w-full items-center justify-center gap-2 h-11 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-sm font-semibold text-white transition-colors"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      Commencer
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </motion.button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {importPath && (
          <ImportProfileModal
            path={importPath}
            onClose={() => setImportPath(null)}
            onImported={() => window.location.reload()}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showDnsGuide && <DnsGuideModal onClose={() => setShowDnsGuide(false)} />}
      </AnimatePresence>

      {import.meta.env.DEV && (
        <button
          type="button"
          onClick={onComplete}
          className="fixed bottom-4 right-4 z-50 rounded-lg border border-dashed border-violet-500/40 bg-white/70 px-2.5 py-1 text-[10px] font-bold tracking-wider text-violet-500 hover:bg-violet-500/10 transition-colors dark:bg-zinc-950/60"
        >
          [DEV] ALLER A L&apos;APP
        </button>
      )}
    </main>
  );
}
