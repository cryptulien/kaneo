import { useMutation, useQueryClient } from "@tanstack/react-query";
import updateTaskAsker from "@/fetchers/task/update-task-asker";

export function useUpdateTaskAsker() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: {
      id: string;
      projectId: string;
      askerEmail: string | null;
    }) => updateTaskAsker(payload.id, payload.askerEmail),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["task", variables.id] });
      queryClient.invalidateQueries({
        queryKey: ["tasks", variables.projectId],
      });
    },
  });
}
