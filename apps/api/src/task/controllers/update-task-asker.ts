import { eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import db from "../../database";
import { taskTable } from "../../database/schema";
import { publishEvent } from "../../events";
import { isValidAskerEmail, normalizeAskerEmail } from "../environment";

async function updateTaskAsker({
  id,
  askerEmail,
  currentUserId,
}: {
  id: string;
  askerEmail: string | null;
  currentUserId: string;
}) {
  const existingTask = await db.query.taskTable.findFirst({
    where: eq(taskTable.id, id),
  });

  if (!existingTask) {
    throw new HTTPException(404, { message: "Task not found" });
  }

  const nextAsker = normalizeAskerEmail(askerEmail);
  if (!isValidAskerEmail(nextAsker)) {
    throw new HTTPException(400, {
      message: `Invalid asker email "${askerEmail ?? ""}"`,
    });
  }

  const [updatedTask] = await db
    .update(taskTable)
    .set({ askerEmail: nextAsker })
    .where(eq(taskTable.id, id))
    .returning();

  if (!updatedTask) {
    throw new HTTPException(500, {
      message: "Failed to update task asker",
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

export default updateTaskAsker;
