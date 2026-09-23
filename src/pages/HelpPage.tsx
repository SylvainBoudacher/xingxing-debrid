import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { AppMenu, type Page } from "@/components/AppMenu";
import { PageHeader } from "@/components/PageHeader";
import { HelpRail } from "@/components/help/HelpRail";
import { HELP_NAV_ITEMS, type HelpPanelId } from "@/components/help/helpNav";
import { HowItWorksTab } from "@/components/help/HowItWorksTab";
import { DnsTab } from "@/components/help/DnsTab";
import { JourneyTab } from "@/components/help/JourneyTab";
import { ApiKeysHelpTab } from "@/components/help/ApiKeysHelpTab";
import { VlcHelpTab } from "@/components/help/VlcHelpTab";
import { ErrorsHelpTab } from "@/components/help/ErrorsHelpTab";
import { useDnsCheck } from "@/lib/useDnsCheck";
import { useVlcDetection } from "@/lib/useVlcDetection";

interface HelpPageProps {
  onBack: () => void;
  onNavigate: (page: Page) => void;
  hasPendingUpdate: boolean;
  onShowPendingUpdate: () => void;
}

export function HelpPage({
  onBack,
  onNavigate,
  hasPendingUpdate,
  onShowPendingUpdate,
}: HelpPageProps) {
  const [activePanel, setActivePanel] = useState<HelpPanelId>(HELP_NAV_ITEMS[0].id);
  const dns = useDnsCheck();
  const vlc = useVlcDetection();

  // Tests lancés dès l'arrivée, pour que les résultats soient prêts à l'ouverture des panneaux.
  useEffect(() => {
    dns.check();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      case "how":
        return <HowItWorksTab />;
      case "journey":
        return <JourneyTab />;
      case "keys":
        return <ApiKeysHelpTab />;
      case "dns":
        return <DnsTab dnsStatus={dns.status} dnsError={dns.error} onCheck={dns.check} />;
      case "vlc":
        return (
          <VlcHelpTab
            detected={vlc.detected}
            checking={vlc.checking}
            onCheck={vlc.check}
            onPick={vlc.pick}
          />
        );
      case "errors":
        return <ErrorsHelpTab onGoTo={setActivePanel} />;
    }
  }

  return (
    <main className="relative flex min-h-screen flex-col bg-[#f4f6fc] dark:bg-[#05060c]">
      {/* Dot background + top glow (distinct from the Preferences grid) */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(rgba(15,23,42,0.2)_1px,transparent_1.5px)] dark:bg-[radial-gradient(rgba(255,255,255,0.28)_1px,transparent_1.5px)] bg-[size:22px_22px] [mask-image:radial-gradient(ellipse_90%_70%_at_50%_0%,black_20%,transparent_85%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(ellipse_60%_100%_at_50%_0%,rgba(16,185,129,0.08),transparent_70%)] dark:bg-[radial-gradient(ellipse_60%_100%_at_50%_0%,rgba(16,185,129,0.1),transparent_70%)]" />

      <PageHeader
        title="Aide"
        onBack={onBack}
        menu={
          <AppMenu
            currentPage="help"
            onNavigate={onNavigate}
            onBack={onBack}
            hasPendingUpdate={hasPendingUpdate}
            onShowPendingUpdate={onShowPendingUpdate}
          />
        }
      />

      <div className="relative mx-auto flex w-full max-w-5xl gap-10 px-6 pt-10 pb-10 sm:px-8">
        <HelpRail active={activePanel} onSelect={setActivePanel} />

        <div className="min-w-0 max-w-2xl flex-1">
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
