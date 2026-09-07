export function formatTaskNumber(
  number: number | null | undefined,
): string | null {
  if (number == null || !Number.isFinite(number) || number <= 0) {
    return null;
  }
  return `#${number}`;
}

export function taskNumberLabel(
  projectSlug: string | null | undefined,
  number: number | null | undefined,
): string | null {
  const formatted = formatTaskNumber(number);
  if (!formatted) return null;
  const slug = projectSlug?.trim();
  return slug ? `${slug}-${number}` : formatted;
}
