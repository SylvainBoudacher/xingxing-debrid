import { AppMenu, type Page } from "@/components/AppMenu";
import type { ApiKeys } from "@/components/ApiKeysForm";
import { SettingsRail } from "@/components/settings/SettingsRail";
import { ALL_NAV_ITEMS, type PanelId } from "@/components/settings/settingsNav";
import { AppearancePanel } from "@/components/settings/panels/AppearancePanel";
import { ApiKeysPanel } from "@/components/settings/panels/ApiKeysPanel";
import { DiscoverPanel } from "@/components/settings/panels/DiscoverPanel";
import { DisplayPanel } from "@/components/settings/panels/DisplayPanel";
import { LibraryPanel } from "@/components/settings/panels/LibraryPanel";
import { DownloadsPanel } from "@/components/settings/panels/DownloadsPanel";
import { MagnetsPanel } from "@/components/settings/panels/MagnetsPanel";
import { NyaaPanel } from "@/components/settings/panels/NyaaPanel";
import { SummerPanel } from "@/components/settings/panels/SummerPanel";
import { ArrowLeft } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

interface PreferencesPageProps {
  onBack: () => void;
  onNavigate: (page: Page) => void;
  hasPendingUpdate: boolean;
  onShowPendingUpdate: () => void;
  summerEnabled: boolean;
  onToggleSummer: (v: boolean) => void;
  summerFps: 30 | 60;
  onSetSummerFps: (v: 30 | 60) => void;
  summerMaxDucks: number;
  onSetSummerMaxDucks: (v: number) => void;
  idleAutoHide: boolean;
  onSetIdleAutoHide: (v: boolean) => void;
  onKeysSaved: (keys: ApiKeys) => void;
}

export function PreferencesPage({
  onBack,
  onNavigate,
  hasPendingUpdate,
  onShowPendingUpdate,
  summerEnabled,
  onToggleSummer,
  summerFps,
  onSetSummerFps,
  summerMaxDucks,
  onSetSummerMaxDucks,
  idleAutoHide,
  onSetIdleAutoHide,
  onKeysSaved,
}: PreferencesPageProps) {
  const [activePanel, setActivePanel] = useState<PanelId>(ALL_NAV_ITEMS[0].id);

  function renderPanel() {
    switch (activePanel) {
      case "appearance":
        return <AppearancePanel />;
      case "api-keys":
        return <ApiKeysPanel onSaved={onKeysSaved} />;
      case "display":
        return <DisplayPanel />;
      case "magnets":
        return <MagnetsPanel />;
      case "downloads":
        return <DownloadsPanel />;
      case "library":
        return <LibraryPanel />;
      case "nyaa":
        return <NyaaPanel />;
      case "discover":
        return <DiscoverPanel />;
      case "summer":
        return (
          <SummerPanel
            summerEnabled={summerEnabled}
            onToggleSummer={onToggleSummer}
            summerFps={summerFps}
            onSetSummerFps={onSetSummerFps}
            summerMaxDucks={summerMaxDucks}
            onSetSummerMaxDucks={onSetSummerMaxDucks}
            idleAutoHide={idleAutoHide}
            onSetIdleAutoHide={onSetIdleAutoHide}
          />
        );
    }
  }

  return (
    <main className="relative flex min-h-screen flex-col bg-[#f4f6fc] dark:bg-[#05060c]">
      {/* Grid background */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.06)_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.13)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.13)_1px,transparent_1px)] bg-[size:36px_36px] [mask-image:linear-gradient(to_right,black,transparent_38%,transparent_62%,black),radial-gradient(ellipse_85%_80%_at_50%_0%,black_25%,transparent_90%)] [mask-composite:intersect]" />

      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-black/5 dark:border-white/5 bg-white/60 dark:bg-black/30 backdrop-blur-xl">
        <div className="relative mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-4 sm:px-8">
          <motion.button
            whileTap={{ scale: 0.93 }}
            onClick={onBack}
            className="flex items-center gap-1.5 text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm font-medium">Retour</span>
          </motion.button>

          <h1 className="text-sm font-semibold text-zinc-900 dark:text-white tracking-tight absolute left-1/2 -translate-x-1/2">
            Paramètres
          </h1>

          <AppMenu
            currentPage="preferences"
            onNavigate={onNavigate}
            onBack={onBack}
            hasPendingUpdate={hasPendingUpdate}
            onShowPendingUpdate={onShowPendingUpdate}
          />
        </div>
      </div>

      {/* Content */}
      <div className="relative mx-auto flex w-full max-w-4xl gap-10 px-6 pt-10 pb-10 sm:px-8">
        <SettingsRail active={activePanel} onSelect={setActivePanel} />

        <div className="min-w-0 max-w-xl flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={activePanel}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
            >
              {renderPanel()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </main>
  );
}
