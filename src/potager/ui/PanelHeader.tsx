// Titre d'un panneau et bouton de fermeture.
export function PanelHeader({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div className="mb-4 flex items-baseline justify-between">
      <h2 className="text-3xl font-bold italic">{title}</h2>
      <button
        type="button"
        onClick={onClose}
        className="cursor-pointer text-sm text-[#c8b890] hover:text-white"
      >
        Fermer (Échap)
      </button>
    </div>
  );
}
