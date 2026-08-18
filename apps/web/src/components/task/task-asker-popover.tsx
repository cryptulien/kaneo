import { Mail } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useUpdateTaskAsker } from "@/hooks/mutations/task/use-update-task-asker";
import { useWorkspacePermission } from "@/hooks/use-workspace-permission";
import { DEFAULT_ASKER_EMAIL } from "@/lib/environment";
import { toast } from "@/lib/toast";
import type Task from "@/types/task";

export default function TaskAskerPopover({
  task,
  children,
}: {
  task: Task;
  children: React.ReactNode;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(task.askerEmail ?? DEFAULT_ASKER_EMAIL);
  const { mutateAsync: updateAsker } = useUpdateTaskAsker();
  const { canManageTasks } = useWorkspacePermission();
  const canEdit = canManageTasks();

  useEffect(() => {
    setValue(task.askerEmail ?? DEFAULT_ASKER_EMAIL);
  }, [task.askerEmail]);

  if (!canEdit) return <>{children}</>;

  const save = async () => {
    try {
      await updateAsker({
        id: task.id,
        projectId: task.projectId,
        askerEmail: value,
      });
      setOpen(false);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t("tasks:popover.asker.updateError", {
              defaultValue: "Failed to update asker",
            }),
      );
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-64 p-2" align="start">
        <label
          htmlFor="task-asker-email"
          className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground"
        >
          {t("tasks:asker.label", { defaultValue: "Asker" })}
        </label>
        <Input
          id="task-asker-email"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              void save();
            }
          }}
          placeholder={DEFAULT_ASKER_EMAIL}
          className="h-8 text-xs"
        />
        <div className="mt-2 flex items-center justify-between gap-2">
          <a
            href={`mailto:${(task.askerEmail || DEFAULT_ASKER_EMAIL).trim()}`}
            className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
            onClick={(event) => event.stopPropagation()}
          >
            <Mail className="h-3 w-3" />
            {t("tasks:asker.mail", { defaultValue: "Email" })}
          </a>
          <Button size="xs" onClick={() => void save()}>
            {t("common:actions.save", { defaultValue: "Save" })}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
