import { describe, expect, it } from "vitest";
import type Task from "@/types/task";
import { sortTasks } from "./sort-tasks";

function task(partial: Partial<Task> & Pick<Task, "id" | "title">): Task {
  return {
    number: 1,
    description: null,
    status: "backlog",
    priority: null,
    startDate: null,
    dueDate: null,
    position: 1,
    createdAt: "2026-08-17T00:00:00.000Z",
    userId: null,
    assigneeId: null,
    assigneeName: null,
    projectId: "p1",
    labels: [],
    ...partial,
  };
}

describe("sortTasks by tag", () => {
  it("orders surface tags front, back, fullstack, config, mobile, then untagged", () => {
    const tasks = [
      task({
        id: "cfg",
        title: "Config",
        labels: [{ id: "l-c", name: "config", color: "dark-gray" }],
      }),
      task({ id: "none", title: "Sans tag" }),
      task({
        id: "front",
        title: "Front",
        labels: [{ id: "l-f", name: "front", color: "blue" }],
      }),
      task({
        id: "back",
        title: "Back",
        labels: [{ id: "l-b", name: "back", color: "green" }],
      }),
    ];

    const sorted = sortTasks(tasks, { field: "tag", direction: "asc" });

    expect(sorted.map((item) => item.id)).toEqual([
      "front",
      "back",
      "cfg",
      "none",
    ]);
  });
});
