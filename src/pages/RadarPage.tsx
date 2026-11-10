import { AppMenu, type Page } from "@/components/AppMenu";
import { PageHeader } from "@/components/PageHeader";

interface RadarPageProps {
  onBack: () => void;
  onNavigate: (page: Page) => void;
  hasPendingUpdate: boolean;
  onShowPendingUpdate: () => void;
}

export function RadarPage({
  onBack,
  onNavigate,
  hasPendingUpdate,
  onShowPendingUpdate,
}: RadarPageProps) {
  return (
    <PageHeader
      title="Radar"
      onBack={onBack}
      menu={
        <AppMenu
          currentPage="radar"
          onNavigate={onNavigate}
          onBack={onBack}
          hasPendingUpdate={hasPendingUpdate}
          onShowPendingUpdate={onShowPendingUpdate}
        />
      }
    />
  );
}
