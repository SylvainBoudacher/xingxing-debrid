import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent,
  type PointerEvent,
  type RefObject,
} from "react";
import { clampView, fitSize, HOME, isHome, zoomAt, type Size, type View } from "./panZoom";

const MARGIN = 0.9;
// en deçà, le geste reste un clic sur un palier
const DRAG_THRESHOLD = 4;
// le pinch du trackpad arrive en molette + ctrl, avec des deltas bien plus petits
const WHEEL_STEP = 0.0015;
const PINCH_STEP = 0.01;
const RECENTER_KEY = "r";

interface Drag {
  id: number;
  x: number;
  y: number;
  from: View;
  moved: boolean;
}

export function usePanZoom(ref: RefObject<HTMLDivElement | null>) {
  const [viewport, setViewport] = useState<Size>({ w: 0, h: 0 });
  const [view, setView] = useState<View>(HOME);
  const [dragging, setDragging] = useState(false);
  const drag = useRef<Drag | null>(null);
  const swallowClick = useRef(false);
  const tree = fitSize(viewport, MARGIN);

  const recenter = useCallback(() => setView(HOME), []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) =>
      setViewport({ w: entry.contentRect.width, h: entry.contentRect.height }),
    );
    observer.observe(el);
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const factor = Math.exp(-e.deltaY * (e.ctrlKey ? PINCH_STEP : WHEEL_STEP));
      const p = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      const viewport = { w: el.clientWidth, h: el.clientHeight };
      const tree = fitSize(viewport, MARGIN);
      setView((v) => clampView(zoomAt(v, p, factor, viewport), viewport, tree));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      observer.disconnect();
      el.removeEventListener("wheel", onWheel);
    };
  }, [ref]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || e.target instanceof HTMLInputElement) return;
      if (e.key.toLowerCase() === RECENTER_KEY) recenter();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [recenter]);

  const endDrag = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    if (d.moved) {
      swallowClick.current = true;
      e.currentTarget.releasePointerCapture(e.pointerId);
      setDragging(false);
    }
    drag.current = null;
  };

  const handlers = {
    onPointerDown: (e: PointerEvent<HTMLDivElement>) => {
      if (e.button !== 0) return;
      drag.current = { id: e.pointerId, x: e.clientX, y: e.clientY, from: view, moved: false };
    },
    onPointerMove: (e: PointerEvent<HTMLDivElement>) => {
      const d = drag.current;
      if (!d || d.id !== e.pointerId) return;
      const dx = e.clientX - d.x;
      const dy = e.clientY - d.y;
      if (!d.moved) {
        if (Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
        d.moved = true;
        e.currentTarget.setPointerCapture(e.pointerId);
        setDragging(true);
      }
      setView(clampView({ dx: d.from.dx + dx, dy: d.from.dy + dy, k: d.from.k }, viewport, tree));
    },
    onPointerUp: endDrag,
    onPointerCancel: endDrag,
    // un glisser relâché sur un palier ne doit pas le sélectionner
    onClickCapture: (e: MouseEvent) => {
      if (!swallowClick.current) return;
      swallowClick.current = false;
      e.stopPropagation();
    },
  };

  return { view, tree, dragging, moved: !isHome(view), recenter, handlers };
}
