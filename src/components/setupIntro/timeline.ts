import { animate, createTimeline, stagger, type JSAnimation, type Timeline } from "animejs";
import { CURSOR_MARKS, FILM_SECONDS, formatTime } from "./stage";

export interface IntroSequence {
  revert: () => void;
}

const CURSOR_TRAVEL = 450;
const LOOP_DELAY = 350;
/** Fin de la scene jouee, avant le fondu de sortie : l'image a figer en mode reduced-motion. */
const FINAL_FRAME = 5300;

/**
 * Trois temps joues par un curseur : on cherche, on ajoute a la bibliotheque,
 * on regarde. Le lecteur continue de tourner une fois la sequence finie.
 */
export function playIntroSequence(root: HTMLElement, reduced: boolean): IntroSequence {
  const loops: JSAnimation[] = [];
  const captions = Array.from(root.querySelectorAll<HTMLElement>("[data-caption]"));
  const timeEl = root.querySelector<HTMLElement>("[data-time]");
  const progressEl = root.querySelector<HTMLElement>("[data-progress]");
  const playhead = { seconds: 0 };

  const renderPlayhead = () => {
    if (timeEl) timeEl.textContent = formatTime(playhead.seconds);
    if (progressEl) {
      progressEl.style.transform = `scaleX(${playhead.seconds / FILM_SECONDS})`;
    }
  };

  const moveCursor = (mark: { x: number; y: number }) => ({
    x: mark.x,
    y: mark.y,
    duration: CURSOR_TRAVEL,
    ease: "inOutQuad",
  });

  const click = { scale: [1, 1.9], opacity: [0.9, 0], duration: 450, ease: "outQuad" };

  // anime ne restaure que les proprietes qu'on lui a confiees : a chaque tour de
  // boucle il faut remettre nous-memes la scene dans son etat de depart.
  const HIDDEN_AT_START = [
    "[data-scene-player]",
    "[data-searchbar]",
    "[data-row]",
    "[data-caret]",
    "[data-added]",
    "[data-add-check]",
    "[data-controls]",
    "[data-cursor]",
    "[data-caption]",
  ];

  const resetScene = () => {
    for (const selector of HIDDEN_AT_START) {
      for (const el of root.querySelectorAll<HTMLElement>(selector)) el.style.opacity = "0";
    }
    const searchScene = root.querySelector<HTMLElement>("[data-scene-search]");
    if (searchScene) {
      searchScene.style.opacity = "1";
      searchScene.style.transform = "scale(1)";
    }
    const plus = root.querySelector<HTMLElement>("[data-add-plus]");
    if (plus) {
      plus.style.opacity = "1";
      plus.style.transform = "scale(1)";
    }
    const query = root.querySelector<HTMLElement>("[data-query]");
    if (query) query.style.clipPath = "inset(0 100% 0 0)";
    playhead.seconds = 0;
    renderPlayhead();
  };

  const tl: Timeline = createTimeline({
    defaults: { duration: 500, ease: "outExpo" },
    autoplay: !reduced,
    loop: !reduced,
    loopDelay: LOOP_DELAY,
  });

  tl.call(resetScene, 0)

    // Temps 1 : cherchez
    .set("[data-cursor]", { x: CURSOR_MARKS.start.x, y: CURSOR_MARKS.start.y })
    .add("[data-cursor]", { opacity: [0, 1], duration: 300 }, 0)
    .add(captions[0], { opacity: [0, 1], y: [6, 0] }, 150)
    .add("[data-searchbar]", { opacity: [0, 1], y: [8, 0] }, 150)
    .add("[data-cursor]", moveCursor(CURSOR_MARKS.searchBar), 400)
    .add("[data-ripple]", click, 850)
    .add("[data-caret]", { opacity: [0, 1], duration: 200 }, 900)
    .add(
      "[data-query]",
      { clipPath: ["inset(0 100% 0 0)", "inset(0 0% 0 0)"], duration: 600, ease: "linear" },
      950,
    )
    .add(
      Array.from(root.querySelectorAll<HTMLElement>("[data-row]")),
      { opacity: [0, 1], y: [10, 0], duration: 450, delay: stagger(90) },
      1500,
    )

    // Temps 2 : ajoutez
    .add(captions[0], { opacity: 0, duration: 250 }, 1750)
    .add(captions[1], { opacity: [0, 1], y: [6, 0] }, 1800)
    .add("[data-cursor]", moveCursor(CURSOR_MARKS.addButton), 1800)
    .add("[data-ripple]", click, 2250)
    .add("[data-add]", { scale: [1, 0.82, 1], duration: 400, ease: "outBack" }, 2250)
    .add("[data-add-plus]", { opacity: 0, scale: 0.6, duration: 250 }, 2300)
    .add("[data-add-check]", { opacity: [0, 1], scale: [0.6, 1], duration: 350 }, 2350)
    .add("[data-added]", { opacity: [0, 1], x: [-8, 0], duration: 400 }, 2400)

    // Temps 3 : regardez
    .add(captions[1], { opacity: 0, duration: 250 }, 2750)
    .add(captions[2], { opacity: [0, 1], y: [6, 0] }, 2800)
    .add("[data-scene-search]", { opacity: 0, scale: 0.96, duration: 500 }, 2850)
    .add(
      "[data-scene-player]",
      { opacity: [0, 1], scale: [1.05, 1], duration: 700, ease: "outQuart" },
      2850,
    )
    .add("[data-controls]", { opacity: [0, 1], y: [10, 0] }, 3350)
    .add("[data-cursor]", moveCursor(CURSOR_MARKS.playButton), 3400)
    .add("[data-ripple]", click, 3850)
    .add("[data-play]", { scale: [1, 1.25, 1], duration: 450, ease: "outBack" }, 3850)
    .add(playhead, { seconds: 95, duration: 1700, ease: "linear", onUpdate: renderPlayhead }, 3950)
    .add("[data-cursor]", { opacity: 0, duration: 400 }, 4300)
    // Sortie en fondu avant que la boucle ne reparte sur la recherche.
    .add("[data-scene-player]", { opacity: 0, duration: 450, ease: "inQuad" }, 5350);

  if (reduced) {
    tl.seek(FINAL_FRAME);
    playhead.seconds = 95;
    renderPlayhead();
    return { revert: () => tl.revert() };
  }

  // Travelling lent sur l'image, independant de la boucle principale.
  loops.push(
    animate("[data-film]", {
      scale: [1, 1.08],
      duration: 24000,
      ease: "inOutSine",
      loop: true,
      alternate: true,
    }),
  );

  return {
    revert: () => {
      loops.forEach((l) => l.revert());
      tl.revert();
    },
  };
}
