// "à l'instant", "il y a 12 s", "il y a 3 min", "il y a 2 h".
export function formatAgo(timestamp: number, now = Date.now()): string {
  const s = Math.max(0, Math.round((now - timestamp) / 1000));
  if (s < 5) return "à l'instant";
  if (s < 60) return `il y a ${s} s`;
  const m = Math.round(s / 60);
  if (m < 60) return `il y a ${m} min`;
  return `il y a ${Math.round(m / 60)} h`;
}

// "14h32"
export function formatClock(timestamp: number): string {
  const d = new Date(timestamp);
  return `${d.getHours()}h${String(d.getMinutes()).padStart(2, "0")}`;
}
