import { Check } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ShortcutNumber } from "@/components/ui/shortcut-number";
import { useUpdateTaskStatus } from "@/hooks/mutations/task/use-update-task-status";
import { useGetColumns } from "@/hooks/queries/column/use-get-columns";
import { useNumberedShortcuts } from "@/hooks/use-numbered-shortcuts";
import { useWorkspacePermission } from "@/hooks/use-workspace-permission";
import { getColumnIcon } from "@/lib/column";
import { getStatusDisplayLabel } from "@/lib/i18n/domain";
import { toast } from "@/lib/toast";
import type Task from "@/types/task";

type TaskStatusPopoverProps = {
  task: Task;
  children: React.ReactNode;
};

export default function TaskStatusPopover({
  task,
  children,
}: TaskStatusPopoverProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const { data: columns, isLoading, isError } = useGetColumns(task.projectId);
  const statusOptions = useMemo(
    () =>
      (columns ?? []).map((col) => ({
        value: col.slug,
        label: col.name,
        icon: col.icon,
        isFinal: col.isFinal,
        color: col.color,
      })),
    [columns],
  );
  const { mutateAsync: updateTaskStatus } = useUpdateTaskStatus();
  const { canManageTasks } = useWorkspacePermission();
  const canEdit = canManageTasks();

  const handleStatusChange = useCallback(
    async (newStatus: string) => {
      try {
        await updateTaskStatus({
          ...task,
          status: newStatus,
        });
        setOpen(false);
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : t("tasks:popover.status.updateError"),
        );
      }
    },
    [t, task, updateTaskStatus],
  );

  const shortcutOptions = useMemo(
    () =>
      statusOptions.map((status) => ({
        onSelect: () => handleStatusChange(status.value),
      })),
    [handleStatusChange, statusOptions],
  );

  useNumberedShortcuts(open, shortcutOptions);

  if (!canEdit) return <>{children}</>;

  const stopRowClick = (event: React.SyntheticEvent) => {
    event.stopPropagation();
  };

  return (
    <Popover open={open} onOpenChange={setOpen} modal={false}>
      <PopoverTrigger
        asChild
        onClick={stopRowClick}
        onPointerDown={stopRowClick}
      >
        {children}
      </PopoverTrigger>
      <PopoverContent
        className="w-48 p-0 overflow-visible"
        align="start"
        onClick={stopRowClick}
        onPointerDown={stopRowClick}
        onMouseDown={stopRowClick}
      >
        <div>
          {isLoading ? (
            <div className="p-3 text-center text-sm text-muted-foreground">
              {t("common:empty.loading")}
            </div>
          ) : isError ? (
            <div className="p-3 text-center text-sm text-destructive">
              {t("common:error.title")}
            </div>
          ) : (
            statusOptions.map((status, index) => (
              <Button
                key={status.value}
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-2 h-8 px-2 rounded-none first:rounded-t-md last:rounded-b-md"
                style={
                  status.color
                    ? { backgroundColor: `${status.color}22` }
                    : undefined
                }
                onClick={(event) => {
                  event.stopPropagation();
                  void handleStatusChange(status.value);
                }}
                onPointerDown={stopRowClick}
              >
                {getColumnIcon(
                  status.value,
                  status.isFinal,
                  status.icon,
                  status.color,
                )}
                <span
                  className="text-sm"
                  style={status.color ? { color: status.color } : undefined}
                >
                  {getStatusDisplayLabel(status.value, status.label)}
                </span>
                {task.status === status.value ? (
                  <Check className="ml-auto h-4 w-4" />
                ) : (
                  <ShortcutNumber number={index + 1} />
                )}
              </Button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
