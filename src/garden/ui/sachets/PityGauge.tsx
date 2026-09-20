export function PityGauge({
  title,
  chance,
  rule,
}: {
  title: string;
  chance: number;
  rule: string;
}) {
  const percent = Math.round(chance * 100);
  return (
    <section className="rounded-xl border border-amber-300/30 bg-[#1a1216]/85 px-3 py-2.5">
      <h4 className="mb-2 font-serif text-[15px] text-[#f3dca0]">{title}</h4>
      <div className="h-3 overflow-hidden rounded-full bg-[#2c2027] ring-1 ring-inset ring-amber-300/25">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#8a6a3a] to-[#f3c34a] transition-[width] duration-700"
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="mt-1.5 text-[11px] leading-snug text-[#a99a8a]">
        <b className="text-[#f3dca0]">{percent} %</b> - {rule}
      </p>
    </section>
  );
}
