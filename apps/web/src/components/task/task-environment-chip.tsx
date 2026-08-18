import { ENVIRONMENT_META, isTaskEnvironment } from "@/lib/environment";
import type Task from "@/types/task";
import TaskEnvironmentPopover from "./task-environment-popover";

export default function TaskEnvironmentChip({ task }: { task: Task }) {
  const env = isTaskEnvironment(task.environment) ? task.environment : null;
  const meta = env ? ENVIRONMENT_META[env] : null;

  return (
    <TaskEnvironmentPopover task={task}>
      <button
        type="button"
        onClick={(event) => event.stopPropagation()}
        onPointerDown={(event) => event.stopPropagation()}
        className="inline-flex max-w-full items-center gap-1 rounded-md border border-border/70 bg-background px-1.5 py-0.5 text-[10px] font-medium hover:bg-accent/70"
        title={meta?.label ?? "env"}
      >
        {meta ? (
          <>
            <span
              className="inline-block h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: meta.color }}
            />
            <span style={{ color: meta.color }}>{meta.label}</span>
          </>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </button>
    </TaskEnvironmentPopover>
  );
}
