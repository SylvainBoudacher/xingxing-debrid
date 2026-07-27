import japonImg from "@/assets/patchnote/v1.6.0/japon.webp";
import xingxingImg from "@/assets/patchnote/v1.6.0/xingxing-manga.webp";

export function MangaWelcomeHero() {
  return (
    <div className="relative h-72 overflow-hidden rounded-xl ring-1 ring-black/10 dark:ring-white/10">
      {/* Leger flou + scale : detache XingXing du fond et masque les bords du flou. */}
      <img
        src={japonImg}
        alt=""
        aria-hidden
        className="absolute inset-0 h-full w-full scale-110 object-cover object-[center_45%] blur-[3px]"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-black/10" />
      <img
        src={xingxingImg}
        alt="XingXing"
        className="absolute bottom-0 left-1/2 h-[88%] w-auto -translate-x-1/2 drop-shadow-[0_10px_20px_rgba(0,0,0,0.45)]"
      />
    </div>
  );
}
