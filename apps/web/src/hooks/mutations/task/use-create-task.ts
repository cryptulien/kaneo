import { useMutation, useQueryClient } from "@tanstack/react-query";
import createTask, {
  type CreateTaskRequest,
} from "@/fetchers/task/create-task";

function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      title,
      description,
      userId,
      projectId,
      status,
      startDate,
      dueDate,
      priority,
      environment,
      askerEmail,
    }: CreateTaskRequest & {
      environment?: "dev" | "preprod" | "prod";
      askerEmail?: string;
    }) =>
      createTask(
        title,
        description,
        projectId,
        userId,
        status,
        startDate ? new Date(startDate) : undefined,
        dueDate ? new Date(dueDate) : undefined,
        priority,
        environment,
        askerEmail,
      ),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: ["tasks", variables.projectId],
      });
    },
  });
}

export default useCreateTask;
