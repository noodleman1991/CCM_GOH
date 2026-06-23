"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Plus, Circle, CircleDot, CheckCircle2, X, GripVertical } from "lucide-react";
import {
  DndContext,
  closestCorners,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  addStage,
  addTask,
  cycleTaskStatus,
  deleteTask,
  deleteStage,
  reorderTasks,
} from "@/lib/actions/plans";

type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE";
type Task = { id: string; title: string; status: TaskStatus };
type Stage = { id: string; title: string; tasks: Task[] };

const STATUS_ICON = { TODO: Circle, IN_PROGRESS: CircleDot, DONE: CheckCircle2 } as const;

/**
 * Workspace research plan (WIREFRAMES §4.8): stages → tasks, inline edit.
 * Click a task to cycle TODO → In progress → Done. Editors+ can add/delete;
 * viewers see a read-only board (`canEdit=false` hides the controls).
 */
export function WorkspacePlan({
  collaborationId,
  initialStages,
  canEdit,
}: {
  collaborationId: string;
  initialStages: Stage[];
  canEdit: boolean;
}) {
  const t = useTranslations("plan");
  const [stages, setStages] = useState<Stage[]>(initialStages);
  const [newStage, setNewStage] = useState("");
  const [, startTransition] = useTransition();

  const onAddStage = () => {
    const title = newStage.trim();
    if (!title) return;
    setNewStage("");
    startTransition(async () => {
      const res = await addStage(collaborationId, title);
      if (!res.ok) { toast.error(res.error); return; }
      setStages((s) => [...s, { id: res.stageId, title, tasks: [] }]);
    });
  };

  const onAddTask = (stageId: string, title: string, reset: () => void) => {
    if (!title.trim()) return;
    reset();
    startTransition(async () => {
      const res = await addTask(collaborationId, stageId, title.trim());
      if (!res.ok) { toast.error(res.error); return; }
      setStages((s) =>
        s.map((st) => (st.id === stageId ? { ...st, tasks: [...st.tasks, { id: res.taskId, title: title.trim(), status: "TODO" }] } : st))
      );
    });
  };

  const onCycle = (stageId: string, task: Task) => {
    if (!canEdit) return;
    startTransition(async () => {
      const res = await cycleTaskStatus(collaborationId, task.id);
      if (!res.ok) { toast.error(res.error); return; }
      setStages((s) =>
        s.map((st) => (st.id === stageId ? { ...st, tasks: st.tasks.map((tk) => (tk.id === task.id ? { ...tk, status: res.status } : tk)) } : st))
      );
    });
  };

  const onDeleteTask = (stageId: string, taskId: string) => {
    startTransition(async () => {
      const res = await deleteTask(collaborationId, taskId);
      if (!res.ok) { toast.error(res.error); return; }
      setStages((s) => s.map((st) => (st.id === stageId ? { ...st, tasks: st.tasks.filter((tk) => tk.id !== taskId) } : st)));
    });
  };

  const onDeleteStage = (stageId: string) => {
    startTransition(async () => {
      const res = await deleteStage(collaborationId, stageId);
      if (!res.ok) { toast.error(res.error); return; }
      setStages((s) => s.filter((st) => st.id !== stageId));
    });
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Within-stage drag-reorder. The dragged task id is `active`, dropped over
  // `over`; we reorder that stage's tasks and persist the new order.
  const onDragEnd = (stageId: string) => (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    // Compute the reordered task list for the affected stage outside of setState,
    // so we never call startTransition during render.
    const stage = stages.find((st) => st.id === stageId);
    if (!stage) return;
    const ids = stage.tasks.map((tk) => tk.id);
    const from = ids.indexOf(active.id as string);
    const to = ids.indexOf(over.id as string);
    if (from < 0 || to < 0) return;
    const nextTasks = [...stage.tasks];
    const [moved] = nextTasks.splice(from, 1);
    nextTasks.splice(to, 0, moved);

    setStages((s) => s.map((st) => (st.id === stageId ? { ...st, tasks: nextTasks } : st)));
    startTransition(async () => {
      const res = await reorderTasks(collaborationId, stageId, nextTasks.map((tk) => tk.id));
      if (!res.ok) toast.error(res.error);
    });
  };

  if (stages.length === 0 && !canEdit) {
    return <p className="p-6 text-center text-sm text-muted-foreground">{t("empty")}</p>;
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stages.map((stage) => {
          const done = stage.tasks.length > 0 && stage.tasks.every((tk) => tk.status === "DONE");
          return (
            <div key={stage.id} className="rounded-lg border bg-muted/20 p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <h4 className={cn("font-heading text-sm font-semibold", done && "text-ccm-sea")}>
                  {stage.title}
                  {done && <CheckCircle2 className="ms-1 inline size-3.5" aria-label={t("stageComplete")} />}
                </h4>
                {canEdit && (
                  <button onClick={() => onDeleteStage(stage.id)} aria-label={t("deleteStage")} className="text-muted-foreground hover:text-destructive">
                    <X className="size-3.5" />
                  </button>
                )}
              </div>
              <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={onDragEnd(stage.id)}>
                <SortableContext items={stage.tasks.map((tk) => tk.id)} strategy={verticalListSortingStrategy}>
                  <ul className="space-y-1">
                    {stage.tasks.map((task) => (
                      <SortableTask
                        key={task.id}
                        task={task}
                        canEdit={canEdit}
                        onCycle={() => onCycle(stage.id, task)}
                        onDelete={() => onDeleteTask(stage.id, task.id)}
                        labels={{ cycle: t("cycleStatus"), del: t("deleteTask"), drag: t("dragTask") }}
                      />
                    ))}
                  </ul>
                </SortableContext>
              </DndContext>
              {canEdit && <AddTaskRow onAdd={(title, reset) => onAddTask(stage.id, title, reset)} placeholder={t("addTask")} />}
            </div>
          );
        })}
      </div>

      {canEdit && (
        <div className="flex max-w-xs gap-2">
          <Input value={newStage} onChange={(e) => setNewStage(e.target.value)} placeholder={t("addStage")} onKeyDown={(e) => e.key === "Enter" && onAddStage()} />
          <Button onClick={onAddStage} size="icon" variant="outline" aria-label={t("addStage")}>
            <Plus className="size-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

function SortableTask({
  task,
  canEdit,
  onCycle,
  onDelete,
  labels,
}: {
  task: Task;
  canEdit: boolean;
  onCycle: () => void;
  onDelete: () => void;
  labels: { cycle: string; del: string; drag: string };
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    disabled: !canEdit,
  });
  const Icon = STATUS_ICON[task.status];
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "group flex items-center gap-2 rounded-md bg-background px-2 py-1.5 text-sm",
        isDragging && "opacity-60 shadow"
      )}
    >
      {canEdit && (
        <button
          {...attributes}
          {...listeners}
          aria-label={labels.drag}
          className="cursor-grab text-muted-foreground/50 hover:text-muted-foreground touch-none"
        >
          <GripVertical className="size-3.5" />
        </button>
      )}
      <button
        onClick={onCycle}
        disabled={!canEdit}
        aria-label={labels.cycle}
        className={cn(task.status === "DONE" ? "text-ccm-sea" : "text-muted-foreground", canEdit && "hover:text-ccm-sea")}
      >
        <Icon className="size-4" />
      </button>
      <span className={cn("min-w-0 flex-1 truncate", task.status === "DONE" && "text-muted-foreground line-through")}>
        {task.title}
      </span>
      {canEdit && (
        <button onClick={onDelete} aria-label={labels.del} className="opacity-0 transition-opacity group-hover:opacity-100 text-muted-foreground hover:text-destructive">
          <X className="size-3.5" />
        </button>
      )}
    </li>
  );
}

function AddTaskRow({ onAdd, placeholder }: { onAdd: (title: string, reset: () => void) => void; placeholder: string }) {
  const [val, setVal] = useState("");
  const reset = () => setVal("");
  return (
    <div className="mt-2 flex gap-1">
      <Input
        value={val}
        onChange={(e) => setVal(e.target.value)}
        placeholder={placeholder}
        className="h-8 text-sm"
        onKeyDown={(e) => e.key === "Enter" && onAdd(val, reset)}
      />
    </div>
  );
}
