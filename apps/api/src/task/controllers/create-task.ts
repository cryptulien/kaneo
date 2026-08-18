import { and, eq, max } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import db from "../../database";
import { columnTable, taskTable, userTable } from "../../database/schema";
import { publishEvent } from "../../events";
import {
  DEFAULT_ASKER_EMAIL,
  isTaskEnvironment,
  isValidAskerEmail,
  normalizeAskerEmail,
} from "../environment";
import { assertValidTaskStatus } from "../validate-task-fields";
import { claimTaskNumber } from "./claim-task-numbers";

async function createTask({
  projectId,
  currentUserId,
  userId,
  title,
  status,
  startDate,
  dueDate,
  description,
  priority,
  environment,
  askerEmail,
}: {
  projectId: string;
  currentUserId: string;
  userId?: string;
  title: string;
  status: string;
  startDate?: Date;
  dueDate?: Date;
  description?: string;
  priority?: string;
  environment?: string | null;
  askerEmail?: string | null;
}) {
  const resolvedStatus = status || "to-do";
  const resolvedPriority = priority || "no-priority";
  const resolvedEnvironment =
    environment && isTaskEnvironment(environment) ? environment : "dev";
  const resolvedAsker = normalizeAskerEmail(askerEmail);
  if (!isValidAskerEmail(resolvedAsker)) {
    throw new HTTPException(400, {
      message: `Invalid asker email "${askerEmail ?? ""}"`,
    });
  }

  const normalizedUserId = userId?.trim() || undefined;

  await assertValidTaskStatus(resolvedStatus, projectId);

  const [assignee] = await db
    .select({ name: userTable.name })
    .from(userTable)
    .where(eq(userTable.id, normalizedUserId ?? ""));

  if (normalizedUserId && !assignee) {
    throw new HTTPException(404, {
      message: "Assignee not found",
    });
  }

  const column = await db.query.columnTable.findFirst({
    where: and(
      eq(columnTable.projectId, projectId),
      eq(columnTable.slug, resolvedStatus),
    ),
  });

  const [maxPositionResult] = await db
    .select({ maxPosition: max(taskTable.position) })
    .from(taskTable)
    .where(
      and(
        eq(taskTable.projectId, projectId),
        column?.id
          ? eq(taskTable.columnId, column.id)
          : eq(taskTable.status, resolvedStatus),
      ),
    );

  const nextPosition = (maxPositionResult?.maxPosition ?? 0) + 1;

  const createdTask = await db.transaction(async (tx) => {
    const taskNumber = await claimTaskNumber(projectId, tx);

    const [task] = await tx
      .insert(taskTable)
      .values({
        projectId,
        userId: normalizedUserId ?? null,
        title: title || "",
        status: resolvedStatus,
        columnId: column?.id ?? null,
        startDate: startDate || null,
        dueDate: dueDate || null,
        description: description || "",
        priority: resolvedPriority,
        environment: resolvedEnvironment,
        askerEmail: resolvedAsker || DEFAULT_ASKER_EMAIL,
        number: taskNumber,
        position: nextPosition,
      })
      .returning();

    return task;
  });

  if (!createdTask) {
    throw new HTTPException(500, {
      message: "Failed to create task",
    });
  }

  await publishEvent("task.created", {
    ...createdTask,
    taskId: createdTask.id,
    userId: createdTask.userId ?? "",
    currentUserId: currentUserId,
    type: "created",
    content: null,
  });

  return {
    ...createdTask,
    assigneeName: assignee?.name,
  };
}

export default createTask;
