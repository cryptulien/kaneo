import { describe, expect, it } from "vitest";
import type Task from "@/types/task";
import { groupColumnTasksByEpic, indexProjectTasks } from "./epic-tree";

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
    ...partial,
  };
}

describe("groupColumnTasksByEpic", () => {
  it("nests children under a local epic and keeps standalone tasks at the root", () => {
    const parent = task({
      id: "epic-1",
      title: "Épopée — Publication",
      childIds: ["child-1"],
      childCount: 1,
    });
    const child = task({
      id: "child-1",
      title: "Erreur date range",
      parentId: "epic-1",
      parentTitle: "Épopée — Publication",
    });
    const standalone = task({ id: "solo", title: "Hors épopée" });

    const rows = groupColumnTasksByEpic(
      [child, parent, standalone],
      indexProjectTasks([{ tasks: [child, parent, standalone] }]),
      { "epic-1": true },
    );

    expect(
      rows.map((row) => [row.task.id, row.depth, row.isEpicHeader]),
    ).toEqual([
      ["epic-1", 0, false],
      ["child-1", 1, false],
      ["solo", 0, false],
    ]);
  });

  it("inserts the parent as an epic header when only the children live in this column", () => {
    const parent = task({
      id: "epic-1",
      title: "Épopée — Publication",
      status: "in-review",
      childIds: ["child-1", "child-2"],
      childCount: 2,
    });
    const child = task({
      id: "child-1",
      title: "Erreur date range",
      parentId: "epic-1",
      parentTitle: "Épopée — Publication",
    });
    const other = task({
      id: "child-2",
      title: "Autre colonne",
      status: "in-review",
      parentId: "epic-1",
    });

    const rows = groupColumnTasksByEpic(
      [child],
      indexProjectTasks([{ tasks: [parent, child, other] }]),
      { "epic-1": true },
    );

    expect(
      rows.map((row) => [row.task.id, row.depth, row.isEpicHeader]),
    ).toEqual([
      ["epic-1", 0, true],
      ["child-1", 1, false],
    ]);
  });

  it("hides children when the epic is collapsed", () => {
    const parent = task({
      id: "epic-1",
      title: "Épopée — Publication",
      childIds: ["child-1"],
      childCount: 1,
    });
    const child = task({
      id: "child-1",
      title: "Erreur date range",
      parentId: "epic-1",
    });

    const rows = groupColumnTasksByEpic(
      [parent, child],
      indexProjectTasks([{ tasks: [parent, child] }]),
      { "epic-1": false },
    );

    expect(rows.map((row) => row.task.id)).toEqual(["epic-1"]);
  });
});
