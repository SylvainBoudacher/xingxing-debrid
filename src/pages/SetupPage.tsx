import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Download,
  Loader2,
  FolderOpen,
  Moon,
  Settings,
  Sparkles,
  Sun,
  Upload,
  Zap,
} from "lucide-react";
import { SetupIntroSequence } from "@/components/setupIntro/SetupIntroSequence";
import { open as openDialog } from "@tauri-apps/plugin-dialog";
import { LazyStore } from "@tauri-apps/plugin-store";
import { toast } from "sonner";
import { setApiKey } from "@/lib/apiKeys";
import { httpFetch } from "@/lib/networkError";
import { pickBackupFile } from "@/lib/profileBackup";
import { ImportProfileModal } from "@/components/ImportProfileModal";
import { ServicesStep } from "@/components/setup/ServicesStep";
import { NetworkStep, type DnsStatus } from "@/components/setup/NetworkStep";
import { KeyWizard } from "@/components/setup/keys/KeyWizard";
import { KEY_SERVICES } from "@/lib/keyServices";
import { item, stagger } from "@/components/setup/motionVariants";
import { SetupStepper } from "@/components/setup/SetupStepper";
import { StepKindBadge } from "@/components/setup/StepKindBadge";
import type { StepId } from "@/components/setup/steps";
import { applyTheme, type Theme } from "@/lib/theme";

const PixelPool = lazy(() =>
  import("@/components/PixelPool").then((m) => ({ default: m.PixelPool })),
);

const store = new LazyStore("settings.json", { defaults: {}, autoSave: false });

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

interface SetupPageProps {
  onComplete: () => void;
}

export function SetupPage({ onComplete }: SetupPageProps) {
  const [step, setStep] = useState<"intro" | StepId>("intro");
  const [keyIndex, setKeyIndex] = useState(0);
  const [dnsStatus, setDnsStatus] = useState<DnsStatus>("idle");
  const [dnsError, setDnsError] = useState("");
  // Simulation dev : le resultat force survit aux retests, sinon le vrai
  // reseau reprend la main des le clic suivant.
  const [dnsSim, setDnsSim] = useState<"none" | "ok" | "fail">("none");
  const [downloadDir, setDownloadDir] = useState("");
  const [batchSize, setBatchSize] = useState(2);
  const [theme, setThemeState] = useState<Theme>("dark");
  const [summerEnabled, setSummerEnabled] = useState(false);
  const [saving, setSaving] = useState(false);
  const [importPath, setImportPath] = useState<string | null>(null);
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    store.get<string>("download_dir").then((v) => setDownloadDir(v ?? ""));
    store.get<number>("download_batch_size").then((v) => setBatchSize(v ?? 2));
    store.get<Theme>("theme").then((v) => setThemeState(v === "light" ? "light" : "dark"));
    store.get<boolean>("summer_pool_enabled").then((v) => setSummerEnabled(v ?? false));
  }, []);

  async function checkDns() {
    setDnsError("");
    setDnsStatus("checking");
    if (import.meta.env.DEV && dnsSim !== "none") {
      await new Promise((r) => setTimeout(r, 600));
      setDnsError(dnsSim === "fail" ? "[DEV] echec simule" : "");
      setDnsStatus(dnsSim);
      return;
    }
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

  async function handleKeysDone(values: Record<string, string>) {
    setSaving(true);
    try {
      for (const service of KEY_SERVICES) {
        await setApiKey(service.keyName, (values[service.id] ?? "").trim());
      }
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

  // Chaque etape repart en haut : sinon la barre d'etapes reste hors champ
  // quand on arrive depuis le bas d'une page longue. Le <main> est en
  // overflow-hidden : il accumule un scrollTop invisible qu'il faut vider aussi.
  useEffect(() => {
    window.scrollTo({ top: 0 });
    if (mainRef.current) mainRef.current.scrollTop = 0;
  }, [step]);

  // Un seul retour pour tout le parcours : il vit dans la barre d'etapes.
  function goBack() {
    if (step === "services") return setStep("intro");
    if (step === "network") return setStep("services");
    if (step === "keys") return keyIndex > 0 ? setKeyIndex(keyIndex - 1) : setStep("network");
    if (step === "downloads") return setStep("keys");
    if (step === "theme") return setStep("downloads");
  }

  return (
    <main
      ref={mainRef}
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
        {step !== "intro" && (
          <div className="mx-auto flex w-full max-w-2xl items-start gap-3 px-6 pt-6 sm:px-8">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={goBack}
              aria-label="Revenir a l'etape precedente"
              className="-mt-3.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/80 dark:bg-zinc-900/70 ring-1 ring-black/10 dark:ring-white/10 text-zinc-600 dark:text-zinc-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </motion.button>
            <SetupStepper
              currentId={step}
              progress={step === "keys" ? keyIndex / KEY_SERVICES.length : 0}
              onNavigate={setStep}
            />
          </div>
        )}
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

          {step === "services" && <ServicesStep onNext={() => setStep("network")} />}

          {step === "network" && (
            <NetworkStep
              dnsStatus={dnsStatus}
              dnsError={dnsError}
              onCheck={checkDns}
              onNext={() => setStep("keys")}
            />
          )}

          {step === "keys" && (
            <KeyWizard index={keyIndex} onIndexChange={setKeyIndex} onDone={handleKeysDone} />
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
                <div className="text-center mb-2">
                  <div className="mb-2 flex justify-center">
                    <StepKindBadge kind="config" />
                  </div>
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
                  Ou les fichiers debrides sont enregistres. Il n'y a pas de dossier par defaut :
                  choisissez celui que vous voulez, il restera modifiable dans les Preferences.
                </p>

                <div className="flex items-center justify-between gap-4 rounded-xl bg-zinc-100 dark:bg-zinc-950/60 ring-1 ring-black/6 dark:ring-white/6 px-4 py-3">
                  <p
                    className={`truncate text-sm ${
                      downloadDir
                        ? "font-medium text-zinc-900 dark:text-white"
                        : "text-zinc-500 dark:text-zinc-400"
                    }`}
                  >
                    {downloadDir || "Aucun dossier choisi"}
                  </p>
                  <button
                    onClick={async () => {
                      const picked = await openDialog({ directory: true, multiple: false });
                      if (typeof picked === "string") setDownloadDir(picked);
                    }}
                    className="flex shrink-0 items-center gap-2 rounded-full bg-white/90 dark:bg-zinc-800/80 ring-1 ring-black/10 dark:ring-white/10 px-4 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700/80 hover:text-zinc-900 dark:hover:text-white transition-colors"
                  >
                    <FolderOpen className="h-3.5 w-3.5" />
                    {downloadDir ? "Changer" : "Choisir"}
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
                  disabled={!downloadDir || saving}
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
                {!downloadDir && (
                  <p className="mt-2 text-center text-[11px] text-zinc-400 dark:text-zinc-600">
                    Choisissez un dossier de telechargement pour continuer.
                  </p>
                )}
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
                <div className="text-center mb-2">
                  <div className="mb-2 flex justify-center">
                    <StepKindBadge kind="config" />
                  </div>
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

      {import.meta.env.DEV && step === "network" && (
        <div className="fixed bottom-14 right-4 z-50 flex gap-1">
          {(["none", "ok", "fail"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => {
                setDnsSim(mode);
                if (mode !== "none") {
                  setDnsError(mode === "fail" ? "[DEV] echec simule" : "");
                  setDnsStatus(mode);
                }
              }}
              className={`rounded-lg border border-dashed px-2.5 py-1 text-[10px] font-bold tracking-wider transition-colors ${
                dnsSim === mode
                  ? "border-violet-500 bg-violet-500/15 text-violet-500"
                  : "border-violet-500/40 bg-white/70 text-violet-500/70 hover:bg-violet-500/10 dark:bg-zinc-950/60"
              }`}
            >
              {mode === "none" ? "[DEV] DNS REEL" : mode === "ok" ? "DNS OK" : "DNS KO"}
            </button>
          ))}
        </div>
      )}

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
