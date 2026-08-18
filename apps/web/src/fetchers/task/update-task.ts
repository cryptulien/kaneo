import { client } from "@kaneo/libs";
import type { InferRequestType } from "hono/client";
import type Task from "@/types/task";

type UpdateTaskPriority = InferRequestType<
  (typeof client)["task"][":id"]["$put"]
>["json"]["priority"];

async function updateTask(taskId: string, task: Task) {
  const response = await client.task[":id"].$put({
    param: { id: taskId },
    json: {
      userId: task.userId || "",
      title: task.title,
      description: task.description || "",
      status: task.status,
      priority: (task.priority || "") as UpdateTaskPriority,
      startDate: task.startDate?.toString(),
      dueDate: task.dueDate?.toString(),
      position: task.position ?? 0,
      projectId: task.projectId,
      ...((task as Task & { environment?: string | null }).environment !==
      undefined
        ? {
            environment: (task.environment ?? null) as
              | "dev"
              | "preprod"
              | "prod"
              | null,
          }
        : {}),
      ...(task.askerEmail !== undefined ? { askerEmail: task.askerEmail } : {}),
    } as Parameters<(typeof client.task)[":id"]["$put"]>[0]["json"],
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  const data = await response.json();

  return data;
}

export default updateTask;
