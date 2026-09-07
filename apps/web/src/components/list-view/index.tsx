import {
  closestCorners,
  DndContext,
  type DragEndEvent,
  type DragOverEvent,
  DragOverlay,
  type DragStartEvent,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  type UniqueIdentifier,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { snapCenterToCursor } from "@dnd-kit/modifiers";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useNavigate } from "@tanstack/react-router";
import { produce } from "immer";
import { Archive, ChevronRight, Flag, Plus } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { priorityColorsTaskCard } from "@/constants/priority-colors";
import { useUpdateTask } from "@/hooks/mutations/task/use-update-task";
import { useRegisterShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { cn } from "@/lib/cn";
import { getColumnIcon } from "@/lib/column";
import {
  groupColumnTasksByEpic,
  groupTasksBySurfaceTag,
  indexProjectTasks,
} from "@/lib/epic-tree";
import type { SortConfig } from "@/lib/sort-tasks";
import { formatTaskNumber } from "@/lib/task-number";
import { toast } from "@/lib/toast";
import useBulkSelectionStore from "@/store/bulk-selection";
import useProjectStore from "@/store/project";
import type { ProjectWithTasks } from "@/types/project";
import type Task from "@/types/task";
import BulkToolbar from "../bulk-selection/bulk-toolbar";
import { ArchiveTasksModal } from "../shared/modals/archive-tasks-modal";
import CreateTaskModal from "../shared/modals/create-task-modal";
import { LIST_ROW_COLUMNS } from "./columns";
import TaskRow from "./task-row";

type Column = ProjectWithTasks["columns"][number];

type ColumnSectionProps = {
  column: Column;
  projectSlug: string;
  sectionExpanded: boolean;
  expandedEpics: Record<string, boolean>;
  tasksById: Map<string, Task>;
  groupByTag: boolean;
  showDropIndicator: boolean;
  activeLabelIds?: string[];
  onToggleLabel?: (labelId: string) => void;
  onToggleSection: (columnId: string) => void;
  onToggleEpic: (taskId: string) => void;
  onAddTask: (columnId: string) => void;
  onArchive: (column: Column) => void;
};

function ColumnSection({
  column,
  projectSlug,
  sectionExpanded,
  expandedEpics,
  tasksById,
  groupByTag,
  showDropIndicator,
  activeLabelIds,
  onToggleLabel,
  onToggleSection,
  onToggleEpic,
  onAddTask,
  onArchive,
}: ColumnSectionProps) {
  const { t } = useTranslation();
  const { setNodeRef } = useDroppable({
    id: column.id,
    data: {
      type: "column",
      column,
    },
  });

  const groups = groupByTag
    ? groupTasksBySurfaceTag(column.tasks)
    : [{ tag: "", tasks: column.tasks }];

  return (
    <div
      className={cn(
        "border-b border-border/50 transition-colors duration-150 overflow-auto",
        showDropIndicator && "border-l-4 border-l-ring bg-accent/35",
      )}
      style={
        column.color && !showDropIndicator
          ? { boxShadow: `inset 3px 0 0 0 ${column.color}` }
          : undefined
      }
    >
      <div className="flex items-center justify-between py-2 px-4 bg-muted/60 border-b border-border/50">
        <button
          type="button"
          onClick={() => onToggleSection(column.id)}
          className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-foreground transition-colors"
        >
          <ChevronRight
            className={cn(
              "w-3 h-3 transition-transform",
              sectionExpanded && "rotate-90",
            )}
          />
          <div className="flex items-center gap-2 h-4">
            {getColumnIcon(
              column.id,
              column.isFinal,
              column.icon,
              column.color,
            )}
            <div className="flex items-center gap-1">
              <span className="mt-1 mr-1">{column.name}</span>
              <span className="text-xs text-muted-foreground mt-0.5">
                {column.tasks.length}
              </span>
            </div>
          </div>
        </button>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onAddTask(column.id)}
            className="p-1 hover:bg-accent rounded text-muted-foreground hover:text-foreground transition-colors"
            title={t("tasks:listView.addTask")}
          >
            <Plus className="w-3 h-3" />
          </button>

          {column.isFinal && column.tasks.length > 0 && (
            <button
              type="button"
              onClick={() => onArchive(column)}
              className="p-1 hover:bg-accent rounded text-muted-foreground hover:text-foreground transition-colors"
              title={t("tasks:listView.archiveAllTooltip")}
            >
              <Archive className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {sectionExpanded && (
        <div ref={setNodeRef} className="bg-card">
          <SortableContext
            items={column.tasks}
            strategy={verticalListSortingStrategy}
          >
            {groups.flatMap((group) => {
              const rows = groupColumnTasksByEpic(
                group.tasks,
                tasksById,
                expandedEpics,
              );
              return [
                groupByTag && group.tag ? (
                  <div
                    key={`${column.id}-${group.tag}`}
                    className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground bg-muted/40"
                  >
                    {group.tag}
                  </div>
                ) : null,
                ...rows.map(({ task: node, depth, isEpicHeader }) => (
                  <TaskRow
                    key={`${isEpicHeader ? "epic-header-" : ""}${node.id}`}
                    task={node}
                    projectSlug={projectSlug}
                    depth={depth}
                    isEpicHeader={isEpicHeader}
                    expanded={expandedEpics[node.id] !== false}
                    activeLabelIds={activeLabelIds}
                    onToggleLabel={onToggleLabel}
                    onToggleExpand={() => onToggleEpic(node.id)}
                  />
                )),
              ];
            })}
          </SortableContext>

          {column.tasks.length === 0 && (
            <div className="py-6 px-4 text-center text-xs text-muted-foreground">
              {t("tasks:listView.noTasks")}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

type ListViewProps = {
  project: ProjectWithTasks;
  disableDragDrop?: boolean;
  groupByTag?: boolean;
  sort?: SortConfig;
  onSortChange?: (sort: SortConfig) => void;
  activeLabelIds?: string[];
  onToggleLabel?: (labelId: string) => void;
};

function ListView({
  project,
  disableDragDrop = false,
  groupByTag = false,
  sort,
  onSortChange,
  activeLabelIds,
  onToggleLabel,
}: ListViewProps) {
  const { t } = useTranslation();
  const { setProject } = useProjectStore();
  const {
    setAvailableTasks,
    focusNext,
    focusPrevious,
    focusedTaskId,
    clearFocus,
  } = useBulkSelectionStore();
  const { mutate: updateTask } = useUpdateTask();
  const navigate = useNavigate();
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [overColumnId, setOverColumnId] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >(() => {
    const sections: Record<string, boolean> = {};
    if (project?.columns) {
      for (const col of project.columns) {
        sections[col.id] = true;
      }
    }
    return sections;
  });
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [activeColumn, setActiveColumn] = useState<string | null>(null);
  const [expandedEpics, setExpandedEpics] = useState<Record<string, boolean>>(
    {},
  );
  const tasksById = useMemo(
    () => indexProjectTasks(project?.columns ?? []),
    [project?.columns],
  );
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [columnToArchive, setColumnToArchive] = useState<
    ProjectWithTasks["columns"][number] | null
  >(null);

  useEffect(() => {
    if (project?.columns) {
      const visibleTaskIds = project.columns
        .filter((column) => expandedSections[column.id])
        .flatMap((column) =>
          groupColumnTasksByEpic(column.tasks, tasksById, expandedEpics).map(
            (row) => row.task.id,
          ),
        );
      setAvailableTasks(visibleTaskIds);
    }
  }, [project, expandedSections, expandedEpics, tasksById, setAvailableTasks]);

  useEffect(() => {
    clearFocus();
  }, [clearFocus]);

  useRegisterShortcuts({
    shortcuts: {
      j: () => {
        focusNext();
        const state = useBulkSelectionStore.getState();
        if (state.focusedTaskId) {
          navigate({ to: ".", search: { taskId: state.focusedTaskId } });
        }
      },
      k: () => {
        focusPrevious();
        const state = useBulkSelectionStore.getState();
        if (state.focusedTaskId) {
          navigate({ to: ".", search: { taskId: state.focusedTaskId } });
        }
      },
      Enter: () => {
        if (focusedTaskId && project) {
          navigate({
            to: "/dashboard/workspace/$workspaceId/project/$projectId/task/$taskId",
            params: {
              workspaceId: project.workspaceId,
              projectId: project.id,
              taskId: focusedTaskId,
            },
          });
        }
      },
    },
  });

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: { distance: disableDragDrop ? 999999 : 8 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: disableDragDrop ? 999999 : 200,
        tolerance: 8,
      },
    }),
    useSensor(KeyboardSensor),
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;
    if (!over || !activeId) {
      setOverColumnId(null);
      return;
    }

    if (project?.columns?.some((col) => col.id === over.id)) {
      setOverColumnId(over.id.toString());
      return;
    }

    const taskId = over.id.toString();
    const columnWithTask = project?.columns?.find((col) =>
      col.tasks.some((task) => task.id === taskId),
    );

    if (columnWithTask) {
      setOverColumnId(columnWithTask.id);
    } else {
      setOverColumnId(null);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setOverColumnId(null);

    if (!over || !project?.columns) return;

    const activeTaskId = active.id.toString();
    const overId = over.id.toString();

    const updatedProject = produce(project, (draft) => {
      const sourceColumn = draft?.columns?.find((col) =>
        col.tasks.some((task) => task.id === activeTaskId),
      );
      const destinationColumn = draft?.columns?.find(
        (col) =>
          col.id === overId || col.tasks.some((task) => task.id === overId),
      );

      if (!sourceColumn || !destinationColumn) return;

      const sourceTaskIndex = sourceColumn.tasks.findIndex(
        (task) => task.id === activeTaskId,
      );
      const task = sourceColumn.tasks[sourceTaskIndex];

      sourceColumn.tasks = sourceColumn.tasks.filter(
        (t) => t.id !== activeTaskId,
      );

      if (sourceColumn.id === destinationColumn.id) {
        let destinationIndex = destinationColumn.tasks.findIndex(
          (t) => t.id === overId,
        );
        if (sourceTaskIndex <= destinationIndex) {
          destinationIndex += 1;
        }
        destinationColumn.tasks.splice(destinationIndex, 0, task);

        destinationColumn.tasks.forEach((t, index) => {
          updateTask({
            ...t,
            status: destinationColumn.id,
            position: index,
          });
        });
      } else {
        task.status = destinationColumn.id;
        const destinationIndex =
          overId === destinationColumn.id
            ? destinationColumn.tasks.length
            : destinationColumn.tasks.findIndex((t) => t.id === overId) + 1;

        destinationColumn.tasks.splice(destinationIndex, 0, task);

        destinationColumn.tasks.forEach((t, index) => {
          updateTask({
            ...t,
            status: destinationColumn.id,
            position: index,
          });
        });

        sourceColumn.tasks.forEach((t, index) => {
          updateTask({
            ...t,
            position: index,
          });
        });
      }
    });

    setProject(updatedProject);
  };

  const toggleSection = useCallback((sectionId: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  }, []);

  const toggleEpic = useCallback((taskId: string) => {
    setExpandedEpics((current) => ({
      ...current,
      [taskId]: current[taskId] === false,
    }));
  }, []);

  const handleAddTask = useCallback((columnId: string) => {
    setIsTaskModalOpen(true);
    setActiveColumn(columnId);
  }, []);

  const handleArchiveClick = useCallback((column: Column) => {
    if (!column.isFinal || column.tasks.length === 0) return;
    setColumnToArchive(column);
    setIsArchiveModalOpen(true);
  }, []);

  const handleConfirmArchive = () => {
    if (!columnToArchive) return;

    const updatedProject = produce(project, (draft) => {
      const archivedColumn = draft?.columns?.find(
        (col) => col.id === columnToArchive.id,
      );
      if (!archivedColumn) return;

      for (const task of archivedColumn.tasks) {
        updateTask({
          ...task,
          status: "archived",
        });
      }

      archivedColumn.tasks = [];
    });

    setProject(updatedProject);
    toast.success(
      t("tasks:archive.success", { count: columnToArchive.tasks.length }),
    );

    setIsArchiveModalOpen(false);
    setColumnToArchive(null);
  };

  if (!project?.columns) {
    return null;
  }

  const activeTask = activeId
    ? project.columns
        ?.flatMap((col) => col.tasks)
        .find((task) => task.id === activeId)
    : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      modifiers={[snapCenterToCursor]}
    >
      <div className="w-full h-full overflow-auto bg-muted/20">
        <div
          className={cn(
            LIST_ROW_COLUMNS,
            "sticky top-0 z-10 border-b border-border/70 bg-muted/80 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground backdrop-blur",
          )}
        >
          <span>#</span>
          <span>{t("tasks:listView.title", { defaultValue: "Title" })}</span>
          <span>{t("tasks:listView.status", { defaultValue: "Status" })}</span>
          {onSortChange ? (
            <button
              type="button"
              className={cn(
                "text-left uppercase tracking-wide hover:text-foreground",
                sort?.field === "tag" && "text-foreground",
              )}
              onClick={() =>
                onSortChange({
                  field: "tag",
                  direction:
                    sort?.field === "tag" && sort.direction === "asc"
                      ? "desc"
                      : "asc",
                })
              }
            >
              {t("tasks:listView.tags", { defaultValue: "Tags" })}
              {sort?.field === "tag"
                ? sort.direction === "asc"
                  ? " ↑"
                  : " ↓"
                : ""}
            </button>
          ) : (
            <span>{t("tasks:listView.tags", { defaultValue: "Tags" })}</span>
          )}
          <span>
            {t("tasks:listView.environment", { defaultValue: "Env" })}
          </span>
          <span>{t("tasks:listView.asker", { defaultValue: "Asker" })}</span>
          <span />
        </div>
        <div className="divide-y divide-border/50">
          {project.columns.map((column) => (
            <ColumnSection
              key={column.id}
              column={column}
              projectSlug={project.slug ?? ""}
              sectionExpanded={expandedSections[column.id]}
              expandedEpics={expandedEpics}
              tasksById={tasksById}
              groupByTag={groupByTag}
              showDropIndicator={Boolean(
                activeId && overColumnId === column.id,
              )}
              activeLabelIds={activeLabelIds}
              onToggleLabel={onToggleLabel}
              onToggleSection={toggleSection}
              onToggleEpic={toggleEpic}
              onAddTask={handleAddTask}
              onArchive={handleArchiveClick}
            />
          ))}
        </div>
      </div>

      <DragOverlay>
        {activeTask && (
          <div className="bg-card border border-border rounded-lg shadow-lg p-2 max-w-[200px] cursor-grabbing">
            <div className="flex items-center gap-2">
              <div className="flex-shrink-0">
                <Flag
                  className={cn(
                    "w-3 h-3",
                    priorityColorsTaskCard[
                      activeTask.priority as keyof typeof priorityColorsTaskCard
                    ],
                  )}
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono text-muted-foreground">
                    {formatTaskNumber(activeTask.number) ??
                      `${project?.slug}-${activeTask.number}`}
                  </span>
                  <span className="text-xs text-foreground truncate">
                    {activeTask.title}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </DragOverlay>

      <CreateTaskModal
        open={isTaskModalOpen}
        projectId={project.id}
        onClose={() => setIsTaskModalOpen(false)}
        status={activeColumn ?? "done"}
      />
      <ArchiveTasksModal
        open={isArchiveModalOpen}
        onClose={() => {
          setIsArchiveModalOpen(false);
          setColumnToArchive(null);
        }}
        onConfirm={handleConfirmArchive}
        taskCount={columnToArchive?.tasks.length ?? 0}
      />

      <BulkToolbar />
    </DndContext>
  );
}

export default ListView;
