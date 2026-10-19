import { ARROW, PUMPKIN, SPROUT } from "@/components/gardenButtonSprites";
import { GardenButtonSprite } from "@/components/GardenButtonSprite";
import { openPotagerWindow } from "@/potager/ui/potagerWindow";

// Panneau de bois pixel qui ouvre la fenêtre Potager.
export function GardenButton() {
  return (
    <button
      type="button"
      onClick={() => void openPotagerWindow()}
      aria-label="Ouvrir mon potager"
      className="garden-sign group relative cursor-pointer"
    >
      <GardenButtonSprite
        rows={SPROUT}
        scale={3}
        className="garden-sign-sprout absolute -top-[14px]"
      />
      <span className="garden-sign-plank relative flex items-center gap-3 px-5 py-2.5">
        <span className="garden-sign-nail left-1.5 top-1.5" />
        <span className="garden-sign-nail right-1.5 top-1.5" />
        <span className="garden-sign-nail left-1.5 bottom-1.5" />
        <span className="garden-sign-nail right-1.5 bottom-1.5" />
        <GardenButtonSprite
          rows={PUMPKIN}
          scale={3}
          className="transition-transform duration-150 group-hover:-rotate-6"
        />
        <span className="flex flex-col items-start leading-none">
          <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#f0dc8a]/80">
            Récolte &amp; semis
          </span>
          <span className="garden-sign-label mt-1 text-base font-black uppercase tracking-[0.12em]">
            Mon potager
          </span>
        </span>
        <GardenButtonSprite rows={ARROW} scale={3} className="garden-sign-arrow" />
      </span>
    </button>
  );
}
