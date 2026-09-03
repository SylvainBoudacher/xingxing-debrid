import { createTimeline, stagger, type Timeline } from "animejs";
import { CURSOR_MARKS, FILM_SECONDS, formatTime } from "./stage";

export interface IntroSequence {
  revert: () => void;
}

const CURSOR_TRAVEL = 720;
const LOOP_DELAY = 500;
/** Fin de la scene jouee, avant le fondu de sortie : l'image a figer en reduced-motion. */
const FINAL_FRAME = 13800;
/** Cadrage serre avant lecture, qui s'ouvre au clic sur play. */
const FILM_START_SCALE = 1.12;
const FILM_VEIL_OPACITY = 0.45;

/**
 * Quatre temps joues par un curseur : on cherche, on ajoute a la bibliotheque,
 * on lance la lecture depuis la bibliotheque, on regarde. Puis la boucle repart.
 */
export function playIntroSequence(root: HTMLElement, reduced: boolean): IntroSequence {
  const captions = Array.from(root.querySelectorAll<HTMLElement>("[data-caption]"));
  const tiles = Array.from(root.querySelectorAll<HTMLElement>("[data-tile]"));
  const rows = Array.from(root.querySelectorAll<HTMLElement>("[data-row]"));
  const timeEl = root.querySelector<HTMLElement>("[data-time]");
  const progressEl = root.querySelector<HTMLElement>("[data-progress]");
  const playhead = { seconds: 0 };

  const renderPlayhead = () => {
    if (timeEl) timeEl.textContent = formatTime(playhead.seconds);
    if (progressEl) {
      progressEl.style.transform = `scaleX(${playhead.seconds / FILM_SECONDS})`;
    }
  };

  const moveCursor = (mark: { x: number; y: number }, duration = CURSOR_TRAVEL) => ({
    x: mark.x,
    y: mark.y,
    duration,
    ease: "inOutQuad",
  });

  const click = { scale: [1, 1.9], opacity: [0.9, 0], duration: 650, ease: "outQuad" };

  // anime ne restaure que les proprietes qu'on lui a confiees : a chaque tour de
  // boucle il faut remettre nous-memes la scene dans son etat de depart.
  const HIDDEN_AT_START = [
    "[data-scene-library]",
    "[data-scene-player]",
    "[data-searchbar]",
    "[data-row]",
    "[data-caret]",
    "[data-added]",
    "[data-add-check]",
    "[data-tile]",
    "[data-tile-overlay]",
    "[data-stream-pill]",
    "[data-download-pill]",
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
    const addedTile = root.querySelector<HTMLElement>("[data-added-tile]");
    if (addedTile) addedTile.style.transform = "scale(1)";
    // Le film attend sur un cadrage serre et assombri, comme un lecteur en pause.
    const filmEl = root.querySelector<HTMLElement>("[data-film]");
    if (filmEl) filmEl.style.transform = `scale(${FILM_START_SCALE})`;
    const veil = root.querySelector<HTMLElement>("[data-film-veil]");
    if (veil) veil.style.opacity = String(FILM_VEIL_OPACITY);
    const query = root.querySelector<HTMLElement>("[data-query]");
    if (query) query.style.clipPath = "inset(0 100% 0 0)";
    playhead.seconds = 0;
    renderPlayhead();
  };

  const tl: Timeline = createTimeline({
    defaults: { duration: 700, ease: "outExpo" },
    autoplay: !reduced,
    loop: !reduced,
    loopDelay: LOOP_DELAY,
  });

  tl.call(resetScene, 0)

    // Temps 1 : cherchez
    .set("[data-cursor]", { x: CURSOR_MARKS.start.x, y: CURSOR_MARKS.start.y })
    .add("[data-cursor]", { opacity: [0, 1], duration: 450 }, 0)
    .add(captions[0], { opacity: [0, 1], y: [6, 0] }, 250)
    .add("[data-searchbar]", { opacity: [0, 1], y: [8, 0] }, 250)
    .add("[data-cursor]", moveCursor(CURSOR_MARKS.searchBar), 650)
    .add("[data-ripple]", click, 1450)
    .add("[data-caret]", { opacity: [0, 1], duration: 300 }, 1500)
    .add(
      "[data-query]",
      { clipPath: ["inset(0 100% 0 0)", "inset(0 0% 0 0)"], duration: 700, ease: "linear" },
      1600,
    )
    .add(rows, { opacity: [0, 1], y: [10, 0], duration: 700, delay: stagger(140) }, 2500)

    // Temps 2 : ajoutez
    .add(captions[0], { opacity: 0, duration: 400 }, 2950)
    .add(captions[1], { opacity: [0, 1], y: [6, 0] }, 3050)
    .add("[data-cursor]", moveCursor(CURSOR_MARKS.addButton), 3050)
    .add("[data-ripple]", click, 3850)
    .add("[data-add]", { scale: [1, 0.82, 1], duration: 620, ease: "outBack" }, 3850)
    .add("[data-add-plus]", { opacity: 0, scale: 0.6, duration: 380 }, 3950)
    .add("[data-add-check]", { opacity: [0, 1], scale: [0.6, 1], duration: 520 }, 4020)
    .add("[data-added]", { opacity: [0, 1], x: [-8, 0], duration: 620 }, 4100)

    // Temps 3 : lancez, depuis la bibliotheque
    .add(captions[1], { opacity: 0, duration: 400 }, 5000)
    .add(captions[2], { opacity: [0, 1], y: [6, 0] }, 5100)
    .add("[data-scene-search]", { opacity: 0, scale: 0.96, duration: 700 }, 5150)
    .add(
      "[data-scene-library]",
      { opacity: [0, 1], y: [14, 0], duration: 800, ease: "outQuart" },
      5150,
    )
    .add(tiles, { opacity: [0, 1], y: [12, 0], duration: 600, delay: stagger(110) }, 5500)
    .add("[data-cursor]", moveCursor(CURSOR_MARKS.libraryTile), 6300)
    .add("[data-added-tile]", { scale: [1, 1.04], duration: 500 }, 7000)
    .add("[data-tile-overlay]", { opacity: [0, 1], duration: 500 }, 7000)
    // Les deux options apparaissent ensemble : streaming (avec VLC) au-dessus,
    // telechargement en dessous, legerement decale pour bien montrer qu'il y a un choix.
    .add("[data-stream-pill]", { opacity: [0, 1], y: [-6, 0], duration: 500 }, 7150)
    .add("[data-download-pill]", { opacity: [0, 1], y: [-6, 0], duration: 500 }, 7230)
    // Le curseur descend specifiquement cliquer sur Streaming, pas sur la vignette.
    .add("[data-cursor]", moveCursor(CURSOR_MARKS.streamPill, 380), 7750)
    .add("[data-ripple]", click, 8150)
    .add("[data-stream-pill]", { scale: [1, 0.92, 1], duration: 550, ease: "outBack" }, 8150)

    // Temps 4 : regardez
    .add(captions[2], { opacity: 0, duration: 400 }, 8850)
    .add(captions[3], { opacity: [0, 1], y: [6, 0] }, 8950)
    .add("[data-scene-library]", { opacity: 0, scale: 0.96, duration: 700 }, 9000)
    // Revelation de la vignette en pause : image et voile montent ensemble, a la
    // meme vitesse (le voile est deja plein a 0.45 sur l'image, pas ajoute apres coup).
    .add("[data-scene-player]", { opacity: [0, 1], duration: 700, ease: "outQuart" }, 9050)
    // Bref reglage avant que les commandes n'apparaissent, une fois la vignette
    // entierement visible (sinon leur propre fondu se cumule avec celui du groupe
    // et elles semblent invisibles / cachees par le voile). Le curseur part en
    // meme temps qu'elles pour ne pas rallonger l'attente avant le lancement.
    .add("[data-controls]", { opacity: [0, 1], y: [10, 0], duration: 550 }, 9900)
    .add("[data-cursor]", moveCursor(CURSOR_MARKS.playButton), 9900)
    .add("[data-ripple]", click, 10750)
    .add("[data-play]", { scale: [1, 1.25, 1], duration: 650, ease: "outBack" }, 10750)
    .add("[data-film-veil]", { opacity: [FILM_VEIL_OPACITY, 0], duration: 800 }, 10750)
    .add("[data-film]", { scale: [FILM_START_SCALE, 1], duration: 2600, ease: "outQuart" }, 10750)
    .add(playhead, { seconds: 95, duration: 2700, ease: "linear", onUpdate: renderPlayhead }, 10850)
    .add("[data-cursor]", { opacity: 0, duration: 600 }, 11250)
    // Sortie en fondu, apres un temps de visionnage, avant que la boucle ne reparte.
    .add(captions[3], { opacity: 0, duration: 400 }, 13950)
    .add("[data-scene-player]", { opacity: 0, duration: 600, ease: "inQuad" }, 13950);

  if (reduced) {
    tl.seek(FINAL_FRAME);
    playhead.seconds = 95;
    renderPlayhead();
    return { revert: () => tl.revert() };
  }

  return { revert: () => tl.revert() };
}
