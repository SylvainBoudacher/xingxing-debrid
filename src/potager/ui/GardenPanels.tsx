import type { SachetId } from "../core/economy/catalog";
import type { PotagerSave, Seed } from "../core/types";
import { AbriPanel } from "./AbriPanel";
import { CabanePanel } from "./CabanePanel";
import { EtalPanel } from "./EtalPanel";
import { ParcelSignPanel } from "./ParcelSignPanel";
import type { useEconomy } from "./useEconomy";
import type { useGardenActions } from "./useGardenActions";

// Le panneau ouvert devant l'élément du jardin.
export function GardenPanels({
  save,
  garden,
  eco,
  onServe,
  onOpenSachet,
}: {
  save: PotagerSave;
  garden: ReturnType<typeof useGardenActions>;
  eco: ReturnType<typeof useEconomy>;
  onServe: (stallIndex: number) => void;
  onOpenSachet: (sachet: SachetId, seeds: Seed[]) => void;
}) {
  const { panel, closePanel } = garden;
  if (!panel) return null;
  if (panel.kind === "abri")
    return (
      <AbriPanel
        save={save}
        onDeposit={garden.deposit}
        onWithdrawTool={garden.withdrawTool}
        onWithdrawStack={garden.withdrawStack}
        onUpgrade={eco.upgradeChest}
        onClose={closePanel}
      />
    );
  if (panel.kind === "etal")
    return (
      <EtalPanel
        save={save}
        onStock={eco.stock}
        onUnstock={eco.unstock}
        onServe={onServe}
        onUpgrade={eco.upgradeStall}
        onClose={closePanel}
      />
    );
  if (panel.kind === "cabane")
    return (
      <CabanePanel
        save={save}
        onBuySachet={(id) => {
          const seeds = eco.buySachet(id);
          if (!seeds) return;
          closePanel();
          onOpenSachet(id, seeds);
        }}
        onBuyTool={eco.buyTool}
        onClose={closePanel}
      />
    );
  return (
    <ParcelSignPanel
      parcel={panel.parcel}
      po={save.po}
      onBuy={() => eco.buyParcel(panel.parcel) && closePanel()}
      onClose={closePanel}
    />
  );
}
