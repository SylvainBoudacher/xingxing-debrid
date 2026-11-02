// Titre d'un panneau et bouton de fermeture.
export function PanelHeader({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div className="mb-4 flex items-baseline justify-between gap-4">
      <h2 className="text-4xl leading-none text-[#ffe39a]">{title}</h2>
      <PanelClose onClose={onClose} />
    </div>
  );
}

export function PanelClose({ onClose }: { onClose: () => void }) {
  return (
    <button
      type="button"
      onClick={onClose}
      className="shrink-0 cursor-pointer bg-[#4a2a14] px-2 py-0.5 text-lg text-[#f2d9a6] [text-shadow:none] hover:bg-[#2b170a] hover:text-white"
    >
      Échap
    </button>
  );
}
