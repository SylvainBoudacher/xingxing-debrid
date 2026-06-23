import { useEffect, useLayoutEffect, useRef } from "react";
import { motion, useAnimate } from "motion/react";
import logo from "@/assets/logo.png";

/**
 * SplashTransition — overlay joué une unique fois entre le splash et la MainPage.
 *
 * Séquence (≈0.85 s) :
 *  0.00 s – Le voile remonte (rideau), révèle la piscine
 *  0.30 s – Le logo plonge
 *  0.50 s – Ripple canvas
 *  0.85 s – Fade out → onComplete()
 */

interface Props {
  onComplete: () => void;
  dark: boolean;
}

export function SplashTransition({ onComplete, dark }: Props) {
  const [scope, animate] = useAnimate();
  const rippleCanvasRef = useRef<HTMLCanvasElement>(null);
  const rippleRaf = useRef(0);
  // Store onComplete in a ref so the effect doesn't need it as a dependency
  // (the animation runs once on mount; re-running on callback identity change would be wrong).
  const onCompleteRef = useRef(onComplete);
  useLayoutEffect(() => {
    onCompleteRef.current = onComplete;
  });

  useEffect(() => {
    const rippleCanvasEl = rippleCanvasRef.current;

    function playRipple(canvas: HTMLCanvasElement) {
      const ctx = canvas.getContext("2d")!;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      const cx = canvas.width / 2;
      const cy = canvas.height * 0.52;
      let t = 0;
      const color = dark ? "100,180,255" : "30,111,148";

      function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const rings = 4;
        for (let i = 0; i < rings; i++) {
          const delay = i * 6;
          const age = Math.max(0, t - delay);
          const maxR = 90 + i * 30;
          const r = (age / 30) * maxR;
          const alpha = Math.max(0, 0.6 - age / 30);
          if (r > 0) {
            ctx.strokeStyle = `rgba(${color},${alpha.toFixed(2)})`;
            ctx.lineWidth = 2.8 - i * 0.5;
            ctx.beginPath();
            ctx.ellipse(cx, cy, r, r * 0.38, 0, 0, Math.PI * 2);
            ctx.stroke();
          }
        }
        t++;
        if (t < 45) {
          rippleRaf.current = requestAnimationFrame(draw);
        } else {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
      }
      rippleRaf.current = requestAnimationFrame(draw);
    }

    async function run() {
      // 1. Le voile remonte comme un rideau
      await animate(
        "#veil",
        { clipPath: ["inset(0% 0% 0% 0%)", "inset(100% 0% 0% 0%)"] },
        { duration: 0.32, ease: [0.76, 0, 0.24, 1] },
      );

      // 2. Logo plonge
      await animate(
        "#splash-logo",
        {
          y: [0, -10, 100],
          scale: [1, 1.06, 0.3],
          opacity: [1, 1, 0],
          rotate: [0, -3, 6],
        },
        { duration: 0.28, ease: [0.55, 0, 1, 0.45] },
      );

      // 3. Ripple
      if (rippleCanvasEl) {
        playRipple(rippleCanvasEl);
      }

      await new Promise<void>((r) => setTimeout(r, 200));

      // 4. Fade out
      await animate(scope.current, { opacity: 0 }, { duration: 0.15, ease: "easeOut" });

      onCompleteRef.current();
    }

    run();
    return () => {
      cancelAnimationFrame(rippleRaf.current);
    };
  }, [animate, dark, scope]);

  const bgColor = dark ? "#04050c" : "#f4f6fc";

  return (
    <div ref={scope} className="fixed inset-0 z-50 pointer-events-none">
      {/* Voile couleur du splash — descend pour révéler la pool */}
      <motion.div
        id="veil"
        style={{
          backgroundColor: bgColor,
          clipPath: "inset(0% 0% 0% 0%)",
        }}
        className="absolute inset-0"
      />

      {/* Logo centré, par-dessus le voile */}
      <motion.img
        id="splash-logo"
        src={logo}
        alt=""
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-20 w-20 rounded-2xl shadow-xl shadow-indigo-500/20"
        style={{ zIndex: 2 }}
      />

      {/* Canvas de ripple — s'affiche après le plongeon */}
      <canvas
        ref={rippleCanvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ zIndex: 1 }}
      />
    </div>
  );
}
