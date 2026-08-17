import type Task from "@/types/task";

export function indexProjectTasks(
  columns: Array<{ tasks: Task[] }>,
): Map<string, Task> {
  const byId = new Map<string, Task>();
  for (const column of columns) {
    for (const task of column.tasks) {
      byId.set(task.id, task);
    }
  }
  return byId;
}

export function topLevelTasksInColumn(tasks: Task[]): Task[] {
  return tasks.filter((task) => {
    if (!task.parentId) return true;
    return !tasks.some((candidate) => candidate.id === task.parentId);
  });
}

export const SURFACE_TAGS = [
  "front",
  "back",
  "fullstack",
  "config",
  "mobile",
] as const;

export function taskSurfaceTag(task: Task): string {
  const names = (task.labels ?? []).map((label) => label.name);
  for (const tag of SURFACE_TAGS) {
    if (names.includes(tag)) return tag;
  }
  return "autre";
}

export function groupTasksBySurfaceTag(tasks: Task[]): Array<{
  tag: string;
  tasks: Task[];
}> {
  const buckets = new Map<string, Task[]>();
  for (const task of tasks) {
    const tag = taskSurfaceTag(task);
    const list = buckets.get(tag) ?? [];
    list.push(task);
    buckets.set(tag, list);
  }
  const order = [...SURFACE_TAGS, "autre"];
  return order
    .filter((tag) => (buckets.get(tag) ?? []).length > 0)
    .map((tag) => ({ tag, tasks: buckets.get(tag) ?? [] }));
}
