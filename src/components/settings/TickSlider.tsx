const THUMB_PX = 16;

// Position du centre du curseur pour une fraction donnée : le curseur natif
// reste à l'intérieur de la piste, donc décalé d'un demi-curseur aux extrémités.
const thumbCenter = (fraction: number) =>
  `calc(${THUMB_PX / 2}px + (100% - ${THUMB_PX}px) * ${fraction})`;

/** Réglette à crans : un point par cran, un gros point (avec libellé) tous les `majorEvery` crans. */
export function TickSlider({
  min,
  max,
  step,
  majorEvery,
  value,
  disabled,
  ariaLabel,
  formatLabel,
  onChange,
  onCommit,
}: {
  min: number;
  max: number;
  step: number;
  majorEvery: number;
  value: number;
  disabled?: boolean;
  ariaLabel: string;
  formatLabel: (v: number) => string;
  onChange: (v: number) => void;
  onCommit: () => void;
}) {
  const count = Math.round((max - min) / step);
  const current = Math.round((value - min) / step);
  const ticks = Array.from({ length: count + 1 }, (_, i) => i);

  return (
    <div className="flex-1">
      <div className="relative h-5">
        {/* La ligne va du centre du premier cran au centre du dernier. */}
        <div
          className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-black/10 dark:bg-white/15"
          style={{ left: THUMB_PX / 2, right: THUMB_PX / 2 }}
        />
        <div
          className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-indigo-500"
          style={{ left: THUMB_PX / 2, width: `calc((100% - ${THUMB_PX}px) * ${current / count})` }}
        />

        {ticks.map((i) => {
          const major = i % majorEvery === 0;
          return (
            <span
              key={i}
              className={`absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full ${
                major ? "h-2.5 w-2.5" : "h-1.5 w-1.5"
              } ${i <= current ? "bg-indigo-500" : "bg-zinc-300 dark:bg-zinc-600"}`}
              style={{ left: thumbCenter(i / count) }}
            />
          );
        })}

        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(Number(e.target.value))}
          onPointerUp={onCommit}
          onKeyUp={onCommit}
          onBlur={onCommit}
          aria-label={ariaLabel}
          className="absolute inset-0 h-5 w-full cursor-pointer appearance-none bg-transparent outline-none disabled:cursor-not-allowed [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-indigo-500 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow focus-visible:[&::-webkit-slider-thumb]:ring-4 focus-visible:[&::-webkit-slider-thumb]:ring-indigo-500/40"
        />
      </div>

      <div className="relative mt-1 h-3">
        {ticks
          .filter((i) => i % majorEvery === 0)
          .map((i) => (
            <span
              key={i}
              className={`absolute -translate-x-1/2 whitespace-nowrap text-[10px] tabular-nums ${
                i === current
                  ? "font-semibold text-indigo-600 dark:text-indigo-400"
                  : "text-zinc-400"
              }`}
              style={{ left: thumbCenter(i / count) }}
            >
              {formatLabel(min + i * step)}
            </span>
          ))}
      </div>
    </div>
  );
}
