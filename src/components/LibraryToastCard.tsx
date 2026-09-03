import { ArrowRight, Check, LoaderCircle } from "lucide-react";
import type { ReactNode } from "react";

interface LibraryToastCardProps {
  posterSrc: string | null;
  /** Icone affichee quand aucune jaquette n'est disponible. */
  fallbackIcon: ReactNode;
  /** Le debridage est encore en cours cote AllDebrid. */
  pending?: boolean;
  statusLabel: string;
  title: string;
  year?: string;
  badges: string[];
  /** Bouton "Voir" : absent quand aucune navigation n'est possible. */
  onOpen?: () => void;
}

export function LibraryToastCard({
  posterSrc,
  fallbackIcon,
  pending,
  statusLabel,
  title,
  year,
  badges,
  onOpen,
}: LibraryToastCardProps) {
  return (
    <div className="bg-background border-border flex w-[380px] items-center gap-3 rounded-2xl border p-3 shadow-lg">
      <div className="bg-muted h-[84px] w-14 shrink-0 overflow-hidden rounded-lg">
        {posterSrc ? (
          <img src={posterSrc} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="text-muted-foreground flex h-full w-full items-center justify-center">
            {fallbackIcon}
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="text-muted-foreground flex items-center gap-1.5 text-[11px] font-medium">
          {pending ? (
            <LoaderCircle className="h-3 w-3 animate-spin" />
          ) : (
            <Check className="h-3 w-3 text-emerald-500" />
          )}
          {statusLabel}
        </div>
        <div className="text-foreground truncate text-sm font-semibold">
          {title}
          {year ? <span className="text-muted-foreground font-normal"> ({year})</span> : null}
        </div>
        {badges.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {badges.map((b) => (
              <span
                key={b}
                className="bg-muted text-muted-foreground rounded-md px-1.5 py-0.5 text-[10px] font-medium"
              >
                {b}
              </span>
            ))}
          </div>
        )}
      </div>

      {onOpen && (
        <button
          type="button"
          onClick={onOpen}
          className="bg-primary text-primary-foreground hover:bg-primary/90 flex shrink-0 items-center gap-1 rounded-lg px-3 py-2 text-xs font-semibold transition-colors"
        >
          Voir
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
