// Shim dev-only : fournit un faux __TAURI_INTERNALS__ quand l'app tourne dans
// un navigateur (bun run dev sans le shell Tauri), pour que le store et les
// clés API fonctionnent en preview. Jamais actif en production ni dans Tauri.
//
// - plugin:store  → persiste dans localStorage (clé "devstore:<path>")
// - get/set_api_key → localStorage, avec fallback sur les variables VITE_DEV_*
//   d'un fichier .env.local (voir .env.example)
// - autres commandes → warning console + rejet propre

// Évalué avant l'installation du shim : vrai uniquement en navigateur (dev).
export const isBrowserPreview =
  import.meta.env.DEV && typeof window !== "undefined" && !("__TAURI_INTERNALS__" in window);

const DEV_KEY_ENV: Record<string, string | undefined> = {
  c411_api_key: import.meta.env.VITE_DEV_C411_API_KEY,
  alldebrid_api_key: import.meta.env.VITE_DEV_ALLDEBRID_API_KEY,
  tmdb_api_key: import.meta.env.VITE_DEV_TMDB_API_KEY,
};

const DEV_CBZ_PAGE_COUNT = 12;

function devCbzPages(): string[] {
  return Array.from(
    { length: DEV_CBZ_PAGE_COUNT },
    (_, i) => `page${String(i + 1).padStart(2, "0")}.svg`,
  );
}

// Une page factice au bon format d'image : la 5e est une double page paysage,
// pour exercer le rendu qui l'affiche seule en mode double.
function devCbzPageBytes(index: number): ArrayBuffer {
  const landscape = index === 4;
  const w = landscape ? 1600 : 800;
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="1200" viewBox="0 0 ${w} 1200">` +
    `<rect width="100%" height="100%" fill="#1c1917"/>` +
    `<rect x="16" y="16" width="${w - 32}" height="1168" fill="none" stroke="#57534e" stroke-width="4"/>` +
    `<text x="50%" y="50%" fill="#e7e5e4" font-family="sans-serif" font-size="140" ` +
    `text-anchor="middle" dominant-baseline="middle">${index + 1}</text></svg>`;
  return new TextEncoder().encode(svg).buffer as ArrayBuffer;
}

function installShim() {
  const callbacks = new Map<number, (response: unknown) => void>();
  let nextCallbackId = 1;

  type StoreData = Record<string, unknown>;
  const stores = new Map<number, { path: string; data: StoreData }>();
  const storeRids = new Map<string, number>();
  let nextRid = 1;

  function loadStore(path: string): number {
    const existing = storeRids.get(path);
    if (existing !== undefined) return existing;
    const raw = localStorage.getItem(`devstore:${path}`);
    let data: StoreData = {};
    if (raw) {
      data = JSON.parse(raw);
    } else if (path === "settings.json" && DEV_KEY_ENV.c411_api_key) {
      // Premier lancement en navigateur avec des clés dev : saute le setup
      data = { setup_complete: true, welcome_v1_seen: true };
    }
    const rid = nextRid++;
    stores.set(rid, { path, data });
    storeRids.set(path, rid);
    return rid;
  }

  function saveStore(rid: number) {
    const store = stores.get(rid);
    if (store) localStorage.setItem(`devstore:${store.path}`, JSON.stringify(store.data));
  }

  async function invoke(cmd: string, args: Record<string, unknown> = {}): Promise<unknown> {
    if (cmd.startsWith("plugin:store|")) {
      const action = cmd.slice("plugin:store|".length);
      if (action === "load") return loadStore(args.path as string);
      if (action === "get_store") return storeRids.get(args.path as string) ?? null;

      const store = stores.get(args.rid as number);
      if (!store) throw new Error(`devTauriShim: store rid ${args.rid} inconnu`);
      const { data } = store;
      const key = args.key as string;

      switch (action) {
        case "get":
          return [data[key], key in data];
        case "set":
          data[key] = args.value;
          saveStore(args.rid as number);
          return null;
        case "has":
          return key in data;
        case "delete": {
          const existed = key in data;
          delete data[key];
          saveStore(args.rid as number);
          return existed;
        }
        case "clear":
        case "reset":
          store.data = {};
          saveStore(args.rid as number);
          return null;
        case "keys":
          return Object.keys(data);
        case "values":
          return Object.values(data);
        case "entries":
          return Object.entries(data);
        case "length":
          return Object.keys(data).length;
        case "save":
        case "reload":
        case "close":
          return null;
      }
    }

    if (cmd === "get_api_key") {
      const name = args.name as string;
      return localStorage.getItem(`devkey:${name}`) ?? DEV_KEY_ENV[name] ?? null;
    }
    if (cmd === "set_api_key") {
      localStorage.setItem(`devkey:${args.name as string}`, args.value as string);
      return null;
    }

    // Lecteur CBZ : pages de démonstration générées à la volée, pour que le
    // lecteur reste testable en preview navigateur (la crate zip est côté Rust).
    if (cmd === "cbz_list_pages") return devCbzPages();
    if (cmd === "cbz_page") return devCbzPageBytes(args.index as number);

    // listen/unlisten : accepté sans effet (aucun événement backend en navigateur)
    if (cmd === "plugin:event|listen") return nextCallbackId++;
    if (cmd === "plugin:event|unlisten") return null;

    console.warn(`devTauriShim: commande non supportée en navigateur : ${cmd}`, args);
    throw new Error(`Commande Tauri indisponible en preview navigateur : ${cmd}`);
  }

  (window as unknown as Record<string, unknown>).__TAURI_INTERNALS__ = {
    invoke,
    transformCallback(callback?: (response: unknown) => void) {
      const id = nextCallbackId++;
      if (callback) callbacks.set(id, callback);
      return id;
    },
    unregisterCallback(id: number) {
      callbacks.delete(id);
    },
    convertFileSrc(filePath: string) {
      return filePath;
    },
    metadata: { currentWindow: { label: "main" }, currentWebview: { label: "main" } },
  };

  console.info("devTauriShim actif : store → localStorage, clés API → .env.local");
}

if (isBrowserPreview) {
  installShim();
}
