export type Tod = "matin" | "midi" | "soir" | "nuit";

export function todOf(date: Date): Tod {
  const h = date.getHours();
  if (h >= 6 && h < 10) return "matin";
  if (h >= 10 && h < 17) return "midi";
  if (h >= 17 && h < 21) return "soir";
  return "nuit";
}
