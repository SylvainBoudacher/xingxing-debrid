export interface DebridFile {
  name: string;
  size: number;
  link: string;
}

export interface DebridModal {
  torrentName: string;
  files: DebridFile[];
}

// Flatten AllDebrid's nested file tree (folders carry `e`, files carry `l`).
export function flattenFiles(entries: unknown[], prefix = ""): DebridFile[] {
  const result: DebridFile[] = [];
  for (const entry of entries) {
    const e = entry as Record<string, unknown>;
    const name = prefix ? `${prefix}/${e.n}` : String(e.n);
    if (Array.isArray(e.e)) {
      result.push(...flattenFiles(e.e, name));
    } else if (e.l) {
      result.push({ name, size: Number(e.s) || 0, link: String(e.l) });
    }
  }
  return result;
}

export function formatSize(bytes: number): string {
  if (!bytes) return "-";
  if (bytes >= 1_073_741_824) return `${(bytes / 1_073_741_824).toFixed(1)} Go`;
  return `${(bytes / 1_048_576).toFixed(0)} Mo`;
}
