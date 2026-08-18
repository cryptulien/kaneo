import { client } from "@kaneo/libs";

async function updateTaskEnvironment(
  taskId: string,
  environment: "dev" | "preprod" | "prod" | null,
) {
  const response = await client.task.environment[":id"].$put({
    param: { id: taskId },
    json: { environment },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  return response.json();
}

export default updateTaskEnvironment;
