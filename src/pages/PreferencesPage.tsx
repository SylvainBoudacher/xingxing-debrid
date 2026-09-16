import { AppMenu, type Page } from "@/components/AppMenu";
import type { ApiKeys } from "@/lib/apiKeys";
import { SettingsRail } from "@/components/settings/SettingsRail";
import { ALL_NAV_ITEMS, type PanelId } from "@/components/settings/settingsNav";
import { AppearancePanel } from "@/components/settings/panels/AppearancePanel";
import { TextScalePanel } from "@/components/settings/panels/TextScalePanel";
import { ApiKeysPanel } from "@/components/settings/panels/ApiKeysPanel";
import { BackupTransferPanel } from "@/components/settings/panels/BackupTransferPanel";
import { DisplayPanel } from "@/components/settings/panels/DisplayPanel";
import { LibraryPanel } from "@/components/settings/panels/LibraryPanel";
import { DownloadsPanel } from "@/components/settings/panels/DownloadsPanel";
import { PlaybackPanel } from "@/components/settings/panels/PlaybackPanel";
import { MagnetsPanel } from "@/components/settings/panels/MagnetsPanel";
import { NyaaPanel } from "@/components/settings/panels/NyaaPanel";
import { ShortcutsPanel } from "@/components/settings/panels/ShortcutsPanel";
import type { Backdrop } from "@/lib/backdropPref";
import { BackdropPanel } from "@/components/settings/panels/BackdropPanel";
import { PageHeader } from "@/components/PageHeader";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";

interface PreferencesPageProps {
  onBack: () => void;
  onNavigate: (page: Page) => void;
  hasPendingUpdate: boolean;
  onShowPendingUpdate: () => void;
  backdrop: Backdrop;
  onSetBackdrop: (v: Backdrop) => void;
  summerFps: 30 | 60;
  onSetSummerFps: (v: 30 | 60) => void;
  summerMaxDucks: number;
  onSetSummerMaxDucks: (v: number) => void;
  idleAutoHide: boolean;
  onSetIdleAutoHide: (v: boolean) => void;
  onKeysSaved: (keys: Partial<ApiKeys>) => void;
  initialPanel?: PanelId;
}

export function PreferencesPage({
  onBack,
  onNavigate,
  hasPendingUpdate,
  onShowPendingUpdate,
  backdrop,
  onSetBackdrop,
  summerFps,
  onSetSummerFps,
  summerMaxDucks,
  onSetSummerMaxDucks,
  idleAutoHide,
  onSetIdleAutoHide,
  onKeysSaved,
  initialPanel,
}: PreferencesPageProps) {
  const [activePanel, setActivePanel] = useState<PanelId>(initialPanel ?? ALL_NAV_ITEMS[0].id);

  // Escape : retour à l'accueil.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onBack();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onBack]);

  function renderPanel() {
    switch (activePanel) {
      case "appearance":
        return <AppearancePanel />;
      case "text-scale":
        return <TextScalePanel />;
      case "api-keys":
        return <ApiKeysPanel onSaved={onKeysSaved} />;
      case "shortcuts":
        return <ShortcutsPanel />;
      case "display":
        return <DisplayPanel />;
      case "magnets":
        return <MagnetsPanel />;
      case "playback":
        return <PlaybackPanel />;
      case "downloads":
        return <DownloadsPanel />;
      case "library":
        return <LibraryPanel />;
      case "nyaa":
        return <NyaaPanel />;
      case "backup-transfer":
        return <BackupTransferPanel />;
      case "summer":
        return (
          <BackdropPanel
            backdrop={backdrop}
            onSetBackdrop={onSetBackdrop}
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
      <PageHeader
        title="Paramètres"
        onBack={onBack}
        menu={
          <AppMenu
            currentPage="preferences"
            onNavigate={onNavigate}
            onBack={onBack}
            hasPendingUpdate={hasPendingUpdate}
            onShowPendingUpdate={onShowPendingUpdate}
          />
        }
      />

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
