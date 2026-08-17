import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { indexProjectTasks, topLevelTasksInColumn } from "@/lib/epic-tree";
import useProjectStore from "@/store/project";
import type Task from "@/types/task";
import type { ProjectWithTasks } from "@/types/project";
import TaskCard from "../task-card";

type ColumnDropzoneProps = {
  column: ProjectWithTasks["columns"][number];
  disableDragDrop?: boolean;
  onIsOverChange?: (isOver: boolean) => void;
};

export function ColumnDropzone({
  column,
  disableDragDrop = false,
  onIsOverChange,
}: ColumnDropzoneProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: {
      type: "column",
      column,
    },
  });

  useEffect(() => {
    onIsOverChange?.(isOver);
  }, [isOver, onIsOverChange]);

  const reduceMotion = useReducedMotion();
  const { project } = useProjectStore();
  const [expandedEpics, setExpandedEpics] = useState<Record<string, boolean>>(
    {},
  );
  const tasksById = useMemo(
    () => indexProjectTasks(project?.columns ?? []),
    [project?.columns],
  );

  const visible = topLevelTasksInColumn(column.tasks).flatMap((task) => {
    const collect = (
      node: Task,
      depth: number,
    ): Array<{ node: Task; depth: number }> => {
      const rows = [{ node, depth }];
      if (!expandedEpics[node.id]) return rows;
      for (const childId of node.childIds ?? []) {
        const child = tasksById.get(childId);
        if (child) rows.push(...collect(child, depth + 1));
      }
      return rows;
    };
    return collect(task, 0);
  });

  return (
    <div ref={setNodeRef} className="flex-1 min-h-0">
      <SortableContext
        items={column.tasks}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex flex-col gap-2">
          <AnimatePresence initial={false} mode="popLayout">
            {visible.map(({ node, depth }) => (
              <motion.div
                key={node.id}
                initial={
                  reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.98 }
                }
                animate={
                  reduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1 }
                }
                exit={
                  reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.98 }
                }
                transition={{ type: "spring", duration: 0.35, bounce: 0.15 }}
                style={{ marginLeft: depth * 12 }}
              >
                <TaskCard
                  task={node}
                  disableDragDrop={disableDragDrop}
                  expanded={Boolean(expandedEpics[node.id])}
                  onToggleExpand={() =>
                    setExpandedEpics((current) => ({
                      ...current,
                      [node.id]: !current[node.id],
                    }))
                  }
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </SortableContext>
    </div>
  );
}
