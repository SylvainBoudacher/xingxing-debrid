import { Play } from "lucide-react";
import film from "@/assets/xingxingImg.png";
import vlcLogo from "@/assets/vlc.png";
import { NODE, NODES } from "./journeyStage";

/** Sortie streaming du schema : un mini lecteur qui demarre quand le fichier arrive. */
export function VlcPlayerNode() {
  const { left, top } = NODES.vlc;
  return (
    <div
      className="absolute z-10 flex flex-col gap-1 rounded-xl bg-white p-1.5 ring-1 ring-black/8 dark:bg-zinc-900 dark:ring-white/10"
      style={{ left, top, width: NODE.width, height: NODE.height }}
    >
      <div className="relative flex-1 overflow-hidden rounded-md bg-zinc-950">
        <img
          data-vlc-film
          src={film}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-0"
        />
        <div
          data-vlc-play
          className="absolute left-1/2 top-1/2 -ml-2 -mt-2.5 flex h-4 w-4 items-center justify-center rounded-full bg-white/90"
        >
          <Play className="ml-px h-2 w-2 fill-zinc-900 text-zinc-900" />
        </div>
        <div className="absolute inset-x-1 bottom-1 h-0.5 overflow-hidden rounded-full bg-white/25">
          <div
            data-vlc-bar
            className="h-full origin-left rounded-full bg-[#ff8800]"
            style={{ transform: "scaleX(0)" }}
          />
        </div>
      </div>

      <div className="flex items-center justify-center gap-1">
        <img src={vlcLogo} alt="" className="h-2.5 w-2.5 object-contain" />
        <p className="text-[10px] font-semibold leading-none text-zinc-900 dark:text-white">
          Streaming
        </p>
      </div>

      <div
        data-highlight="vlc"
        className="pointer-events-none absolute inset-0 rounded-xl opacity-0 ring-2 ring-indigo-500/70 shadow-[0_0_24px_rgba(99,102,241,0.35)]"
      />
    </div>
  );
}
