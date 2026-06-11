import { useState } from "react";
import { Moon, Sun } from "lucide-react";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { setTheme as persistTheme, type Theme } from "@/lib/theme";

export function ThemeMenuItem() {
  const [theme, setTheme] = useState<Theme>(() =>
    document.documentElement.classList.contains("dark") ? "dark" : "light",
  );

  async function toggleTheme() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    await persistTheme(next);
  }

  return (
    <DropdownMenuItem onClick={toggleTheme}>
      {theme === "dark" ? (
        <Sun className="mr-2 h-4 w-4" />
      ) : (
        <Moon className="mr-2 h-4 w-4" />
      )}
      {theme === "dark" ? "Mode clair" : "Mode sombre"}
    </DropdownMenuItem>
  );
}
