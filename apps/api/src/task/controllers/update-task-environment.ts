import { eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import db from "../../database";
import { taskTable } from "../../database/schema";
import { publishEvent } from "../../events";
import { isTaskEnvironment } from "../environment";

async function updateTaskEnvironment({
  id,
  environment,
  currentUserId,
}: {
  id: string;
  environment: string | null;
  currentUserId: string;
}) {
  const existingTask = await db.query.taskTable.findFirst({
    where: eq(taskTable.id, id),
  });

  if (!existingTask) {
    throw new HTTPException(404, { message: "Task not found" });
  }

  const nextEnvironment =
    environment && isTaskEnvironment(environment) ? environment : null;

  const [updatedTask] = await db
    .update(taskTable)
    .set({ environment: nextEnvironment })
    .where(eq(taskTable.id, id))
    .returning();

  if (!updatedTask) {
    throw new HTTPException(500, {
      message: "Failed to update task environment",
    });
  }

  await publishEvent("task.updated", {
    taskId: updatedTask.id,
    projectId: updatedTask.projectId,
    title: updatedTask.title,
    status: updatedTask.status,
    userId: currentUserId,
  });

  return updatedTask;
}

export default updateTaskEnvironment;
