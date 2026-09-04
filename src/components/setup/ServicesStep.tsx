import { motion } from "motion/react";
import { ArrowRight, Hand } from "lucide-react";
import { ServicesFlow } from "./ServicesFlow";
import { ServiceCard } from "./ServiceCard";
import { SERVICE_CARDS } from "./serviceCards";
import { StepKindBadge } from "./StepKindBadge";
import { item, stagger } from "./motionVariants";

export function ServicesStep({ onNext }: { onNext: () => void }) {
  return (
    <motion.div
      key="services"
      initial="hidden"
      animate="visible"
      exit={{ opacity: 0, x: -24, transition: { duration: 0.2 } }}
      variants={stagger}
      className="relative mx-auto w-full max-w-3xl px-6 pt-10 pb-12 sm:px-8 space-y-4"
    >
      <motion.div variants={item}>
        <div className="text-center mb-4">
          <div className="mb-2 flex justify-center">
            <StepKindBadge kind="read" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white mb-2">
            Trois services, une seule application
          </h1>
          <p className="mx-auto max-w-xl text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
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

      <div className="grid gap-4 sm:grid-cols-2">
        {SERVICE_CARDS.map((card) => (
          <ServiceCard key={card.title} {...card} />
        ))}
      </div>

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
