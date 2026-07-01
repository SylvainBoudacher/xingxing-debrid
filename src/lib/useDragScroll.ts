import { useRef } from "react";

// Enables click-and-drag horizontal scrolling on an overflow-x container.
// Useful on Windows where the mouse wheel does not scroll horizontally.
export function useDragScroll<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const state = useRef({ down: false, startX: 0, startLeft: 0, moved: false });

  const onPointerDown = (e: React.PointerEvent<T>) => {
    const el = ref.current;
    if (!el) return;
    state.current = {
      down: true,
      startX: e.clientX,
      startLeft: el.scrollLeft,
      moved: false,
    };
  };

  const onPointerMove = (e: React.PointerEvent<T>) => {
    const el = ref.current;
    if (!el || !state.current.down) return;
    const dx = e.clientX - state.current.startX;
    if (Math.abs(dx) > 3) {
      state.current.moved = true;
      el.setPointerCapture(e.pointerId);
    }
    el.scrollLeft = state.current.startLeft - dx;
  };

  const endDrag = (e: React.PointerEvent<T>) => {
    const el = ref.current;
    if (el?.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
    state.current.down = false;
  };

  // Swallow the click that follows a drag so buttons don't fire on release.
  const onClickCapture = (e: React.MouseEvent<T>) => {
    if (state.current.moved) {
      e.stopPropagation();
      e.preventDefault();
      state.current.moved = false;
    }
  };

  return {
    ref,
    dragProps: {
      onPointerDown,
      onPointerMove,
      onPointerUp: endDrag,
      onPointerLeave: endDrag,
      onClickCapture,
    },
  };
}
