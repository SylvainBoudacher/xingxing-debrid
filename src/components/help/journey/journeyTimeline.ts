import { createTimeline, stagger } from "animejs";
import { LINKS, PACKET, STEP_COUNT, STEP_MS, type LinkId } from "./journeyStage";

export interface JourneySequence {
  goTo: (step: number) => void;
  revert: () => void;
}

/** Image montree par etape en reduced-motion : la fin de chaque etape, avant sa sortie. */
const STEP_FINAL_OFFSET = STEP_MS - 1000;

const packetMove = (id: LinkId, duration: number) => {
  const { from, to } = LINKS[id];
  return {
    x: [from.x - PACKET / 2, to.x - PACKET / 2],
    y: [from.y - PACKET / 2, to.y - PACKET / 2],
    opacity: [0, 1, 1, 0],
    duration,
    ease: "inOutQuad",
  };
};

/**
 * Trois temps de STEP_MS : recherche, ajout (bibliotheque et AllDebrid en parallele),
 * puis choix entre streaming et telechargement. Chaque propriete animee part d'une valeur explicite,
 * pour qu'un saut (clic sur une etape) redessine la scene correctement.
 */
export function playJourney(
  root: HTMLElement,
  reduced: boolean,
  onStep: (step: number) => void,
): JourneySequence {
  const q = (s: string) => Array.from(root.querySelectorAll<HTMLElement>(s));
  const t = (step: number, ms = 0) => step * STEP_MS + ms;

  let current = -1;
  const report = (time: number) => {
    const step = Math.min(STEP_COUNT - 1, Math.floor(time / STEP_MS));
    if (step !== current) {
      current = step;
      onStep(step);
    }
  };

  const tl = createTimeline({
    defaults: { duration: 500, ease: "outQuart" },
    autoplay: !reduced,
    loop: !reduced,
    onUpdate: (self) => report(self.iterationCurrentTime),
  });

  tl
    // Etat de depart
    .set("[data-scene-search]", { opacity: 1 }, 0)
    .set("[data-scene-flow]", { opacity: 0 }, 0)
    .set(q("[data-result]"), { opacity: 0 }, 0)
    .set("[data-query]", { clipPath: "inset(0 100% 0 0)" }, 0)
    .set("[data-cursor]", { x: 60, y: 190, opacity: 0 }, 0)
    .set("[data-packet]", { opacity: 0 }, 0)
    .set("[data-debrid-bar]", { scaleX: 0 }, 0)
    .set("[data-vlc-bar]", { scaleX: 0 }, 0)
    .set("[data-vlc-film]", { opacity: 0, scale: 1.15 }, 0)
    .set("[data-vlc-play]", { opacity: 1, scale: 1 }, 0)
    .set("[data-folder-bar]", { scaleX: 0 }, 0)
    .set(q("[data-highlight]"), { opacity: 0 }, 0)
    .set("[data-choice]", { opacity: 0 }, 0)

    // 1. Rechercher
    .add("[data-cursor]", { opacity: [0, 1], duration: 300 }, t(0, 100))
    .add(
      "[data-cursor]",
      { x: [60, 120], y: [190, 30], duration: 700, ease: "inOutQuad" },
      t(0, 300),
    )
    .add(
      "[data-query]",
      { clipPath: ["inset(0 100% 0 0)", "inset(0 0% 0 0)"], duration: 600, ease: "linear" },
      t(0, 1100),
    )
    .add(q("[data-result]"), { opacity: [0, 1], y: [8, 0], delay: stagger(120) }, t(0, 1800))
    .add(
      "[data-cursor]",
      { x: [120, 300], y: [30, 76], duration: 600, ease: "inOutQuad" },
      t(0, 2500),
    )
    .add("[data-result-pick]", { scale: [1, 0.96, 1], duration: 400 }, t(0, 3150))
    .add("[data-cursor]", { opacity: [1, 0], duration: 300 }, t(0, 3500))

    // 2. Ajouter : bibliotheque et AllDebrid partent ensemble
    .add("[data-scene-search]", { opacity: [1, 0], duration: 400 }, t(1))
    .add("[data-scene-flow]", { opacity: [0, 1], duration: 500 }, t(1, 200))
    .add("[data-highlight=c411]", { opacity: [0, 1, 0], duration: 1400 }, t(1, 500))
    .add("[data-packet=library]", packetMove("toLibrary", 1000), t(1, 700))
    .add("[data-packet=debrid]", packetMove("toDebrid", 1000), t(1, 700))
    .add("[data-highlight=library]", { opacity: [0, 1] }, t(1, 1600))
    .add("[data-highlight=debrid]", { opacity: [0, 1] }, t(1, 1600))
    .add("[data-debrid-bar]", { scaleX: [0, 1], duration: 1600, ease: "inOutSine" }, t(1, 1800))

    // 3. Le choix : streaming a la volee, ou telechargement du fichier debride
    .add("[data-highlight=library]", { opacity: [1, 0] }, t(2))
    .add("[data-highlight=debrid]", { opacity: [1, 0] }, t(2))
    .add("[data-choice]", { opacity: [0, 1], scale: [0.6, 1], ease: "outBack" }, t(2, 100))
    .add("[data-packet=vlc]", packetMove("toVlc", 900), t(2, 300))
    .add("[data-packet=folder]", packetMove("toFolder", 900), t(2, 300))
    .add("[data-highlight=vlc]", { opacity: [0, 1] }, t(2, 1100))
    .add("[data-highlight=folder]", { opacity: [0, 1] }, t(2, 1100))
    // VLC lit sans attendre : sa barre part avant celle du telechargement.
    // Le lecteur demarre : clic sur play, l'image s'allume et la lecture avance.
    .add("[data-vlc-play]", { scale: [1, 0.8, 1.5], opacity: [1, 1, 0], duration: 500 }, t(2, 1100))
    .add("[data-vlc-film]", { opacity: [0, 1], scale: [1.15, 1], duration: 1400 }, t(2, 1300))
    .add("[data-vlc-bar]", { scaleX: [0, 0.35], duration: 2000, ease: "linear" }, t(2, 1400))
    .add("[data-folder-bar]", { scaleX: [0, 1], duration: 2200, ease: "inOutSine" }, t(2, 1400))
    .add(q("[data-highlight=vlc], [data-highlight=folder]"), { opacity: [1, 0] }, t(2, 3400))
    // Termine pile a la fin de la derniere etape : la boucle repart sans temps mort.
    .add("[data-scene-flow]", { opacity: [1, 0], duration: 500 }, t(2, 3500));

  const showStep = (step: number) => {
    const at = reduced ? t(step, STEP_FINAL_OFFSET) : t(step);
    tl.seek(at);
    report(at);
  };

  showStep(0);
  if (!reduced) tl.play();

  return {
    goTo: showStep,
    revert: () => tl.revert(),
  };
}
