// Bandeau des PO, sous le bouton Herbier.
export function PoCounter({ po }: { po: number }) {
  return (
    <div
      className="pointer-events-none absolute top-[88px] right-6 border-r-2 border-[#b8975a] px-4 py-1.5 text-xl font-bold text-[#e8c060]"
      style={{
        fontFamily: '"Cormorant Garamond", Georgia, serif',
        textShadow: "0 2px 3px rgba(0,0,0,0.7)",
        background: "linear-gradient(270deg, rgba(20,14,10,0.8), rgba(20,14,10,0))",
      }}
    >
      {po} PO
    </div>
  );
}
