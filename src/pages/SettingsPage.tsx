import { motion } from "motion/react";
import { ArrowLeft } from "lucide-react";
import { ApiKeysForm } from "@/components/ApiKeysForm";

interface SettingsPageProps {
  onBack: () => void;
}

export function SettingsPage({ onBack }: SettingsPageProps) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="w-full max-w-lg"
      >
        <motion.button
          whileHover={{ x: -3 }}
          whileTap={{ scale: 0.96 }}
          onClick={onBack}
          className="mb-6 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </motion.button>
        <ApiKeysForm />
      </motion.div>
    </main>
  );
}
