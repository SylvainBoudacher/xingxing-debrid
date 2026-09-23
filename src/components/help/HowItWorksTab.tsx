import { Lightbulb } from "lucide-react";
import { SettingsPanel } from "@/components/settings/SettingsPanel";
import { ServicesFlow } from "@/components/setup/ServicesFlow";
import { ServiceCard } from "@/components/setup/ServiceCard";
import { SERVICE_CARDS } from "@/components/setup/serviceCards";

export function HowItWorksTab() {
  return (
    <SettingsPanel
      icon={Lightbulb}
      title="Comment ça marche"
      subtitle="Trois services, une seule application."
    >
      <div className="space-y-4">
        <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
          XingXing n'héberge rien lui-même. Il dialogue en permanence avec trois services : il leur
          envoie vos demandes et affiche ce qu'ils renvoient, de la recherche jusqu'à la lecture.
        </p>
        <ServicesFlow />
        <div className="flex flex-col gap-3">
          {SERVICE_CARDS.map((card) => (
            <ServiceCard key={card.title} {...card} />
          ))}
        </div>
      </div>
    </SettingsPanel>
  );
}
