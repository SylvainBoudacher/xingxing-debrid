import { Laptop, Moon, Sun } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ThemePref } from "@/lib/theme";

export const THEME_CHOICES: {
  id: ThemePref;
  label: string;
  icon: LucideIcon;
  tile: string;
  iconColor: string;
}[] = [
  {
    id: "dark",
    label: "Sombre",
    icon: Moon,
    tile: "bg-zinc-800 ring-1 ring-white/10",
    iconColor: "text-indigo-400",
  },
  {
    id: "light",
    label: "Clair",
    icon: Sun,
    tile: "bg-zinc-100 ring-1 ring-black/10",
    iconColor: "text-amber-500",
  },
  {
    id: "system",
    label: "Système",
    icon: Laptop,
    tile: "bg-gradient-to-br from-zinc-100 from-50% to-zinc-800 to-50% ring-1 ring-black/10 dark:ring-white/10",
    iconColor: "text-indigo-500",
  },
];
