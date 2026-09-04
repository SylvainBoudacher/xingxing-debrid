import { useState } from "react";
import { motion } from "motion/react";
import { Globe, X } from "lucide-react";
import { detectedOs, type Os } from "./dnsGuide/dnsData";
import { DnsGuideContent, OsTabs } from "./dnsGuide/DnsGuideContent";

export function DnsGuideModal({ onClose }: { onClose: () => void }) {
  const [os, setOs] = useState<Os>(detectedOs);

  return (
    <motion.div
      key="dns-guide"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 8 }}
        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl bg-[#f4f6fc] dark:bg-zinc-900 ring-1 ring-black/8 dark:ring-white/8 shadow-2xl overflow-hidden"
      >
        <div className="px-6 pt-5 pb-4 border-b border-black/6 dark:border-white/6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-500/12 ring-1 ring-violet-500/20">
                <Globe className="h-4 w-4 text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <p className="text-base font-semibold text-zinc-900 dark:text-white">
                  Changer son DNS
                </p>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Suivez les etapes dans l'ordre. Comptez deux minutes.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <OsTabs os={os} onChange={setOs} />
              <button
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-black/6 dark:hover:bg-white/6 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <DnsGuideContent os={os} />
        </div>

        <div className="px-6 py-4 border-t border-black/6 dark:border-white/6">
          <button
            onClick={onClose}
            className="w-full h-10 rounded-xl bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-sm font-medium text-zinc-700 dark:text-zinc-300 transition-colors"
          >
            Fermer
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
