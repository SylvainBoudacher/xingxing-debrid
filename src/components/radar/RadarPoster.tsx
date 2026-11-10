import { posterUrl } from "@/lib/posterPreload";
import { Film } from "lucide-react";

export function RadarPoster({ path }: { path: string | null }) {
  if (!path) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-zinc-200 dark:bg-zinc-800">
        <Film className="h-10 w-10 text-zinc-400 dark:text-zinc-600" />
      </div>
    );
  }
  return (
    <img
      src={posterUrl(path, "w500")}
      alt=""
      className="absolute inset-0 h-full w-full object-cover"
    />
  );
}
