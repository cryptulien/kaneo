export const COLUMN_COLORS = [
  { name: "slate", value: "#6b7280" },
  { name: "blue", value: "#2563eb" },
  { name: "amber", value: "#d97706" },
  { name: "violet", value: "#7c3aed" },
  { name: "green", value: "#16a34a" },
  { name: "rose", value: "#e11d48" },
  { name: "cyan", value: "#0891b2" },
  { name: "orange", value: "#ea580c" },
] as const;

export const DEFAULT_COLUMN_COLORS: Record<string, string> = {
  backlog: "#6b7280",
  "to-do": "#2563eb",
  "in-progress": "#d97706",
  "in-review": "#7c3aed",
  done: "#16a34a",
};

export function resolveColumnColor(
  slug?: string | null,
  color?: string | null,
): string | undefined {
  if (color) return color;
  if (slug && DEFAULT_COLUMN_COLORS[slug]) return DEFAULT_COLUMN_COLORS[slug];
  return undefined;
}
