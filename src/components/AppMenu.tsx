import { motion } from "motion/react";
import {
  Bell,
  Compass,
  FlaskConical,
  Home,
  Magnet,
  Menu,
  TestTube,
  RefreshCw,
  RotateCcw,
  ScrollText,
  SlidersHorizontal,
  Sparkles,
  Trash2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeMenuItem } from "@/components/ThemeMenuItem";
import { toast } from "sonner";
import { LazyStore } from "@tauri-apps/plugin-store";

export type Page =
  | "main"
  | "magnets"
  | "preferences"
  | "patchnotes"
  | "discover"
  | "setup"
  | "nyaa";

interface AppMenuProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  onBack?: () => void;
  hasPendingUpdate: boolean;
  onShowPendingUpdate: () => void;
  // Dev-only props (MainPage)
  devMode?: boolean;
  onToggleDevMode?: () => void;
  onShowUpdatePreview?: () => void;
}

const store = new LazyStore("settings.json", { defaults: {}, autoSave: false });

export function AppMenu({
  currentPage,
  onNavigate,
  onBack,
  hasPendingUpdate,
  onShowPendingUpdate,
  devMode,
  onToggleDevMode,
  onShowUpdatePreview,
}: AppMenuProps) {
  const isMain = currentPage === "main";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.93 }}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 dark:bg-zinc-800/80 ring-1 ring-black/10 dark:ring-white/10 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-700/80 transition-colors"
        >
          <Menu className="h-4 w-4" />
        </motion.button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className={import.meta.env.DEV && isMain ? "w-56" : "w-44"}>
        {!isMain && onBack && (
          <DropdownMenuItem onClick={onBack}>
            <Home className="mr-2 h-4 w-4" />
            Accueil
          </DropdownMenuItem>
        )}
        {currentPage !== "discover" && (
          <DropdownMenuItem onClick={() => onNavigate("discover")}>
            <Compass className="mr-2 h-4 w-4" />
            Découverte
          </DropdownMenuItem>
        )}
        {currentPage !== "magnets" && (
          <DropdownMenuItem onClick={() => onNavigate("magnets")}>
            <Magnet className="mr-2 h-4 w-4" />
            Magnets
          </DropdownMenuItem>
        )}
        {currentPage !== "preferences" && (
          <DropdownMenuItem onClick={() => onNavigate("preferences")}>
            <SlidersHorizontal className="mr-2 h-4 w-4" />
            Paramètres
          </DropdownMenuItem>
        )}
        {import.meta.env.DEV && currentPage !== "nyaa" && (
          <DropdownMenuItem onClick={() => onNavigate("nyaa")}>
            <TestTube className="mr-2 h-4 w-4" />
            Test nyaa.si
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <ThemeMenuItem />
        {currentPage !== "patchnotes" && (
          <DropdownMenuItem onClick={() => onNavigate("patchnotes")}>
            <ScrollText className="mr-2 h-4 w-4" />
            Patch notes
          </DropdownMenuItem>
        )}
        {hasPendingUpdate && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onShowPendingUpdate}>
              <RefreshCw className="mr-2 h-4 w-4 text-green-500" />
              <span className="text-green-600 dark:text-green-400 font-medium">
                Mise a jour disponible
              </span>
            </DropdownMenuItem>
          </>
        )}
        {import.meta.env.DEV && isMain && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Développeur
            </DropdownMenuLabel>
            <DropdownMenuCheckboxItem checked={devMode} onCheckedChange={onToggleDevMode}>
              <FlaskConical className="mr-2 h-4 w-4" />
              Mode développeur
            </DropdownMenuCheckboxItem>
            {devMode && (
              <>
                <DropdownMenuItem onClick={() => onNavigate("setup")}>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Voir la welcome page
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={async () => {
                    await store.set("setup_complete", false);
                    await store.save();
                    toast.success("Premier lancement réinitialisé");
                  }}
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Réinitialiser 1er lancement
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onShowUpdatePreview}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Apercu mise a jour
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    toast.success("Toast de succès");
                    toast.error("Toast d'erreur");
                  }}
                >
                  <Bell className="mr-2 h-4 w-4" />
                  Tester les toasts
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={async () => {
                    await store.clear();
                    await store.save();
                    location.reload();
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Vider le store
                </DropdownMenuItem>
              </>
            )}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
