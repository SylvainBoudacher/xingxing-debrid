import vlcLogo from "@/assets/vlc.png";
import { formatSize, isVideoFile, type DebridModal } from "@/lib/debrid";
import { useDebridActions } from "@/lib/useDebridActions";
import { Check, Copy, Download, Loader2, X } from "lucide-react";
import { motion } from "motion/react";

interface DebridFilesModalProps {
  modal: DebridModal;
  getAllDebridKey: () => string;
  onClose: () => void;
}

// Fichiers d'un torrent debride : lecture VLC, copie du lien, telechargement.
export function DebridFilesModal({ modal, getAllDebridKey, onClose }: DebridFilesModalProps) {
  const {
    downloadingLink,
    copiedLink,
    vlcLink,
    copyLink: handleCopyLink,
    openVlc: handleOpenVlc,
    downloadFile: handleDownloadFile,
  } = useDebridActions(getAllDebridKey);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 8 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-2xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl ring-1 ring-black/10 dark:ring-white/10 overflow-hidden shadow-2xl"
      >
        <div className="px-5 pt-5 pb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider mb-1">
                Fichiers disponibles
              </p>
              <p className="text-sm font-semibold text-zinc-900 dark:text-white leading-snug line-clamp-2">
                {modal.torrentName}
              </p>
            </div>
            <button
              onClick={onClose}
              className="shrink-0 mt-0.5 flex h-6 w-6 items-center justify-center rounded-md bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors"
            >
              <X className="h-3.5 w-3.5 text-zinc-500 dark:text-zinc-400" />
            </button>
          </div>
        </div>

        <div className="max-h-80 overflow-y-auto px-3 pb-3 space-y-1.5">
          {modal.files.map((file, i) => {
            const fileName = file.name.split("/").pop() ?? file.name;
            const showName = fileName !== modal.torrentName;
            return (
              <div key={i} className="rounded-xl bg-white/80 dark:bg-zinc-800/60 px-4 py-3">
                <div className="mb-3">
                  {showName && (
                    <p className="text-sm font-medium text-zinc-900 dark:text-white leading-snug line-clamp-2 mb-0.5">
                      {fileName}
                    </p>
                  )}
                  <p className="text-xs text-zinc-500">{formatSize(file.size)}</p>
                </div>
                <div className="flex items-center gap-2">
                  {isVideoFile(file.name) && (
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={() => handleOpenVlc(file.link)}
                      disabled={downloadingLink !== null || copiedLink !== null || vlcLink !== null}
                      className="flex items-center justify-center gap-1.5 h-9 px-3 rounded-lg bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      {vlcLink === file.link ? (
                        <Loader2 className="h-3.5 w-3.5 text-zinc-900 dark:text-white animate-spin" />
                      ) : (
                        <img src={vlcLogo} className="h-4 w-4" />
                      )}
                      <span className="text-xs font-medium text-zinc-900 dark:text-white">
                        Lire avec VLC
                      </span>
                    </motion.button>
                  )}
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleCopyLink(file.link)}
                    disabled={downloadingLink !== null || copiedLink !== null || vlcLink !== null}
                    className="flex-1 flex items-center justify-center gap-2 h-9 rounded-lg bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    {copiedLink === file.link ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                        <span className="text-xs font-medium text-green-600 dark:text-green-400">
                          Copie !
                        </span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5 text-zinc-600 dark:text-zinc-300" />
                        <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
                          Copier le lien
                        </span>
                      </>
                    )}
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleDownloadFile(file.link)}
                    disabled={downloadingLink !== null || copiedLink !== null || vlcLink !== null}
                    className="flex-1 flex items-center justify-center gap-2 h-9 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    {downloadingLink === file.link ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 text-white animate-spin" />
                        <span className="text-xs font-medium text-white">Ouverture...</span>
                      </>
                    ) : (
                      <>
                        <Download className="h-3.5 w-3.5 text-white" />
                        <span className="text-xs font-medium text-white">Telecharger</span>
                      </>
                    )}
                  </motion.button>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
}
