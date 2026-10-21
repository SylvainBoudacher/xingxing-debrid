import type { SachetId } from "../core/economy/catalog";
import type { PotagerSave, Seed } from "../core/types";
import { AbriPanel } from "./AbriPanel";
import { CabanePanel } from "./CabanePanel";
import { EtalPanel } from "./EtalPanel";
import { MaisonPanel } from "./MaisonPanel";
import { ParcelSignPanel } from "./ParcelSignPanel";
import { PriceSignPanel } from "./PriceSignPanel";
import { StakePanel } from "./StakePanel";
import { MAISON_PRICE } from "../core/staff/catalog";
import type { useEconomy } from "./useEconomy";
import type { useGardenActions } from "./useGardenActions";
import type { useStaff } from "./useStaff";

// Le panneau ouvert devant l'élément du jardin.
export function GardenPanels({
  save,
  garden,
  eco,
  staff,
  onServe,
  onOpenSachet,
}: {
  save: PotagerSave;
  garden: ReturnType<typeof useGardenActions>;
  eco: ReturnType<typeof useEconomy>;
  staff: ReturnType<typeof useStaff>;
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
  if (panel.kind === "chantier")
    return (
      <PriceSignPanel
        question={`Construire la maison des employés pour ${MAISON_PRICE} PO ?`}
        price={MAISON_PRICE}
        po={save.po}
        onBuy={() => staff.buyMaison() && closePanel()}
        onClose={closePanel}
      />
    );
  if (panel.kind === "maison")
    return <MaisonPanel save={save} staff={staff} onClose={closePanel} />;
  if (panel.kind === "piquet")
    return (
      <StakePanel
        save={save}
        parcel={panel.parcel}
        onParcel={(id, on) => staff.setParcel(id, panel.parcel, on)}
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
