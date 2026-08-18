export const TASK_ENVIRONMENTS = ["dev", "preprod", "prod"] as const;

export type TaskEnvironment = (typeof TASK_ENVIRONMENTS)[number];

export const DEFAULT_ASKER_EMAIL = "julienlelandais@me.com";

export const ENVIRONMENT_META: Record<
  TaskEnvironment,
  { label: string; color: string }
> = {
  dev: { label: "dev", color: "#3b82f6" },
  preprod: { label: "preprod", color: "#f59e0b" },
  prod: { label: "prod", color: "#16a34a" },
};

export function isTaskEnvironment(
  value: string | null | undefined,
): value is TaskEnvironment {
  return (
    typeof value === "string" &&
    (TASK_ENVIRONMENTS as readonly string[]).includes(value)
  );
}

export function environmentSortRank(value: string | null | undefined): number {
  if (!isTaskEnvironment(value)) return TASK_ENVIRONMENTS.length + 1;
  return TASK_ENVIRONMENTS.indexOf(value);
}
