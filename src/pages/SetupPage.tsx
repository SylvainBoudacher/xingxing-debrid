import { motion } from "motion/react";
import { ApiKeysForm } from "@/components/ApiKeysForm";

interface SetupPageProps {
  onComplete: () => void;
}

export function SetupPage({ onComplete }: SetupPageProps) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background p-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="text-center"
      >
        <h1 className="text-3xl font-bold">Bienvenue sur C411 Debrid</h1>
        <p className="mt-2 text-muted-foreground">
          Pour utiliser l'application, vous devez configurer vos deux cles API ci-dessous.
        </p>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut", delay: 0.08 }}
      >
        <ApiKeysForm showContinue onContinue={onComplete} />
      </motion.div>
    </main>
  );
}
