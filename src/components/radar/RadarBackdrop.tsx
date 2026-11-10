const RING_STEP = 70;
const RING_COUNT = 10;
const DOT_SPACING = 13;
const FADE_RADIUS = 760;

const RINGS = Array.from({ length: RING_COUNT }, (_, i) => {
  const radius = RING_STEP * (i + 1);
  return {
    radius,
    dots: Math.round((2 * Math.PI * radius) / DOT_SPACING),
    opacity: 0.15 * (1 - radius / FADE_RADIUS),
  };
});

export function RadarBackdrop() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 overflow-hidden text-emerald-900 dark:text-emerald-200"
    >
      <svg
        viewBox="-720 -720 1440 1440"
        className="absolute top-[-15%] left-1/2 h-[140vmax] w-[140vmax] -translate-x-1/2 -translate-y-1/2 blur-[1px]"
      >
        <g fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
          {RINGS.map(({ radius, dots, opacity }) => (
            <circle
              key={radius}
              r={radius}
              pathLength={dots}
              strokeDasharray="0.001 0.999"
              strokeOpacity={opacity}
            />
          ))}
        </g>
      </svg>
    </div>
  );
}
