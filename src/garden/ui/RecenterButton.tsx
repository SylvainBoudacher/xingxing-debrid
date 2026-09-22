export function RecenterButton({
  onClick,
  label = "Recentrer la caméra",
  className = "bottom-5 left-3",
}: {
  onClick: () => void;
  label?: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={`${label} (R)`}
      className={`absolute rounded-xl border border-amber-300/25 bg-[#1a1216]/85 px-3 py-2 text-xs text-[#e8d9bd] backdrop-blur hover:bg-[#1a1216] ${className}`}
    >
      {label}
    </button>
  );
}
