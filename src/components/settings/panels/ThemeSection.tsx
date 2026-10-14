import { Laptop, Moon, Sun } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { setThemePref, type ThemePref } from "@/lib/theme";
import { useThemePref } from "@/lib/useAppTheme";
import { FieldTitle, ViewOptionCard } from "../controls";

const OPTIONS: { id: ThemePref; label: string; hint: string; icon: LucideIcon }[] = [
  { id: "light", label: "Clair", hint: "Toujours clair", icon: Sun },
  { id: "dark", label: "Sombre", hint: "Toujours sombre", icon: Moon },
  { id: "system", label: "Système", hint: "Suit le jour/nuit de l'OS", icon: Laptop },
];

export function ThemeSection() {
  const pref = useThemePref();

  return (
    <>
      <FieldTitle
        title="Thème"
        hint="En mode Système, l'interface bascule automatiquement avec le réglage clair/sombre de l'ordinateur."
      />

      <div className="grid gap-3 sm:grid-cols-3">
        {OPTIONS.map(({ id, label, hint, icon: Icon }) => (
          <ViewOptionCard
            key={id}
            label={label}
            selected={pref === id}
            onClick={() => setThemePref(id)}
          >
            <div className="flex flex-col items-center text-center">
              <div className="flex items-end justify-center h-10">
                <Icon className="h-8 w-8 opacity-60" />
              </div>
              <p className="text-xs text-zinc-500 mt-2">{hint}</p>
            </div>
          </ViewOptionCard>
        ))}
      </div>
    </>
  );
}
