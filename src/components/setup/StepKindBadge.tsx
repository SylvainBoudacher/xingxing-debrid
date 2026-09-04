import { STEP_KINDS, type StepKind } from "./steps";

export function StepKindBadge({ kind }: { kind: StepKind }) {
  const { label, className } = STEP_KINDS[kind];
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ${className}`}
    >
      {label}
    </span>
  );
}
