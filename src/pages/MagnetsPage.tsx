import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { fetch } from "@tauri-apps/plugin-http";
import { LazyStore } from "@tauri-apps/plugin-store";
import {
  ArrowLeft, RefreshCw, Trash2, Loader2,
  CheckCircle2, Clock, AlertCircle, Download, Zap, Search, X,
  ChevronLeft, ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { invoke } from "@tauri-apps/api/core";
import { openUrl } from "@tauri-apps/plugin-opener";

const store = new LazyStore("settings.json", { defaults: {}, autoSave: false });
const AD_BASE = "https://api.alldebrid.com/v4";
const PAGE_SIZE = 10;

interface MagnetEntry {
  id: number;
  filename: string;
  size: number;
  status: string;
  statusCode: number;
  downloaded: number;
  seeders: number;
  downloadSpeed: number;
  uploadDate: number;
  completionDate: number;
}

interface DebridFile {
  name: string;
  size: number;
  link: string;
}

function flattenFiles(entries: unknown[], prefix = ""): DebridFile[] {
  const result: DebridFile[] = [];
  for (const entry of entries) {
    const e = entry as Record<string, unknown>;
    const name = prefix ? `${prefix}/${e.n}` : String(e.n);
    if (Array.isArray(e.e)) result.push(...flattenFiles(e.e, name));
    else if (e.l) result.push({ name, size: Number(e.s) || 0, link: String(e.l) });
  }
  return result;
}

function formatSize(bytes: number): string {
  if (!bytes) return "-";
  if (bytes >= 1_073_741_824) return `${(bytes / 1_073_741_824).toFixed(1)} Go`;
  return `${(bytes / 1_048_576).toFixed(0)} Mo`;
}

function formatSpeed(bps: number): string {
  if (!bps) return "";
  if (bps >= 1_048_576) return `${(bps / 1_048_576).toFixed(1)} Mo/s`;
  return `${(bps / 1024).toFixed(0)} Ko/s`;
}

function formatDate(ts: number): string {
  if (!ts) return "-";
  return new Date(ts * 1000).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

type StatusFilter = "all" | "active" | "ready" | "error";

function getStatusFilter(code: number): Exclude<StatusFilter, "all"> {
  if (code === 4) return "ready";
  if (code >= 0 && code <= 3) return "active";
  return "error";
}

function StatusBadge({ code, label }: { code: number; label: string }) {
  if (code === 4) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-medium text-emerald-400 ring-1 ring-emerald-500/30">
        <CheckCircle2 className="h-3 w-3" /> Termine
      </span>
    );
  }
  if (code >= 0 && code <= 3) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/15 px-2.5 py-0.5 text-xs font-medium text-indigo-400 ring-1 ring-indigo-500/30">
        <Zap className="h-3 w-3" /> En cours
      </span>
    );
  }
  if (code >= 10) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-500/15 px-2.5 py-0.5 text-xs font-medium text-red-400 ring-1 ring-red-500/30">
        <AlertCircle className="h-3 w-3" /> Erreur
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-zinc-700/60 px-2.5 py-0.5 text-xs font-medium text-zinc-400 ring-1 ring-white/10">
      <Clock className="h-3 w-3" /> {label}
    </span>
  );
}

function ProgressBar({ downloaded, size }: { downloaded: number; size: number }) {
  if (!size || !downloaded) return null;
  const pct = Math.min(100, (downloaded / size) * 100);
  return (
    <div className="mt-2 h-1 w-full rounded-full bg-white/5 overflow-hidden">
      <motion.div
        className="h-full rounded-full bg-indigo-500"
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      />
    </div>
  );
}

interface FilesModalProps {
  magnetId: number;
  magnetName: string;
  apiKey: string;
  onClose: () => void;
}

function FilesModal({ magnetId, magnetName, apiKey, onClose }: FilesModalProps) {
  const [files, setFiles] = useState<DebridFile[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${AD_BASE}/magnet/files?agent=c411&apikey=${apiKey}&id[]=${magnetId}`);
        const json = await res.json() as { status: string; data?: { magnets?: Array<{ files?: unknown[] }> } };
        const rawFiles = json.data?.magnets?.[0]?.files ?? [];
        setFiles(flattenFiles(rawFiles));
      } catch (err) {
        toast.error(String(err));
        onClose();
      } finally {
        setLoading(false);
      }
    })();
  }, [magnetId, apiKey, onClose]);

  async function handleDownload(link: string) {
    setDownloading(link);
    try {
      const url = await invoke<string>("unlock_link", { link, alldebridKey: apiKey });
      await openUrl(url);
    } catch (err) {
      toast.error(String(err));
    } finally {
      setDownloading(null);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 10 }}
        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-xl bg-zinc-900 ring-1 ring-white/10 overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
          <p className="text-sm font-medium text-white truncate pr-4">{magnetName}</p>
          <button onClick={onClose} className="shrink-0 text-zinc-500 hover:text-white transition-colors text-xl leading-none">&times;</button>
        </div>
        <div className="max-h-96 overflow-y-auto divide-y divide-white/5">
          {loading && (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 text-zinc-400 animate-spin" />
            </div>
          )}
          {!loading && files?.map((file, i) => (
            <div key={i} className="flex items-center gap-3 px-5 py-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm text-white truncate">{file.name.split("/").pop()}</p>
                <p className="text-xs text-zinc-500 mt-0.5">{formatSize(file.size)}</p>
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleDownload(file.link)}
                disabled={downloading !== null}
                className="shrink-0 flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600/80 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {downloading === file.link
                  ? <Loader2 className="h-4 w-4 text-white animate-spin" />
                  : <Download className="h-4 w-4 text-white" />
                }
              </motion.button>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

function Pagination({
  page, totalPages, onChange,
}: { page: number; totalPages: number; onChange: (p: number) => void }) {
  if (totalPages <= 1) return null;

  const pages: (number | "...")[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push("...");
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
    if (page < totalPages - 2) pages.push("...");
    pages.push(totalPages);
  }

  return (
    <div className="flex items-center justify-center gap-1 pt-4 pb-2">
      <button
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      {pages.map((p, i) =>
        p === "..." ? (
          <span key={`ellipsis-${i}`} className="px-1 text-xs text-zinc-600">...</span>
        ) : (
          <button
            key={p}
            onClick={() => onChange(p as number)}
            className={`flex h-8 min-w-8 px-2 items-center justify-center rounded-lg text-xs font-medium transition-colors ${
              p === page
                ? "bg-indigo-600 text-white"
                : "text-zinc-400 hover:text-white hover:bg-zinc-800"
            }`}
          >
            {p}
          </button>
        )
      )}
      <button
        onClick={() => onChange(page + 1)}
        disabled={page === totalPages}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}

interface MagnetsPageProps {
  onBack: () => void;
}

export function MagnetsPage({ onBack }: MagnetsPageProps) {
  const [magnets, setMagnets] = useState<MagnetEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [filesModal, setFilesModal] = useState<{ id: number; name: string } | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [page, setPage] = useState(1);
  const apiKeyRef = useRef("");

  const loadMagnets = useCallback(async () => {
    if (!apiKeyRef.current) return;
    setLoading(true);
    try {
      const res = await fetch(`${AD_BASE}.1/magnet/status?agent=c411&apikey=${apiKeyRef.current}`);
      const json = await res.json() as { status: string; data?: { magnets?: MagnetEntry[] } };
      if (json.status !== "success") throw new Error("Erreur AllDebrid");
      setMagnets(json.data?.magnets ?? []);
    } catch (err) {
      toast.error(String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    store.get<string>("alldebrid_api_key").then((v) => {
      if (v) apiKeyRef.current = v;
      loadMagnets();
    });
  }, [loadMagnets]);

  async function handleDelete(id: number) {
    setDeletingId(id);
    try {
      const res = await fetch(`${AD_BASE}/magnet/delete?agent=c411&apikey=${apiKeyRef.current}&id=${id}`);
      const json = await res.json() as { status: string };
      if (json.status !== "success") throw new Error("Suppression echouee");
      setMagnets((prev) => prev.filter((m) => m.id !== id));
      toast.success("Magnet supprime");
    } catch (err) {
      toast.error(String(err));
    } finally {
      setDeletingId(null);
    }
  }

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [search, statusFilter]);

  const counts = {
    all: magnets.length,
    active: magnets.filter((m) => getStatusFilter(m.statusCode) === "active").length,
    ready: magnets.filter((m) => getStatusFilter(m.statusCode) === "ready").length,
    error: magnets.filter((m) => getStatusFilter(m.statusCode) === "error").length,
  };

  const filtered = magnets.filter((m) => {
    if (statusFilter !== "all" && getStatusFilter(m.statusCode) !== statusFilter) return false;
    if (search.trim() && !m.filename.toLowerCase().includes(search.trim().toLowerCase())) return false;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const tabs: { key: StatusFilter; label: string }[] = [
    { key: "all",    label: `Tous (${counts.all})` },
    { key: "active", label: `En cours (${counts.active})` },
    { key: "ready",  label: `Termine (${counts.ready})` },
    { key: "error",  label: `Erreur (${counts.error})` },
  ];

  const itemVariants = {
    hidden: { opacity: 0, y: 8 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
  };

  return (
    <main className="relative flex min-h-screen flex-col bg-black bg-[radial-gradient(ellipse_70%_45%_at_50%_20%,_#0c1d56_0%,_#04091a_45%,_#000000_75%)]">

      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-6 pb-4">
        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.93 }}
            onClick={onBack}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-800/80 ring-1 ring-white/10 text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </motion.button>
          <h1 className="text-lg font-semibold text-white tracking-tight">Magnets</h1>
        </div>
        <motion.button
          whileHover={{ scale: 1.08, rotate: 15 }}
          whileTap={{ scale: 0.93 }}
          onClick={loadMagnets}
          disabled={loading}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-800/80 ring-1 ring-white/10 text-zinc-400 hover:text-white disabled:opacity-40 transition-colors"
        >
          {loading
            ? <Loader2 className="h-4 w-4 animate-spin" />
            : <RefreshCw className="h-4 w-4" />
          }
        </motion.button>
      </div>

      {/* Tabs */}
      <div className="px-6 pb-3">
        <div className="flex gap-1 rounded-xl bg-zinc-900/60 p-1 ring-1 ring-white/8">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`flex-1 rounded-lg px-2 py-1.5 text-xs font-medium transition-all ${
                statusFilter === tab.key
                  ? "bg-indigo-600 text-white shadow"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Search */}
      <div className="px-6 pb-4">
        <div className="relative flex items-center">
          <Search className="absolute left-3 h-4 w-4 text-zinc-500 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un fichier..."
            className="w-full rounded-xl bg-zinc-900/70 ring-1 ring-white/8 pl-9 pr-9 py-2.5 text-sm text-white placeholder:text-zinc-600 outline-none focus:ring-indigo-500/50 transition-all"
          />
          <AnimatePresence>
            {search && (
              <motion.button
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.7 }}
                transition={{ duration: 0.12 }}
                onClick={() => setSearch("")}
                className="absolute right-3 text-zinc-500 hover:text-white transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Count */}
      {!loading && (
        <div className="px-6 pb-2">
          <p className="text-xs text-zinc-600">
            {filtered.length === 0
              ? "Aucun resultat"
              : `${filtered.length} magnet${filtered.length > 1 ? "s" : ""}${search ? ` pour "${search}"` : ""}`
            }
          </p>
        </div>
      )}

      {/* List */}
      <div className="flex-1 px-6 pb-4 overflow-y-auto">
        {!loading && filtered.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center pt-16 gap-3 text-zinc-600"
          >
            <Download className="h-10 w-10 opacity-30" />
            <p className="text-sm">Aucun magnet trouve.</p>
          </motion.div>
        )}

        <AnimatePresence mode="popLayout">
          <motion.div
            key={`${statusFilter}-${search}-${page}`}
            initial="hidden"
            animate="visible"
            variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.035 } } }}
            className="space-y-2.5"
          >
            {paginated.map((m) => {
              const isReady = m.statusCode === 4;
              const isActive = m.statusCode >= 0 && m.statusCode <= 3;
              const pct = m.size && m.downloaded ? Math.min(100, Math.round((m.downloaded / m.size) * 100)) : 0;

              return (
                <motion.div
                  key={m.id}
                  variants={itemVariants}
                  layout
                  className="rounded-xl bg-zinc-900/70 ring-1 ring-white/8 overflow-hidden"
                >
                  <div className="px-5 py-4">
                    <div className="flex items-start gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-white leading-snug line-clamp-2">{m.filename}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
                          <StatusBadge code={m.statusCode} label={m.status} />
                          <span className="text-xs text-zinc-500">{formatSize(m.size)}</span>
                          {isActive && m.downloadSpeed > 0 && (
                            <span className="text-xs text-indigo-400">{formatSpeed(m.downloadSpeed)}</span>
                          )}
                          {isActive && m.seeders > 0 && (
                            <span className="text-xs text-zinc-500">{m.seeders} seeders</span>
                          )}
                          {isReady && (
                            <span className="text-xs text-zinc-500">{formatDate(m.completionDate)}</span>
                          )}
                          {!isReady && !isActive && (
                            <span className="text-xs text-zinc-500">{formatDate(m.uploadDate)}</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 mt-0.5">
                        {isReady && (
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setFilesModal({ id: m.id, name: m.filename })}
                            className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600/80 hover:bg-indigo-500 transition-colors"
                            title="Voir les fichiers"
                          >
                            <Download className="h-4 w-4 text-white" />
                          </motion.button>
                        )}
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleDelete(m.id)}
                          disabled={deletingId !== null}
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800 hover:bg-red-500/30 hover:text-red-400 text-zinc-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                          title="Supprimer"
                        >
                          {deletingId === m.id
                            ? <Loader2 className="h-4 w-4 animate-spin" />
                            : <Trash2 className="h-4 w-4" />
                          }
                        </motion.button>
                      </div>
                    </div>

                    {isActive && (
                      <div className="mt-3">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs text-zinc-500">{formatSize(m.downloaded)} / {formatSize(m.size)}</span>
                          <span className="text-xs text-zinc-500">{pct}%</span>
                        </div>
                        <ProgressBar downloaded={m.downloaded} size={m.size} />
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </AnimatePresence>

        <Pagination page={page} totalPages={totalPages} onChange={setPage} />
      </div>

      <AnimatePresence>
        {filesModal && (
          <FilesModal
            magnetId={filesModal.id}
            magnetName={filesModal.name}
            apiKey={apiKeyRef.current}
            onClose={() => setFilesModal(null)}
          />
        )}
      </AnimatePresence>
    </main>
  );
}
