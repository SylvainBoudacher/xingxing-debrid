import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Bloc d'erreur réseau inline (recherche, liste, releases) : message spécifique
// + bouton Réessayer. Pour les actions ponctuelles, utiliser toastNetworkError.
export function NetworkErrorState({
  message,
  onRetry,
  className,
}: {
  message: string;
  onRetry: () => void;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center gap-3 px-6 text-center", className)}>
      <p className="text-sm text-red-600 dark:text-red-400">{message}</p>
      <Button variant="outline" size="sm" onClick={onRetry}>
        <RefreshCw />
        Réessayer
      </Button>
    </div>
  );
}
