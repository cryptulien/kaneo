import { Check } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useUpdateTaskEnvironment } from "@/hooks/mutations/task/use-update-task-environment";
import { useWorkspacePermission } from "@/hooks/use-workspace-permission";
import {
  ENVIRONMENT_META,
  TASK_ENVIRONMENTS,
  type TaskEnvironment,
} from "@/lib/environment";
import { toast } from "@/lib/toast";
import type Task from "@/types/task";

type TaskEnvironmentPopoverProps = {
  task: Task;
  children: React.ReactNode;
};

export default function TaskEnvironmentPopover({
  task,
  children,
}: TaskEnvironmentPopoverProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const { mutateAsync: updateEnvironment } = useUpdateTaskEnvironment();
  const { canManageTasks } = useWorkspacePermission();
  const canEdit = canManageTasks();

  if (!canEdit) return <>{children}</>;

  const handleChange = async (environment: TaskEnvironment | null) => {
    try {
      await updateEnvironment({
        id: task.id,
        projectId: task.projectId,
        environment,
      });
      setOpen(false);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t("tasks:popover.environment.updateError", {
              defaultValue: "Failed to update environment",
            }),
      );
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-44 p-0" align="start">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 h-8 px-2 rounded-none first:rounded-t-md"
          onClick={() => handleChange(null)}
        >
          <span className="text-sm text-muted-foreground">—</span>
          {!task.environment && <Check className="ml-auto h-4 w-4" />}
        </Button>
        {TASK_ENVIRONMENTS.map((value) => (
          <Button
            key={value}
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 h-8 px-2 rounded-none last:rounded-b-md"
            onClick={() => handleChange(value)}
          >
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ backgroundColor: ENVIRONMENT_META[value].color }}
            />
            <span
              className="text-sm"
              style={{ color: ENVIRONMENT_META[value].color }}
            >
              {ENVIRONMENT_META[value].label}
            </span>
            {task.environment === value && (
              <Check className="ml-auto h-4 w-4" />
            )}
          </Button>
        ))}
      </PopoverContent>
    </Popover>
  );
}
