import { motion } from "motion/react";
import {
  ArrowRight,
  Clapperboard,
  CreditCard,
  Hand,
  MonitorPlay,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { ServicesFlow } from "./ServicesFlow";
import { StepKindBadge } from "./StepKindBadge";
import { item, stagger } from "./motionVariants";

type Badge = { label: string; tone: "free" | "paid" };

const TONES = {
  free: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-400",
  paid: "bg-amber-500/12 text-amber-700 dark:text-amber-400",
};

function ServiceCard({
  icon: Icon,
  accent,
  title,
  badges,
  description,
}: {
  icon: LucideIcon;
  accent: string;
  title: string;
  badges: Badge[];
  description: string;
}) {
  return (
    <motion.div
      variants={item}
      className="flex items-start gap-4 rounded-2xl bg-white/80 dark:bg-zinc-900/70 ring-1 ring-black/6 dark:ring-white/6 px-5 py-4"
    >
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1 ${accent}`}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-0.5">
          <p className="text-sm font-semibold text-zinc-900 dark:text-white">{title}</p>
          {badges.map((b) => (
            <span
              key={b.label}
              className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${TONES[b.tone]}`}
            >
              {b.label}
            </span>
          ))}
        </div>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">{description}</p>
      </div>
    </motion.div>
  );
}

export function ServicesStep({ onNext }: { onNext: () => void }) {
  return (
    <motion.div
      key="services"
      initial="hidden"
      animate="visible"
      exit={{ opacity: 0, x: -24, transition: { duration: 0.2 } }}
      variants={stagger}
      className="relative mx-auto w-full max-w-xl px-6 pt-10 pb-12 sm:px-8 space-y-4"
    >
      <motion.div variants={item}>
        <div className="text-center mb-4">
          <div className="mb-2 flex justify-center">
            <StepKindBadge kind="read" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white mb-2">
            Trois services, une seule application
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
            XingXing n'heberge rien lui-meme. Il dialogue en permanence avec trois services : il
            leur envoie vos demandes et affiche ce qu'ils renvoient, de la recherche jusqu'a la
            lecture.
          </p>
        </div>
      </motion.div>

      <motion.div variants={item}>
        <ServicesFlow />
      </motion.div>

      <motion.div
        variants={item}
        className="flex items-start gap-3 rounded-2xl bg-indigo-500/8 ring-1 ring-indigo-500/20 px-5 py-4"
      >
        <Hand className="h-4 w-4 shrink-0 mt-0.5 text-indigo-600 dark:text-indigo-400" />
        <div>
          <p className="text-sm font-semibold text-indigo-700 dark:text-indigo-300 mb-0.5">
            Rien a creer pour l'instant
          </p>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Cette page sert juste a comprendre a quoi servent ces services. La creation des comptes
            et la recuperation des cles se font plus loin, etape par etape. Lisez d'abord, vous
            aurez les liens au bon moment.
          </p>
        </div>
      </motion.div>

      <ServiceCard
        icon={UserRound}
        accent="bg-indigo-500/12 ring-indigo-500/20 text-indigo-600 dark:text-indigo-400"
        title="C411"
        badges={[{ label: "Gratuit", tone: "free" }]}
        description="Le moteur de recherche. Il indexe films, series et musiques et indique ou les recuperer. L'inscription gratuite suffit."
      />

      <ServiceCard
        icon={CreditCard}
        accent="bg-amber-500/12 ring-amber-500/20 text-amber-600 dark:text-amber-400"
        title="AllDebrid"
        badges={[{ label: "Payant", tone: "paid" }]}
        description="Le debrideur. Il transforme le resultat trouve sur C411 en telechargement direct a haute vitesse, lisible immediatement. Un abonnement est requis."
      />

      <ServiceCard
        icon={Clapperboard}
        accent="bg-emerald-500/12 ring-emerald-500/20 text-emerald-600 dark:text-emerald-400"
        title="TMDB"
        badges={[{ label: "Gratuit", tone: "free" }]}
        description="La base de donnees de films et series. Elle alimente la page Decouverte et affiche jaquettes, resumes et notes dans votre bibliotheque. Sa cle est gratuite et requise, comme les deux autres."
      />

      <motion.div
        variants={item}
        className="flex items-start gap-4 rounded-2xl bg-white/60 dark:bg-zinc-900/40 border border-dashed border-black/15 dark:border-white/15 px-5 py-4"
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-500/12 ring-1 ring-orange-500/20">
          <MonitorPlay className="h-4 w-4 text-orange-600 dark:text-orange-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="text-sm font-semibold text-zinc-900 dark:text-white">
              Et un lecteur : VLC
            </p>
            <span
              className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${TONES.free}`}
            >
              Gratuit
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
            Ce n'est pas un compte, juste un logiciel a installer sur votre machine. XingXing s'en
            sert pour lancer la lecture sans attendre la fin du telechargement.
          </p>
        </div>
      </motion.div>

      <motion.div variants={item} className="pt-2">
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={onNext}
          className="flex w-full items-center justify-center gap-2 h-11 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-sm font-semibold text-white transition-colors"
        >
          Continuer
          <ArrowRight className="h-4 w-4" />
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
