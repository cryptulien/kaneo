import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useNavigate } from "@tanstack/react-router";
import { format } from "date-fns";
import {
  Calendar,
  CalendarClock,
  CalendarX,
  ChevronDown,
  ChevronRight,
  GitMerge,
  GitPullRequest,
} from "lucide-react";
import { type CSSProperties, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/preview-card";
import { useDeleteTask } from "@/hooks/mutations/task/use-delete-task";
import useActiveWorkspace from "@/hooks/queries/workspace/use-active-workspace";
import { cn } from "@/lib/cn";
import {
  dueDateStatusColors,
  getDueDateStatus,
  isTaskCompleted,
} from "@/lib/due-date-status";
import { DEFAULT_ASKER_EMAIL } from "@/lib/environment";
import { isEpicTask } from "@/lib/epic-tree";
import { getPriorityIcon } from "@/lib/priority";
import { formatTaskNumber, taskNumberLabel } from "@/lib/task-number";
import { toast } from "@/lib/toast";
import queryClient from "@/query-client";
import useBulkSelectionStore from "@/store/bulk-selection";
import useProjectStore from "@/store/project";
import { useUserPreferencesStore } from "@/store/user-preferences";
import type Task from "@/types/task";
import TaskCardContextMenuContent from "../kanban-board/task-card-context-menu/task-card-context-menu-content";
import { TaskLabels } from "../kanban-board/task-labels";
import TaskAskerPopover from "../task/task-asker-popover";
import TaskEnvironmentChip from "../task/task-environment-chip";
import TaskStatusChip from "../task/task-status-chip";
import { ContextMenu, ContextMenuTrigger } from "../ui/context-menu";
import { LIST_ROW_COLUMNS } from "./columns";

type TaskRowProps = {
  task: Task;
  projectSlug: string;
  depth?: number;
  expanded?: boolean;
  isEpicHeader?: boolean;
  activeLabelIds?: string[];
  onToggleExpand?: () => void;
  onToggleLabel?: (labelId: string) => void;
};

function TaskRow({
  task,
  projectSlug,
  depth = 0,
  expanded = false,
  isEpicHeader = false,
  activeLabelIds,
  onToggleExpand,
  onToggleLabel,
}: TaskRowProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: isEpicHeader ? `epic-header-${task.id}` : task.id,
    disabled: isEpicHeader,
  });
  const isEpic = isEpicHeader || isEpicTask(task);

  const { project } = useProjectStore();
  const taskIsCompleted = isTaskCompleted(task.status, project?.columns);
  const { data: workspace } = useActiveWorkspace();
  const { showPriority, showDueDates, showLabels } = useUserPreferencesStore();
  const [isDeleteTaskModalOpen, setIsDeleteTaskModalOpen] = useState(false);
  const { mutateAsync: deleteTask } = useDeleteTask();
  const { toggleSelection, isSelected, isFocused } = useBulkSelectionStore();
  const isTaskSelected = isSelected(task.id);
  const isTaskFocused = isFocused(task.id);

  const pullRequests = useMemo(() => {
    return (task.externalLinks ?? []).filter(
      (link) => link.resourceType === "pull_request",
    );
  }, [task.externalLinks]);

  const getPRInfo = (pr: (typeof pullRequests)[number]) => {
    const isMerged = pr.metadata?.merged === true;
    const isDraft = pr.metadata?.draft === true;

    if (isMerged) {
      return {
        icon: <GitMerge className="h-3 w-3 text-info-foreground" />,
        status: t("tasks:pr.merged"),
        statusClass: "text-info-foreground",
      };
    }

    if (isDraft) {
      return {
        icon: <GitPullRequest className="h-3 w-3 text-muted-foreground" />,
        status: t("tasks:pr.draft"),
        statusClass: "text-muted-foreground",
      };
    }

    return {
      icon: <GitPullRequest className="h-3 w-3 text-success-foreground" />,
      status: t("tasks:pr.open"),
      statusClass: "text-success-foreground",
    };
  };

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition: transition || "transform 200ms cubic-bezier(0.23, 1, 0.32, 1)",
    touchAction: isDragging ? "none" : "auto",
  };

  const handleClick = (e: React.MouseEvent) => {
    if (!project || !task) return;
    if (e.defaultPrevented) return;

    if (e.metaKey || e.ctrlKey) {
      e.preventDefault();
      toggleSelection(task.id);
      return;
    }

    const currentParams = new URLSearchParams(window.location.search);
    const currentTaskId = currentParams.get("taskId");

    if (isEpic && workspace && project) {
      navigate({
        to: "/dashboard/workspace/$workspaceId/project/$projectId/task/$taskId",
        params: {
          workspaceId: workspace.id,
          projectId: project.id,
          taskId: task.id,
        },
      });
      return;
    }

    if (currentTaskId === task.id) {
      navigate({
        to: ".",
        search: {},
      });
    } else {
      navigate({
        to: ".",
        search: { taskId: task.id },
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleClick(e as unknown as React.MouseEvent);
    }
  };

  const handleDeleteTask = async () => {
    try {
      await deleteTask(task.id);
      queryClient.invalidateQueries({
        queryKey: ["tasks", project?.id],
      });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("tasks:delete.error"),
      );
    } finally {
      toast.success(t("tasks:delete.success"));
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "border-b border-border/50 transition-colors duration-150",
        isDragging && "opacity-50",
        isTaskSelected &&
          "bg-accent/60 shadow-sm ring-1 ring-inset ring-ring/30",
        isTaskFocused && "ring-2 ring-inset ring-ring/50",
      )}
    >
      <ContextMenu>
        <ContextMenuTrigger asChild>
          {/* biome-ignore lint/a11y/noStaticElementInteractions: false positive for onClick and onKeyDown */}
          <div
            onClick={handleClick}
            onKeyDown={handleKeyDown}
            className={cn(
              "group relative px-4 py-1.5 transition-colors cursor-pointer",
              LIST_ROW_COLUMNS,
              isTaskSelected ? "bg-accent/45" : "hover:bg-accent/60",
              isEpicHeader && "bg-muted/35",
            )}
            {...attributes}
            {...listeners}
          >
            <div
              className="flex min-w-0 items-center"
              data-testid="task-number"
              title={taskNumberLabel(projectSlug, task.number) ?? undefined}
            >
              {formatTaskNumber(task.number) ? (
                <span className="font-mono text-xs tabular-nums text-muted-foreground">
                  {formatTaskNumber(task.number)}
                </span>
              ) : (
                <span className="text-xs text-muted-foreground/40">—</span>
              )}
            </div>

            <div
              className="flex min-w-0 items-center gap-2"
              style={{ paddingLeft: depth * 20 }}
            >
              {isEpic ? (
                <button
                  type="button"
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground"
                  onClick={(event) => {
                    event.stopPropagation();
                    onToggleExpand?.();
                  }}
                  onPointerDown={(event) => event.stopPropagation()}
                  aria-expanded={expanded}
                  title={
                    expanded
                      ? t("tasks:epics.collapse", { defaultValue: "Collapse" })
                      : t("tasks:epics.expand", { defaultValue: "Expand" })
                  }
                >
                  {expanded ? (
                    <ChevronDown className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5" />
                  )}
                </button>
              ) : (
                <span className="w-5 shrink-0" />
              )}
              {showPriority && (
                <div className="flex-shrink-0 first:[&_svg]:h-4 first:[&_svg]:w-4">
                  {getPriorityIcon(task.priority ?? "")}
                </div>
              )}

              <span
                className={cn(
                  "min-w-0 truncate text-sm text-foreground",
                  isEpic && "font-medium",
                )}
              >
                {task.title}
                {isEpic && (task.childCount ?? 0) > 0 && (
                  <span className="ml-2 text-[10px] font-medium text-muted-foreground">
                    {task.childCount}
                  </span>
                )}
              </span>
              <div className="ml-auto flex items-center gap-1">
                {pullRequests.length === 1 && (
                  <HoverCard openDelay={200} closeDelay={100}>
                    <HoverCardTrigger asChild>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(pullRequests[0].url, "_blank");
                        }}
                        className="inline-flex items-center gap-1.5 px-2 py-1 rounded border border-border bg-sidebar text-[10px] font-medium text-muted-foreground"
                      >
                        {getPRInfo(pullRequests[0]).icon}
                        <span>#{pullRequests[0].externalId}</span>
                      </button>
                    </HoverCardTrigger>
                    <HoverCardContent
                      className="w-72 p-3"
                      side="bottom"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {getPRInfo(pullRequests[0]).icon}
                          <span>{getPRInfo(pullRequests[0]).status}</span>
                          <span className="text-muted-foreground/50">•</span>
                          <span>#{pullRequests[0].externalId}</span>
                        </div>
                        <p className="text-sm font-medium leading-snug">
                          {pullRequests[0].title || t("tasks:pr.label")}
                        </p>
                      </div>
                    </HoverCardContent>
                  </HoverCard>
                )}

                {pullRequests.length > 1 &&
                  (() => {
                    const hasOpen = pullRequests.some(
                      (pr) => !pr.metadata?.merged && !pr.metadata?.draft,
                    );
                    const allMerged = pullRequests.every(
                      (pr) => pr.metadata?.merged,
                    );
                    const iconColor = allMerged
                      ? "text-info-foreground"
                      : hasOpen
                        ? "text-success-foreground"
                        : "text-muted-foreground";

                    return (
                      <HoverCard openDelay={200} closeDelay={100}>
                        <HoverCardTrigger asChild>
                          <button
                            type="button"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1.5 px-2 py-1 rounded border border-border bg-sidebar text-[10px] font-medium text-muted-foreground"
                          >
                            <GitPullRequest
                              className={`h-3 w-3 ${iconColor}`}
                            />
                            <span>
                              {t("tasks:pr.count", {
                                count: pullRequests.length,
                              })}
                            </span>
                          </button>
                        </HoverCardTrigger>
                        <HoverCardContent
                          className="w-auto min-w-56 max-w-96 p-1"
                          side="bottom"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {pullRequests.map((pr, index) => {
                            const prInfo = getPRInfo(pr);
                            const repoMatch = pr.url.match(
                              /github\.com\/([^/]+\/[^/]+)\/pull/,
                            );
                            const repoName = repoMatch ? repoMatch[1] : null;
                            return (
                              <div key={pr.id}>
                                {index > 0 && (
                                  <hr className="border-border my-1" />
                                )}
                                <button
                                  type="button"
                                  onClick={() => window.open(pr.url, "_blank")}
                                  className="w-full px-2 py-1.5 text-left hover:bg-muted/50 rounded transition-colors"
                                >
                                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                                    {prInfo.icon}
                                    <span>
                                      {repoName}#{pr.externalId}
                                    </span>
                                  </div>
                                  <p className="text-xs leading-tight line-clamp-2 mt-0.5">
                                    {pr.title || t("tasks:pr.label")}
                                  </p>
                                  <span className="text-[10px] text-muted-foreground">
                                    {prInfo.status}
                                  </span>
                                </button>
                              </div>
                            );
                          })}
                        </HoverCardContent>
                      </HoverCard>
                    );
                  })()}
              </div>
            </div>

            <div className="min-w-0">
              <TaskStatusChip task={task} />
            </div>

            <div className="min-w-0" data-testid="tags-column">
              {showLabels ? (
                <TaskLabels
                  labels={task.labels ?? []}
                  activeLabelIds={activeLabelIds}
                  onLabelClick={onToggleLabel}
                />
              ) : null}
            </div>

            <div className="min-w-0" data-testid="env-column">
              <TaskEnvironmentChip task={task} />
            </div>

            <div className="min-w-0" data-testid="asker-column">
              <TaskAskerPopover task={task}>
                <button
                  type="button"
                  onClick={(event) => event.stopPropagation()}
                  onPointerDown={(event) => event.stopPropagation()}
                  className="block max-w-full truncate text-left text-[11px] text-muted-foreground hover:text-foreground hover:underline"
                  title={task.askerEmail || DEFAULT_ASKER_EMAIL}
                >
                  {task.askerEmail || DEFAULT_ASKER_EMAIL}
                </button>
              </TaskAskerPopover>
            </div>

            {showDueDates && task.dueDate ? (
              <div
                className={`flex items-center gap-1 text-[10px] px-2 py-1 rounded flex-shrink-0 ${dueDateStatusColors[getDueDateStatus(task.dueDate, taskIsCompleted)]}`}
              >
                {getDueDateStatus(task.dueDate, taskIsCompleted) ===
                  "overdue" && <CalendarX className="w-3 h-3" />}
                {getDueDateStatus(task.dueDate, taskIsCompleted) ===
                  "due-soon" && <CalendarClock className="w-3 h-3" />}
                {(getDueDateStatus(task.dueDate, taskIsCompleted) ===
                  "far-future" ||
                  getDueDateStatus(task.dueDate, taskIsCompleted) ===
                    "no-due-date") && <Calendar className="w-3 h-3" />}
                <span>{format(new Date(task.dueDate), "MMM d")}</span>
              </div>
            ) : (
              <span />
            )}
          </div>
        </ContextMenuTrigger>

        {project && workspace && (
          <TaskCardContextMenuContent
            task={task}
            taskCardContext={{
              projectId: project.id,
              worskpaceId: workspace.id,
            }}
            onDeleteClick={() => setIsDeleteTaskModalOpen(true)}
          />
        )}
      </ContextMenu>

      <AlertDialog
        open={isDeleteTaskModalOpen}
        onOpenChange={setIsDeleteTaskModalOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("tasks:delete.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("tasks:delete.description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogClose render={<Button variant="outline" size="sm" />}>
              {t("common:actions.cancel")}
            </AlertDialogClose>
            <AlertDialogClose
              render={
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDeleteTask}
                />
              }
            >
              {t("tasks:delete.action")}
            </AlertDialogClose>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default TaskRow;
