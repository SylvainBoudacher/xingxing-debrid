export function RecenterButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title="Recentrer la caméra (R)"
      className="absolute bottom-5 left-3 rounded-xl border border-amber-300/25 bg-[#1a1216]/85 px-3 py-2 text-xs text-[#e8d9bd] backdrop-blur hover:bg-[#1a1216]"
    >
      Recentrer la caméra
    </button>
  );
}
