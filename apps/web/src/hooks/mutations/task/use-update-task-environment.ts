import { useMutation, useQueryClient } from "@tanstack/react-query";
import updateTaskEnvironment from "@/fetchers/task/update-task-environment";
import type { TaskEnvironment } from "@/lib/environment";

export function useUpdateTaskEnvironment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: {
      id: string;
      projectId: string;
      environment: TaskEnvironment | null;
    }) => updateTaskEnvironment(payload.id, payload.environment),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["task", variables.id] });
      queryClient.invalidateQueries({
        queryKey: ["tasks", variables.projectId],
      });
    },
  });
}
