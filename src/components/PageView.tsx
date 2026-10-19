import type { ReactNode } from "react";
import { AnimateView, type AnimateViewProps } from "motion/react-animate-view";

// Les valeurs animent les captures de la View Transition (pseudo-éléments) :
// pas de raccourcis motion comme `y`, uniquement des propriétés CSS.
const SLIDE_DURATION = 0.22;
const FADE_DURATION = 0.35;

const SLIDE: AnimateViewProps = {
  enter: { opacity: [0, 1], transform: ["translateY(12px)", "none"] },
  exit: { opacity: [1, 0], transform: ["none", "translateY(-12px)"] },
  transition: { duration: SLIDE_DURATION, ease: "easeInOut" },
};

const FADE: AnimateViewProps = {
  enter: { opacity: [0, 1] },
  exit: { opacity: [1, 0] },
  transition: { duration: FADE_DURATION, ease: "easeOut" },
};

interface PageViewProps {
  fade?: boolean;
  children: ReactNode;
}

// Pendant une transition, les captures ne rendent pas les backdrop-filter :
// le flou de la barre est coupé puis réintroduit en fondu à la fin (index.css).
// Minuterie plutôt que onAnimationComplete : une navigation interrompue annule
// l'animation sans rappel, et le flou resterait coupé.
let blurTimer: ReturnType<typeof setTimeout> | undefined;

function suspendHeaderBlur(seconds: number) {
  document.documentElement.dataset.pageTransition = "";
  clearTimeout(blurTimer);
  blurTimer = setTimeout(() => {
    delete document.documentElement.dataset.pageTransition;
  }, seconds * 1000);
}

// Ne s'anime que si le changement de page passe par startTransition.
export function PageView({ fade = false, children }: PageViewProps) {
  const variant = fade ? FADE : SLIDE;
  const duration = fade ? FADE_DURATION : SLIDE_DURATION;
  return (
    <AnimateView {...variant} onAnimationStart={() => suspendHeaderBlur(duration)}>
      <div>{children}</div>
    </AnimateView>
  );
}
