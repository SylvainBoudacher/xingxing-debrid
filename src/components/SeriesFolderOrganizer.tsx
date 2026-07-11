import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatSize } from "@/lib/debrid";
import type { SeriesGroup } from "@/lib/library";
import {
  assignFiles,
  fileKey,
  groupFolderSections,
  pruneAssignments,
  removeFolder,
  renameFolder,
  type FolderSection,
  type SeriesFolderConfig,
} from "@/lib/seriesFolders";
import { Check, ChevronDown, FolderInput, FolderPlus, Pencil, Trash2 } from "lucide-react";
import { motion } from "motion/react";
import { useMemo, useState } from "react";

interface SeriesFolderOrganizerProps {
  group: SeriesGroup;
  config: SeriesFolderConfig;
  onConfigChange: (config: SeriesFolderConfig) => void;
  // Retire définitivement des fichiers (par lien) de la bibliothèque.
  onDeleteFiles: (links: Set<string>) => void;
  onExit: () => void;
}

// Mode organisation de la modale série : gestion des dossiers (créer,
// renommer, supprimer) et déplacement des épisodes par multi-sélection.
export function SeriesFolderOrganizer({
  group,
  config,
  onConfigChange,
  onDeleteFiles,
  onExit,
}: SeriesFolderOrganizerProps) {
  const sections = useMemo(() => groupFolderSections(group, config), [group, config]);
  // Sélection d'épisodes par fileKey (stable même si un fichier change de dossier).
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  function toggleKeys(keys: string[], on: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      keys.forEach((k) => (on ? next.add(k) : next.delete(k)));
      return next;
    });
  }

  function handleAddFolder() {
    const folder = { id: crypto.randomUUID(), name: "Nouveau dossier", season: null };
    onConfigChange({ ...config, folders: [...config.folders, folder] });
    setEditingId(folder.id);
  }

  function handleRename(id: string, name: string) {
    const trimmed = name.trim();
    if (trimmed) onConfigChange(renameFolder(config, id, trimmed));
    setEditingId(null);
  }

  function handleMoveSelected(folderId: string) {
    onConfigChange(assignFiles(config, [...selected], folderId));
    setSelected(new Set());
  }

  // Suppression du dossier seul : ses épisodes deviennent non classés.
  function handleDeleteKeep(section: FolderSection) {
    onConfigChange(removeFolder(config, section.folder!.id));
    setConfirmId(null);
  }

  // Suppression du dossier ET de ses épisodes (retirés de la bibliothèque).
  function handleDeleteWithEpisodes(section: FolderSection) {
    const keys = new Set(section.items.map((it) => fileKey(it.entry, it.file.name)));
    const links = new Set(section.items.map((it) => it.file.link));
    onConfigChange(pruneAssignments(removeFolder(config, section.folder!.id), keys));
    onDeleteFiles(links);
    setSelected((prev) => new Set([...prev].filter((k) => !keys.has(k))));
    setConfirmId(null);
  }

  return (
    <>
      <div className="flex items-center gap-2 border-y border-black/5 bg-black/[0.02] px-5 py-2.5 dark:border-white/10 dark:bg-white/[0.03]">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleAddFolder}
          className="flex h-7 flex-none items-center gap-1.5 rounded-lg bg-black/5 px-2.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-black/10 dark:bg-white/10 dark:text-zinc-300 dark:hover:bg-white/15"
        >
          <FolderPlus className="h-3.5 w-3.5" />
          Nouveau dossier
        </motion.button>
        <span className="flex-1 text-right text-xs font-medium text-zinc-600 dark:text-zinc-300">
          {selected.size > 0 &&
            `${selected.size} épisode${selected.size > 1 ? "s" : ""} sélectionné${selected.size > 1 ? "s" : ""}`}
        </span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <motion.button
              whileTap={{ scale: 0.97 }}
              disabled={selected.size === 0}
              className="flex h-7 flex-none items-center gap-1.5 rounded-lg bg-indigo-600 pl-2.5 pr-2 text-xs font-medium text-white transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <FolderInput className="h-3.5 w-3.5" />
              Déplacer vers
              <ChevronDown className="h-3 w-3 text-white/70" />
            </motion.button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {config.folders.map((f) => (
              <DropdownMenuItem key={f.id} onClick={() => handleMoveSelected(f.id)}>
                {f.name}
              </DropdownMenuItem>
            ))}
            <DropdownMenuItem onClick={() => handleMoveSelected("")}>Non classés</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onExit}
          className="flex h-7 flex-none items-center rounded-lg bg-emerald-600 px-3 text-xs font-medium text-white transition-colors hover:bg-emerald-500"
        >
          Terminé
        </motion.button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto divide-y divide-black/5 dark:divide-white/10">
        {sections.map((section) => (
          <OrganizerSection
            key={section.folder?.id ?? "orphans"}
            section={section}
            selected={selected}
            onToggleKeys={toggleKeys}
            editing={editingId !== null && editingId === section.folder?.id}
            onStartRename={() => setEditingId(section.folder!.id)}
            onRename={(name) => handleRename(section.folder!.id, name)}
            confirming={confirmId !== null && confirmId === section.folder?.id}
            onAskDelete={() => {
              // Dossier vide : rien à perdre, suppression directe.
              if (section.items.length === 0) handleDeleteKeep(section);
              else setConfirmId(section.folder!.id);
            }}
            onCancelDelete={() => setConfirmId(null)}
            onDeleteKeep={() => handleDeleteKeep(section)}
            onDeleteWithEpisodes={() => handleDeleteWithEpisodes(section)}
          />
        ))}
      </div>
    </>
  );
}

function OrganizerSection({
  section,
  selected,
  onToggleKeys,
  editing,
  onStartRename,
  onRename,
  confirming,
  onAskDelete,
  onCancelDelete,
  onDeleteKeep,
  onDeleteWithEpisodes,
}: {
  section: FolderSection;
  selected: Set<string>;
  onToggleKeys: (keys: string[], on: boolean) => void;
  editing: boolean;
  onStartRename: () => void;
  onRename: (name: string) => void;
  confirming: boolean;
  onAskDelete: () => void;
  onCancelDelete: () => void;
  onDeleteKeep: () => void;
  onDeleteWithEpisodes: () => void;
}) {
  const name = section.folder?.name ?? "Non classés";
  const keys = section.items.map((it) => fileKey(it.entry, it.file.name));
  const allSelected = keys.length > 0 && keys.every((k) => selected.has(k));
  const count = section.items.length;

  return (
    <div>
      <div className="flex items-center gap-3 bg-black/[0.02] px-5 py-2.5 dark:bg-white/[0.03]">
        <SelectionBox
          checked={allSelected}
          disabled={keys.length === 0}
          onClick={() => onToggleKeys(keys, !allSelected)}
        />
        {editing ? (
          <RenameInput initial={name} onCommit={onRename} />
        ) : (
          <span className="truncate text-xs font-semibold text-zinc-800 dark:text-zinc-200">
            {name}
          </span>
        )}
        <span className="flex h-5 flex-none items-center rounded-md bg-black/5 px-1.5 text-[11px] font-medium text-zinc-500 dark:bg-white/10 dark:text-zinc-400">
          {count} ép.
        </span>
        {section.folder && !editing && (
          <div className="ml-auto flex flex-none items-center gap-1.5">
            <button
              onClick={onStartRename}
              title="Renommer le dossier"
              className="flex h-6 w-6 items-center justify-center rounded-md bg-zinc-200 text-zinc-500 transition-colors hover:bg-zinc-300 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={onAskDelete}
              title="Supprimer le dossier"
              className="flex h-6 w-6 items-center justify-center rounded-md bg-zinc-200 text-zinc-500 transition-colors hover:bg-red-500/15 hover:text-red-500 dark:bg-zinc-800 dark:text-zinc-400"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      {confirming && (
        <div className="flex flex-wrap items-center gap-2 bg-red-500/10 px-5 py-2.5">
          <span className="flex-1 text-xs font-medium text-red-600 dark:text-red-400">
            Supprimer « {name} » ? Il contient {count} épisode{count > 1 ? "s" : ""}.
          </span>
          <button
            onClick={onDeleteWithEpisodes}
            className="flex h-7 flex-none items-center gap-1 rounded-lg bg-red-600 px-2.5 text-xs font-medium text-white transition-colors hover:bg-red-500"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Supprimer les {count} épisode{count > 1 ? "s" : ""}
          </button>
          <button
            onClick={onDeleteKeep}
            className="flex h-7 flex-none items-center rounded-lg bg-black/5 px-2.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-black/10 dark:bg-white/10 dark:text-zinc-300 dark:hover:bg-white/15"
          >
            Garder les épisodes (non classés)
          </button>
          <button
            onClick={onCancelDelete}
            className="flex h-7 flex-none items-center rounded-lg px-2.5 text-xs font-medium text-zinc-500 transition-colors hover:bg-black/5 dark:text-zinc-400 dark:hover:bg-white/10"
          >
            Annuler
          </button>
        </div>
      )}

      {count === 0 ? (
        <p className="px-6 py-2 text-[11px] italic text-zinc-400 dark:text-zinc-500">
          Dossier vide : sélectionne des épisodes puis « Déplacer vers ».
        </p>
      ) : (
        <ul className="divide-y divide-black/5 dark:divide-white/5">
          {section.items.map((it) => {
            const key = fileKey(it.entry, it.file.name);
            const sel = selected.has(key);
            const baseName = it.file.name.split("/").pop() ?? it.file.name;
            return (
              <li
                key={key}
                onClick={() => onToggleKeys([key], !sel)}
                className={`flex cursor-pointer items-center gap-3 px-4 py-2 pl-6 transition-colors ${
                  sel ? "bg-indigo-500/10" : "hover:bg-black/[0.025] dark:hover:bg-white/[0.04]"
                }`}
              >
                <SelectionBox checked={sel} />
                <span className="min-w-0 flex-1 truncate text-xs text-zinc-700 dark:text-zinc-300">
                  {baseName}
                </span>
                {it.file.size > 0 && (
                  <span className="flex-none text-[11px] text-zinc-400">
                    {formatSize(it.file.size)}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function SelectionBox({
  checked,
  onClick,
  disabled,
}: {
  checked: boolean;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      disabled={disabled}
      className={`flex h-5 w-5 flex-none items-center justify-center rounded-md ring-1 transition-colors disabled:opacity-30 ${
        checked
          ? "bg-indigo-600 ring-indigo-500"
          : "bg-zinc-200 ring-black/10 dark:bg-zinc-800 dark:ring-white/10"
      }`}
    >
      {checked && <Check className="h-3 w-3 text-white" />}
    </button>
  );
}

function RenameInput({ initial, onCommit }: { initial: string; onCommit: (name: string) => void }) {
  const [value, setValue] = useState(initial);
  return (
    <input
      autoFocus
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onFocus={(e) => e.target.select()}
      onBlur={() => onCommit(value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") onCommit(value);
        if (e.key === "Escape") onCommit(initial);
        e.stopPropagation();
      }}
      className="h-6 min-w-0 flex-1 rounded-md bg-white px-2 text-xs font-semibold text-zinc-800 ring-1 ring-indigo-500 outline-none dark:bg-zinc-800 dark:text-zinc-200"
    />
  );
}
