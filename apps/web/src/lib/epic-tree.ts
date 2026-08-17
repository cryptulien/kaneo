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

export type EpicListRow = {
  task: Task;
  depth: number;
  isEpicHeader: boolean;
};

export function isEpicTask(task: Task): boolean {
  return (task.childCount ?? task.childIds?.length ?? 0) > 0;
}

export function groupColumnTasksByEpic(
  columnTasks: Task[],
  tasksById: Map<string, Task>,
  expanded: Record<string, boolean>,
): EpicListRow[] {
  const columnIds = new Set(columnTasks.map((task) => task.id));
  const emitted = new Set<string>();
  const rows: EpicListRow[] = [];

  const localChildrenOf = (parentId: string): Task[] =>
    columnTasks.filter((task) => task.parentId === parentId);

  const appendChildren = (parentId: string, depth: number) => {
    const children = localChildrenOf(parentId);
    if (expanded[parentId] === false) {
      for (const child of children) emitted.add(child.id);
      return;
    }
    for (const child of children) {
      emitted.add(child.id);
      rows.push({ task: child, depth, isEpicHeader: false });
      appendChildren(child.id, depth + 1);
    }
  };

  for (const task of columnTasks) {
    if (emitted.has(task.id)) continue;

    const parent = task.parentId ? tasksById.get(task.parentId) : undefined;

    if (parent && columnIds.has(parent.id)) continue;

    if (parent && !columnIds.has(parent.id)) {
      if (emitted.has(parent.id)) continue;
      emitted.add(parent.id);
      rows.push({ task: parent, depth: 0, isEpicHeader: true });
      appendChildren(parent.id, 1);
      continue;
    }

    emitted.add(task.id);
    rows.push({ task, depth: 0, isEpicHeader: false });
    if (isEpicTask(task) || localChildrenOf(task.id).length > 0) {
      appendChildren(task.id, 1);
    }
  }

  return rows;
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
