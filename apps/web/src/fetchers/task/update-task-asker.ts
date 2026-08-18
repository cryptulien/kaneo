import { client } from "@kaneo/libs";

async function updateTaskAsker(taskId: string, askerEmail: string | null) {
  const response = await client.task.asker[":id"].$put({
    param: { id: taskId },
    json: { askerEmail },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  return response.json();
}

export default updateTaskAsker;
