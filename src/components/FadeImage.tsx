import { useState, type ImgHTMLAttributes } from "react";

// Déjà décodée (préchargement, jaquette de la grille) : le navigateur la
// marque complète dès l'affectation du src, elle s'affiche sans fondu.
function isCached(src: string | undefined): boolean {
  if (!src) return false;
  const img = new Image();
  img.src = src;
  return img.complete && img.naturalWidth > 0;
}

// Image qui apparaît en fondu à son arrivée au lieu de surgir d'un coup.
export function FadeImage({
  className = "",
  onLoad,
  ...props
}: ImgHTMLAttributes<HTMLImageElement>) {
  const [loaded, setLoaded] = useState(() => isCached(props.src));
  return (
    <img
      {...props}
      onLoad={(e) => {
        setLoaded(true);
        onLoad?.(e);
      }}
      className={`${className} transition-opacity duration-500 ${loaded ? "opacity-100" : "opacity-0"}`}
    />
  );
}
