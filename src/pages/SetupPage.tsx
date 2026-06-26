import { lazy, Suspense, useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Compass,
  CreditCard,
  Download,
  ExternalLink,
  FileText,
  Globe,
  KeyRound,
  Loader2,
  Magnet,
  Moon,
  Search,
  Settings,
  Sparkles,
  Sun,
  UserRound,
  Wifi,
  X,
  XCircle,
  Zap,
  type LucideIcon,
} from "lucide-react";
import logo from "@/assets/logo.png";
import { fetch as tauriFetch } from "@tauri-apps/plugin-http";
import { LazyStore } from "@tauri-apps/plugin-store";
import { openUrl } from "@tauri-apps/plugin-opener";
import { toast } from "sonner";
import { parseRelease } from "@/lib/parseRelease";
import { getApiKey, setApiKey } from "@/lib/apiKeys";
import { applyTheme, type Theme } from "@/lib/theme";

const PixelPool = lazy(() =>
  import("@/components/PixelPool").then((m) => ({ default: m.PixelPool })),
);
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

const TMDB_STEPS = [
  "Créez un compte gratuit sur themoviedb.org.",
  'Allez dans "Paramètres" puis "API".',
  "Demandez une clé API (usage personnel).",
  'Copiez la "Clé d\'API" (v3) et collez-la ci-dessous.',
  "Cette clé est optionnelle : elle sert uniquement à la page Découverte.",
];

const FEATURES = [
  {
    icon: Search,
    title: "Recherchez",
    text: "Trouvez films, séries, musiques et plus encore grâce au catalogue C411.",
  },
  {
    icon: Compass,
    title: "Découvrez",
    text: "Découvrez des films et des séries grâce au catalogue TMDB.",
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
          Optionnel
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
  const [step, setStep] = useState<"intro" | "prereqs" | "keys" | "display" | "theme">("intro");
  const [dnsStatus, setDnsStatus] = useState<"idle" | "checking" | "ok" | "fail">("idle");
  const [showDnsGuide, setShowDnsGuide] = useState(false);
  const [c411Key, setC411Key] = useState("");
  const [allDebridKey, setAllDebridKey] = useState("");
  const [tmdbKey, setTmdbKey] = useState("");
  const [searchViewMode, setSearchViewMode] = useState<ViewMode>("simple");
  const [viewMode, setViewMode] = useState<ViewMode>("simple");
  const [hideNfo, setHideNfo] = useState(true);
  const [skipNfoDownload, setSkipNfoDownload] = useState(true);
  const [theme, setThemeState] = useState<Theme>("dark");
  const [summerEnabled, setSummerEnabled] = useState(false);
  const [saving, setSaving] = useState(false);

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
    store.get<Theme>("theme").then((v) => setThemeState(v === "light" ? "light" : "dark"));
    store.get<boolean>("summer_pool_enabled").then((v) => setSummerEnabled(v ?? false));
  }, []);

  async function checkDns() {
    setDnsStatus("checking");
    try {
      await tauriFetch("https://c411.org", { method: "HEAD", connectTimeout: 6000 });
      setDnsStatus("ok");
    } catch {
      setDnsStatus("fail");
    }
  }

  function goToPrereqs() {
    setStep("prereqs");
    setDnsStatus("checking");
    checkDns();
  }

  const bothFilled = c411Key.trim() !== "" && allDebridKey.trim() !== "";

  async function handleKeysNext() {
    setSaving(true);
    try {
      await setApiKey("c411_api_key", c411Key.trim());
      await setApiKey("alldebrid_api_key", allDebridKey.trim());
      await setApiKey("tmdb_api_key", tmdbKey.trim());
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
              className="relative mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-6 py-12 sm:px-8"
            >
              <motion.div variants={item} className="flex flex-col items-center text-center mb-10">
                <div className="relative mb-4 flex h-72 w-72 items-center justify-center [perspective:700px]">
                  <motion.div
                    animate={{ opacity: [0.4, 0.9, 0.4], scale: [0.95, 1.15, 0.95] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute left-1/2 top-1/2 h-44 w-44 -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-500/50 blur-2xl"
                  />
                  {/* 3D scene: the logo sits at z=0, the orbit plane is tilted so icons pass in front of and behind it */}
                  <div className="absolute inset-0 flex items-center justify-center [transform-style:preserve-3d]">
                    <img
                      src={logo}
                      alt="XingXing Debrid"
                      className="relative h-32 w-32 rounded-2xl ring-1 ring-black/10 dark:ring-white/10 shadow-[0_0_50px_rgba(79,70,229,0.5)]"
                    />
                    <div className="pointer-events-none absolute inset-0 [transform-style:preserve-3d] [transform:rotateX(70deg)]">
                      <div className="absolute inset-[34px] rounded-full border border-dashed border-indigo-500/25" />
                      <motion.div
                        animate={{ rotateZ: 360 }}
                        transition={{ duration: 24, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-0 [transform-style:preserve-3d]"
                      >
                        {FEATURES.map((f, i) => (
                          <div
                            key={f.title}
                            className="absolute left-1/2 top-1/2 -ml-6 -mt-6 h-12 w-12 [transform-style:preserve-3d]"
                            style={{ transform: `rotateZ(${i * 90}deg) translateY(-110px)` }}
                          >
                            {/* counter-rotation + un-tilt so the icon stays upright and faces the camera */}
                            <motion.div
                              initial={{ rotateZ: -i * 90 }}
                              animate={{ rotateZ: -360 - i * 90 }}
                              transition={{ duration: 24, repeat: Infinity, ease: "linear" }}
                              className="h-12 w-12 [transform-style:preserve-3d]"
                            >
                              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/90 dark:bg-zinc-900/90 ring-1 ring-indigo-500/30 shadow-lg shadow-indigo-500/10 [transform:rotateX(-70deg)]">
                                <f.icon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                              </div>
                            </motion.div>
                          </div>
                        ))}
                      </motion.div>
                    </div>
                  </div>
                </div>
                <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white mb-3">
                  XingXing Debrid
                </h1>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-sm leading-relaxed">
                  De la recherche au visionnage, tout votre contenu en un seul endroit.
                </p>
              </motion.div>

              <div className="space-y-3 mb-10">
                {FEATURES.map((f) => (
                  <motion.div
                    key={f.title}
                    variants={item}
                    className="flex items-start gap-4 rounded-2xl bg-white/80 dark:bg-zinc-900/70 ring-1 ring-black/6 dark:ring-white/6 px-5 py-4"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-500/12 ring-1 ring-indigo-500/20">
                      <f.icon className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-zinc-900 dark:text-white mb-0.5">
                        {f.title}
                      </p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                        {f.text}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>

              <motion.div variants={item}>
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={goToPrereqs}
                  className="flex w-full items-center justify-center gap-2 h-11 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-sm font-semibold text-white transition-colors"
                >
                  Continuer
                  <ArrowRight className="h-4 w-4" />
                </motion.button>
              </motion.div>
            </motion.div>
          )}

          {step === "prereqs" && (
            <motion.div
              key="prereqs"
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, x: -24, transition: { duration: 0.2 } }}
              variants={stagger}
              className="relative mx-auto w-full max-w-xl px-6 pt-10 pb-12 sm:px-8 space-y-4"
            >
              <motion.div variants={item}>
                <motion.button
                  whileTap={{ scale: 0.93 }}
                  onClick={() => setStep("intro")}
                  className="flex items-center gap-1.5 text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors mb-6"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span className="text-sm font-medium">Retour</span>
                </motion.button>

                <div className="text-center mb-2">
                  <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white mb-2">
                    Avant de commencer
                  </h1>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
                    XingXing Debrid s'appuie sur des services externes. Voici ce dont vous avez
                    besoin.
                  </p>
                </div>
              </motion.div>

              {/* AllDebrid */}
              <motion.div
                variants={item}
                className="flex items-start gap-4 rounded-2xl bg-white/80 dark:bg-zinc-900/70 ring-1 ring-black/6 dark:ring-white/6 px-5 py-4"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/12 ring-1 ring-amber-500/20">
                  <CreditCard className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                      Compte AllDebrid
                    </p>
                    <span className="rounded-md bg-amber-500/12 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">
                      Payant
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    Service de debridage premium indispensable. Il convertit les liens magnets en
                    telechargements directs a haute vitesse. Un abonnement est requis.
                  </p>
                  <button
                    type="button"
                    onClick={() => openUrl("https://alldebrid.fr")}
                    className="mt-2 flex items-center gap-1 text-xs font-medium text-amber-600 hover:text-amber-500 dark:text-amber-400 dark:hover:text-amber-300 transition-colors"
                  >
                    alldebrid.fr
                    <ExternalLink className="h-3 w-3" />
                  </button>
                </div>
              </motion.div>

              {/* C411 */}
              <motion.div
                variants={item}
                className="flex items-start gap-4 rounded-2xl bg-white/80 dark:bg-zinc-900/70 ring-1 ring-black/6 dark:ring-white/6 px-5 py-4"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-500/12 ring-1 ring-indigo-500/20">
                  <UserRound className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                      Compte C411
                    </p>
                    <span className="rounded-md bg-emerald-500/12 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
                      Gratuit
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    Moteur de recherche indexant films, series et musiques. L'inscription est
                    gratuite et suffisante pour utiliser toutes les fonctionnalites.
                  </p>
                  <button
                    type="button"
                    onClick={() => openUrl("https://c411.org")}
                    className="mt-2 flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
                  >
                    c411.org
                    <ExternalLink className="h-3 w-3" />
                  </button>
                </div>
              </motion.div>

              {/* Internet */}
              <motion.div
                variants={item}
                className="flex items-start gap-4 rounded-2xl bg-white/80 dark:bg-zinc-900/70 ring-1 ring-black/6 dark:ring-white/6 px-5 py-4"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-500/12 ring-1 ring-sky-500/20">
                  <Wifi className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-zinc-900 dark:text-white mb-0.5">
                    Connexion internet
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    L'application necessite une connexion internet active pour rechercher du contenu
                    et interagir avec les services externes.
                  </p>
                </div>
              </motion.div>

              {/* DNS */}
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
                      DNS compatible C411
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                      C411 peut etre bloque par les DNS par defaut de certains fournisseurs d'acces.
                      Si le site n'est pas accessible, configurez un DNS alternatif tel que{" "}
                      <span className="font-mono text-zinc-600 dark:text-zinc-300">1.1.1.1</span>{" "}
                      (Cloudflare) ou{" "}
                      <span className="font-mono text-zinc-600 dark:text-zinc-300">8.8.8.8</span>{" "}
                      (Google).
                    </p>
                  </div>
                </div>

                <div
                  className="mt-4 rounded-xl px-4 py-3 flex items-center gap-3
                bg-zinc-100 dark:bg-zinc-950/60 ring-1 ring-black/6 dark:ring-white/6"
                >
                  {dnsStatus === "checking" && (
                    <>
                      <Loader2 className="h-4 w-4 shrink-0 animate-spin text-zinc-400" />
                      <p className="text-xs text-zinc-500">Verification de l'acces a c411.org...</p>
                    </>
                  )}
                  {dnsStatus === "ok" && (
                    <>
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                      <p className="text-xs text-zinc-700 dark:text-zinc-300">
                        c411.org est accessible depuis votre reseau.
                      </p>
                    </>
                  )}
                  {dnsStatus === "fail" && (
                    <>
                      <XCircle className="h-4 w-4 shrink-0 text-red-500" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-red-600 dark:text-red-400">
                          c411.org n'est pas accessible.
                        </p>
                        <p className="text-xs text-zinc-500 mt-0.5">
                          Votre DNS bloque peut-etre l'acces.{" "}
                          <button
                            type="button"
                            onClick={() => setShowDnsGuide(true)}
                            className="underline underline-offset-2 text-violet-600 dark:text-violet-400 hover:text-violet-500 transition-colors"
                          >
                            Voir le guide Windows
                          </button>
                        </p>
                      </div>
                    </>
                  )}
                  {dnsStatus === "idle" && (
                    <>
                      <AlertTriangle className="h-4 w-4 shrink-0 text-zinc-400" />
                      <p className="text-xs text-zinc-500">Acces a c411.org non verifie.</p>
                    </>
                  )}
                  {dnsStatus === "fail" && (
                    <button
                      type="button"
                      onClick={() => {
                        setDnsStatus("checking");
                        checkDns();
                      }}
                      className="ml-auto shrink-0 text-xs font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
                    >
                      Reessayer
                    </button>
                  )}
                </div>
              </motion.div>

              {import.meta.env.DEV && (
                <motion.div variants={item}>
                  <button
                    type="button"
                    onClick={() => setShowDnsGuide(true)}
                    className="w-full h-9 rounded-xl border border-dashed border-violet-500/40 text-xs font-medium text-violet-500 hover:bg-violet-500/6 transition-colors"
                  >
                    [DEV] Ouvrir le guide DNS
                  </button>
                </motion.div>
              )}

              <motion.div variants={item} className="pt-2">
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setStep("keys")}
                  className="flex w-full items-center justify-center gap-2 h-11 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-sm font-semibold text-white transition-colors"
                >
                  Continuer
                  <ArrowRight className="h-4 w-4" />
                </motion.button>
                {dnsStatus === "fail" && (
                  <p className="mt-2 text-center text-[11px] text-zinc-400 dark:text-zinc-600">
                    Vous pouvez continuer et configurer votre DNS plus tard.
                  </p>
                )}
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
                  onClick={() => setStep("prereqs")}
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
                    est optionnelle.
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
                url="https://www.themoviedb.org/settings/api"
                urlLabel="themoviedb.org"
                steps={TMDB_STEPS}
                value={tmdbKey}
                placeholder="Collez votre clé TMDB (optionnel)"
                onChange={setTmdbKey}
                optional
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
                  onClick={() => setStep("display")}
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
        {showDnsGuide && (
          <motion.div
            key="dns-guide"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowDnsGuide(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-2xl bg-[#f4f6fc] dark:bg-zinc-900 ring-1 ring-black/8 dark:ring-white/8 shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-black/6 dark:border-white/6">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-500/12 ring-1 ring-violet-500/20">
                    <Globe className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                      Configurer son DNS sur Windows
                    </p>
                    <p className="text-[11px] text-zinc-500 mt-0.5">Cloudflare DNS - 1.1.1.1</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDnsGuide(false)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-black/6 dark:hover:bg-white/6 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="px-5 py-4 space-y-3">
                {[
                  {
                    step: 1,
                    title: "Ouvrir les connexions reseau",
                    detail: (
                      <>
                        Appuyez sur{" "}
                        <kbd className="inline-flex items-center rounded bg-zinc-200 dark:bg-zinc-700 px-1.5 py-0.5 text-[11px] font-mono font-medium text-zinc-700 dark:text-zinc-200">
                          <svg
                            viewBox="0 0 24 24"
                            className="h-3 w-3"
                            fill="currentColor"
                            aria-label="Windows"
                          >
                            <path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-13.051-1.949" />
                          </svg>
                        </kbd>{" "}
                        +{" "}
                        <kbd className="rounded bg-zinc-200 dark:bg-zinc-700 px-1.5 py-0.5 text-[11px] font-mono font-medium text-zinc-700 dark:text-zinc-200">
                          R
                        </kbd>
                        , tapez{" "}
                        <span className="font-mono text-[12px] text-zinc-700 dark:text-zinc-300 bg-zinc-200 dark:bg-zinc-700 rounded px-1.5 py-0.5">
                          ncpa.cpl
                        </span>{" "}
                        et appuyez sur Entree.
                      </>
                    ),
                  },
                  {
                    step: 2,
                    title: "Ouvrir les proprietes de votre connexion",
                    detail: (
                      <>
                        Clic droit sur votre connexion active (Wi-Fi ou Ethernet) puis{" "}
                        <span className="font-medium text-zinc-700 dark:text-zinc-300">
                          Proprietes
                        </span>
                        .
                      </>
                    ),
                  },
                  {
                    step: 3,
                    title: "Selectionner IPv4",
                    detail: (
                      <>
                        Double-cliquez sur{" "}
                        <span className="font-medium text-zinc-700 dark:text-zinc-300">
                          Protocole Internet version 4 (TCP/IPv4)
                        </span>
                        .
                      </>
                    ),
                  },
                  {
                    step: 4,
                    title: "Saisir les adresses DNS",
                    detail: (
                      <>
                        Cochez{" "}
                        <span className="font-medium text-zinc-700 dark:text-zinc-300">
                          Utiliser les adresses de serveurs DNS suivantes
                        </span>{" "}
                        puis entrez :
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
                      </>
                    ),
                  },
                  {
                    step: 5,
                    title: "Valider",
                    detail: (
                      <>
                        Cliquez sur{" "}
                        <span className="font-medium text-zinc-700 dark:text-zinc-300">OK</span>{" "}
                        dans les deux fenetres, puis utilisez le bouton{" "}
                        <span className="font-medium text-zinc-700 dark:text-zinc-300">
                          Reessayer
                        </span>{" "}
                        ci-dessous pour verifier l'acces.
                      </>
                    ),
                  },
                ].map(({ step, title, detail }) => (
                  <div key={step} className="flex gap-3">
                    <span className="flex h-5 w-5 shrink-0 mt-0.5 items-center justify-center rounded-full bg-violet-600 text-[10px] font-bold text-white">
                      {step}
                    </span>
                    <div>
                      <p className="text-xs font-semibold text-zinc-900 dark:text-white mb-0.5">
                        {title}
                      </p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                        {detail}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="px-5 pb-5">
                <button
                  onClick={() => setShowDnsGuide(false)}
                  className="w-full h-10 rounded-xl bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-sm font-medium text-zinc-700 dark:text-zinc-300 transition-colors"
                >
                  Fermer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
