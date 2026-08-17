import useProjectStore from "@/store/project";
import { getColumnIcon } from "@/lib/column";
import type Task from "@/types/task";
import TaskStatusPopover from "./task-status-popover";

type TaskStatusChipProps = {
  task: Task;
};

export default function TaskStatusChip({ task }: TaskStatusChipProps) {
  const { project } = useProjectStore();
  const column = project?.columns?.find(
    (col) => col.slug === task.status || col.id === task.status,
  );

  return (
    <TaskStatusPopover task={task}>
      <button
        type="button"
        onClick={(event) => event.stopPropagation()}
        onPointerDown={(event) => event.stopPropagation()}
        className="inline-flex max-w-[9rem] shrink-0 items-center gap-1 rounded-md border border-border/70 bg-background px-1.5 py-0.5 text-[10px] font-medium text-foreground hover:bg-accent/70"
        title={column?.name ?? task.status}
      >
        {getColumnIcon(
          task.status,
          column?.isFinal,
          column?.icon,
          column?.color,
        )}
        <span className="truncate">{column?.name ?? task.status}</span>
      </button>
    </TaskStatusPopover>
  );
}
