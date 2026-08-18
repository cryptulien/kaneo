export const VALID_ENVIRONMENTS = ["dev", "preprod", "prod"] as const;

export type TaskEnvironment = (typeof VALID_ENVIRONMENTS)[number];

export const DEFAULT_ASKER_EMAIL = "julienlelandais@me.com";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isTaskEnvironment(value: string): value is TaskEnvironment {
  return (VALID_ENVIRONMENTS as readonly string[]).includes(value);
}

export function normalizeAskerEmail(value: string | null | undefined): string {
  const trimmed = value?.trim().toLowerCase() ?? "";
  return trimmed || DEFAULT_ASKER_EMAIL;
}

export function isValidAskerEmail(value: string): boolean {
  return EMAIL_RE.test(value);
}
