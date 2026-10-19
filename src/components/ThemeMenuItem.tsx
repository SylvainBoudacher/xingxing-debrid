import { Moon, Sun } from "lucide-react";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { setThemePref } from "@/lib/theme";
import { useAppTheme } from "@/lib/useAppTheme";

// Bascule rapide : fixe un thème explicite, même si le réglage suivait l'OS.
export function ThemeMenuItem() {
  const theme = useAppTheme();

  return (
    <DropdownMenuItem onClick={() => setThemePref(theme === "dark" ? "light" : "dark")}>
      {theme === "dark" ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
      {theme === "dark" ? "Mode clair" : "Mode sombre"}
    </DropdownMenuItem>
  );
}
