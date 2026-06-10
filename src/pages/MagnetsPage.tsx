import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { fetch } from "@tauri-apps/plugin-http";
import { LazyStore } from "@tauri-apps/plugin-store";
import {
  ArrowLeft, RefreshCw, Trash2, Loader2,
  CheckCircle2, Clock, AlertCircle, Download, Zap, Search, X,
  ChevronLeft, ChevronRight, Copy, Check, Menu, KeyRound,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import vlcLogo from "@/assets/vlc.png";
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

const VIDEO_EXTENSIONS = new Set([
  "mp4", "mkv", "avi", "mov", "wmv", "flv", "webm", "m4v",
  "mpg", "mpeg", "ts", "m2ts", "3gp", "ogv", "vob",
]);

function isVideoFile(name: string): boolean {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  return VIDEO_EXTENSIONS.has(ext);
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
      <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/12 px-2 py-0.5 text-[11px] font-medium text-emerald-400">
        <CheckCircle2 className="h-3 w-3" /> Termine
      </span>
    );
  }
  if (code >= 0 && code <= 3) {
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-indigo-500/12 px-2 py-0.5 text-[11px] font-medium text-indigo-400">
        <Zap className="h-3 w-3" /> En cours
      </span>
    );
  }
  if (code >= 10) {
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-red-500/12 px-2 py-0.5 text-[11px] font-medium text-red-400">
        <AlertCircle className="h-3 w-3" /> Erreur
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-zinc-700/50 px-2 py-0.5 text-[11px] font-medium text-zinc-400">
      <Clock className="h-3 w-3" /> {label}
    </span>
  );
}

function ProgressBar({ downloaded, size }: { downloaded: number; size: number }) {
  if (!size || !downloaded) return null;
  const pct = Math.min(100, (downloaded / size) * 100);
  return (
    <div className="mt-1.5 h-[3px] w-full rounded-full bg-white/6 overflow-hidden">
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
  const [copying, setCopying] = useState<string | null>(null);
  const [vlcing, setVlcing] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

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

  async function handleOpenVlc(link: string) {
    setVlcing(link);
    try {
      const url = await invoke<string>("unlock_link", { link, alldebridKey: apiKey });
      await invoke("open_with_vlc", { url });
      toast.success("Ouvert dans VLC");
    } catch (err) {
      toast.error(String(err));
    } finally {
      setVlcing(null);
    }
  }

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

  async function handleCopy(link: string) {
    setCopying(link);
    try {
      const url = await invoke<string>("unlock_link", { link, alldebridKey: apiKey });
      await navigator.clipboard.writeText(url);
      toast.success("Lien copie");
    } catch (err) {
      toast.error(String(err));
    } finally {
      setTimeout(() => setCopying(null), 2000);
    }
  }

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
        className="w-full max-w-lg rounded-2xl bg-zinc-900/95 backdrop-blur-xl ring-1 ring-white/10 overflow-hidden shadow-2xl"
      >
        {/* Header */}
        <div className="px-5 pt-5 pb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider mb-1">Fichiers disponibles</p>
              <p className="text-sm font-semibold text-white leading-snug line-clamp-2">{magnetName}</p>
            </div>
            <button
              onClick={onClose}
              className="shrink-0 mt-0.5 flex h-6 w-6 items-center justify-center rounded-md bg-zinc-800 hover:bg-zinc-700 transition-colors"
            >
              <X className="h-3.5 w-3.5 text-zinc-400" />
            </button>
          </div>
        </div>

        {/* File list */}
        <div className="max-h-80 overflow-y-auto px-3 pb-3 space-y-1.5">
          {loading && (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 text-zinc-400 animate-spin" />
            </div>
          )}
          {!loading && files?.map((file, i) => {
            const fileName = file.name.split("/").pop() ?? file.name;
            const showName = fileName !== magnetName;
            return (
              <div key={i} className="rounded-xl bg-zinc-800/60 px-4 py-3">
                <div className="mb-3">
                  {showName && <p className="text-sm font-medium text-white leading-snug line-clamp-2 mb-0.5">{fileName}</p>}
                  <p className="text-xs text-zinc-500">{formatSize(file.size)}</p>
                </div>
                <div className="flex items-center gap-2">
                  {isVideoFile(file.name) && (
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={() => handleOpenVlc(file.link)}
                      disabled={downloading !== null || copying !== null || vlcing !== null}
                      className="flex items-center justify-center gap-1.5 h-9 px-3 rounded-lg bg-zinc-700 hover:bg-zinc-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      {vlcing === file.link
                        ? <Loader2 className="h-3.5 w-3.5 text-white animate-spin" />
                        : <img src={vlcLogo} className="h-4 w-4" />
                      }
                      <span className="text-xs font-medium text-white">Lire avec VLC</span>
                    </motion.button>
                  )}
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleCopy(file.link)}
                    disabled={downloading !== null || copying !== null || vlcing !== null}
                    className="flex-1 flex items-center justify-center gap-2 h-9 rounded-lg bg-zinc-700 hover:bg-zinc-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    {copying === file.link
                      ? <><Check className="h-3.5 w-3.5 text-green-400" /><span className="text-xs font-medium text-green-400">Copie !</span></>
                      : <><Copy className="h-3.5 w-3.5 text-zinc-300" /><span className="text-xs font-medium text-zinc-300">Copier le lien</span></>
                    }
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleDownload(file.link)}
                    disabled={downloading !== null || copying !== null || vlcing !== null}
                    className="flex-1 flex items-center justify-center gap-2 h-9 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    {downloading === file.link
                      ? <><Loader2 className="h-3.5 w-3.5 text-white animate-spin" /><span className="text-xs font-medium text-white">Ouverture...</span></>
                      : <><Download className="h-3.5 w-3.5 text-white" /><span className="text-xs font-medium text-white">Telecharger</span></>
                    }
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
  onNavigate: (page: "settings") => void;
}

export function MagnetsPage({ onBack, onNavigate }: MagnetsPageProps) {
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

  return (
    <main className="relative flex min-h-screen flex-col bg-black bg-[radial-gradient(ellipse_70%_45%_at_50%_20%,_#0c1d56_0%,_#04091a_45%,_#000000_75%)]">

      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-white/5 bg-black/30 backdrop-blur-xl">
        <div className="relative mx-auto flex w-full max-w-3xl items-center justify-between px-6 py-4 sm:px-8">
          <motion.button
            whileTap={{ scale: 0.93 }}
            onClick={onBack}
            className="flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm font-medium">Retour</span>
          </motion.button>

          <h1 className="text-sm font-semibold text-white tracking-tight absolute left-1/2 -translate-x-1/2">Magnets</h1>

          <div className="flex items-center gap-2">
            <motion.button
              whileTap={{ scale: 0.93 }}
              animate={loading ? { rotate: 360 } : { rotate: 0 }}
              transition={loading ? { duration: 1, repeat: Infinity, ease: "linear" } : {}}
              onClick={loadMagnets}
              disabled={loading}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-indigo-400 hover:text-indigo-300 hover:bg-white/5 disabled:opacity-40 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
            </motion.button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <motion.button
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.93 }}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800/80 ring-1 ring-white/10 text-zinc-400 hover:text-white hover:bg-zinc-700/80 transition-colors"
                >
                  <Menu className="h-4 w-4" />
                </motion.button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem onClick={() => onNavigate("settings")}>
                  <KeyRound className="mr-2 h-4 w-4" />
                  Cles API
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="mx-auto w-full max-w-3xl px-6 pt-6 pb-4 sm:px-8 space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="flex flex-1 gap-1 rounded-xl bg-zinc-900/70 p-1 ring-1 ring-white/6">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                className={`flex-1 rounded-lg px-2 py-1.5 text-xs font-medium whitespace-nowrap transition-all ${
                  statusFilter === tab.key
                    ? "bg-indigo-600 text-white shadow"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative flex items-center sm:w-64">
            <Search className="absolute left-3 h-3.5 w-3.5 text-zinc-500 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher..."
              className="w-full rounded-xl bg-zinc-900/70 ring-1 ring-white/6 pl-9 pr-9 py-2 text-sm text-white placeholder:text-zinc-600 outline-none focus:ring-indigo-500/40 transition-all"
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

        {!loading && (
          <p className="text-[11px] text-zinc-600 uppercase tracking-wider font-medium">
            {filtered.length === 0
              ? "Aucun resultat"
              : `${filtered.length} magnet${filtered.length > 1 ? "s" : ""}${search ? ` pour "${search}"` : ""}`
            }
          </p>
        )}
      </div>

      {/* List */}
      <div className="mx-auto w-full max-w-3xl flex-1 px-6 pb-10 sm:px-8">
        {!loading && filtered.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center pt-16 gap-4 text-zinc-600"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/[0.03] ring-1 ring-white/6">
              <Download className="h-7 w-7 opacity-40" />
            </div>
            <p className="text-sm">Aucun magnet trouve.</p>
          </motion.div>
        )}

        <motion.div
          key={`${statusFilter}-${search}-${page}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="space-y-2"
        >
            {paginated.map((m) => {
              const isReady = m.statusCode === 4;
              const isActive = m.statusCode >= 0 && m.statusCode <= 3;
              const pct = m.size && m.downloaded ? Math.min(100, Math.round((m.downloaded / m.size) * 100)) : 0;

              return (
                <div
                  key={m.id}
                  className="rounded-2xl bg-zinc-900/70 ring-1 ring-white/6 overflow-hidden transition-all duration-200 hover:bg-zinc-900 hover:ring-white/12 hover:shadow-[0_8px_30px_rgba(0,0,0,0.4)]"
                >
                  <div className="px-5 py-4">
                    <p className="text-sm font-semibold text-white leading-snug line-clamp-2 mb-2.5">{m.filename}</p>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                      <StatusBadge code={m.statusCode} label={m.status} />
                      <span className="text-[11px] text-zinc-500">{formatSize(m.size)}</span>
                      {isActive && m.downloadSpeed > 0 && (
                        <span className="text-[11px] text-indigo-400 font-medium">{formatSpeed(m.downloadSpeed)}</span>
                      )}
                      {isActive && m.seeders > 0 && (
                        <span className="text-[11px] text-zinc-500">{m.seeders} seeders</span>
                      )}
                      {isReady && (
                        <span className="text-[11px] text-zinc-500">{formatDate(m.completionDate)}</span>
                      )}
                      {!isReady && !isActive && (
                        <span className="text-[11px] text-zinc-500">{formatDate(m.uploadDate)}</span>
                      )}

                      <div className="flex items-center gap-1.5 ml-auto shrink-0">
                        {isReady && (
                          <motion.button
                            whileTap={{ scale: 0.97 }}
                            onClick={() => setFilesModal({ id: m.id, name: m.filename })}
                            className="flex items-center gap-1.5 h-7 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 transition-colors"
                          >
                            <Download className="h-3 w-3 text-white" />
                            <span className="text-[11px] font-medium text-white">Voir les fichiers</span>
                          </motion.button>
                        )}
                        <motion.button
                          whileTap={{ scale: 0.97 }}
                          onClick={() => handleDelete(m.id)}
                          disabled={deletingId !== null}
                          className="flex items-center justify-center h-7 w-7 rounded-lg bg-zinc-800 hover:bg-red-500/20 text-zinc-500 hover:text-red-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                          {deletingId === m.id
                            ? <Loader2 className="h-3 w-3 animate-spin" />
                            : <Trash2 className="h-3 w-3" />
                          }
                        </motion.button>
                      </div>
                    </div>

                    {isActive && (
                      <div className="mt-2">
                        <ProgressBar downloaded={m.downloaded} size={m.size} />
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-[10px] text-zinc-600">{formatSize(m.downloaded)} / {formatSize(m.size)}</span>
                          <span className="text-[10px] text-zinc-600">{pct}%</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
        </motion.div>

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
