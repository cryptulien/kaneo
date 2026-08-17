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
