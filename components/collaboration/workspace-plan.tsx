"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Plus, Circle, CircleDot, CheckCircle2, X, GripVertical, ListTodo } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SectionHeader } from "@/components/ui/section-header";
import { cn } from "@/lib/utils";
import { WorkspaceEmptyState } from "./workspace-empty-state";
import { InlineText } from "@/components/ui/inline-text";
import {
  addStage,
  addTask,
  cycleTaskStatus,
  deleteTask,
  renameStage,
  renameTask,
  deleteStage,
  reorderTasks,
  assignTask,
  setTaskDescription,
} from "@/lib/actions/plans";

type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE";
type Task = { id: string; title: string; description: string | null; status: TaskStatus; assigneeId: string | null };
type Stage = { id: string; title: string; tasks: Task[] };
type Member = { userId: string; name: string };

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
  members = [],
}: {
  collaborationId: string;
  initialStages: Stage[];
  canEdit: boolean;
  members?: Member[];
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
        s.map((st) => (st.id === stageId ? { ...st, tasks: [...st.tasks, { id: res.taskId, title: title.trim(), description: null, status: "TODO", assigneeId: null }] } : st))
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

  // Assign (or clear) a member on a task. Optimistic; reverts on failure.
  const onAssign = (stageId: string, taskId: string, assigneeId: string | null) => {
    if (!canEdit) return;
    const prev = stages;
    setStages((s) =>
      s.map((st) => (st.id === stageId ? { ...st, tasks: st.tasks.map((tk) => (tk.id === taskId ? { ...tk, assigneeId } : tk)) } : st))
    );
    startTransition(async () => {
      const res = await assignTask(collaborationId, taskId, assigneeId);
      if (!res.ok) { setStages(prev); toast.error(res.error); }
    });
  };

  const onDeleteTask = (stageId: string, taskId: string) => {
    startTransition(async () => {
      const res = await deleteTask(collaborationId, taskId);
      if (!res.ok) { toast.error(res.error); return; }
      setStages((s) => s.map((st) => (st.id === stageId ? { ...st, tasks: st.tasks.filter((tk) => tk.id !== taskId) } : st)));
    });
  };

  const onRenameStage = async (stageId: string, title: string) => {
    const res = await renameStage(collaborationId, stageId, title);
    if (!res.ok) toast.error(res.error);
    else setStages((prev) => prev.map((s) => (s.id === stageId ? { ...s, title } : s)));
  };

  const onRenameTask = async (stageId: string, taskId: string, title: string) => {
    const res = await renameTask(collaborationId, taskId, title);
    if (!res.ok) toast.error(res.error);
    else
      setStages((prev) =>
        prev.map((s) =>
          s.id === stageId ? { ...s, tasks: s.tasks.map((tk) => (tk.id === taskId ? { ...tk, title } : tk)) } : s
        )
      );
  };

  // Notes on a task; @username mentions in the text notify those members.
  const onDescribeTask = async (stageId: string, taskId: string, description: string) => {
    const res = await setTaskDescription(collaborationId, taskId, description);
    if (!res.ok) toast.error(res.error);
    else
      setStages((prev) =>
        prev.map((s) =>
          s.id === stageId
            ? { ...s, tasks: s.tasks.map((tk) => (tk.id === taskId ? { ...tk, description: description.trim() || null } : tk)) }
            : s
        )
      );
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
    return (
      <div className="space-y-4">
        <SectionHeader title={t("heading")} subtitle={t("subtitle")} />
        <WorkspaceEmptyState icon={ListTodo} title={t("emptyTitle")} body={t("emptyBody")} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <SectionHeader title={t("heading")} subtitle={t("subtitle")} />

      {stages.length === 0 && canEdit && (
        <WorkspaceEmptyState icon={ListTodo} title={t("emptyTitle")} body={t("emptyBody")} />
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stages.map((stage) => {
          const done = stage.tasks.length > 0 && stage.tasks.every((tk) => tk.status === "DONE");
          return (
            <div key={stage.id} className="rounded-lg border bg-muted/20 p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="flex min-w-0 items-center gap-1">
                  <InlineText
                    value={stage.title}
                    canEdit={canEdit}
                    as="h3"
                    placeholder={t("addStage")}
                    className={cn("font-heading text-sm font-semibold", done && "text-ccm-sea")}
                    onCommit={(next) => onRenameStage(stage.id, next)}
                  />
                  {done && <CheckCircle2 className="size-3.5 flex-none text-ccm-sea" aria-label={t("stageComplete")} />}
                </span>
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
                        members={members}
                        onCycle={() => onCycle(stage.id, task)}
                        onDelete={() => onDeleteTask(stage.id, task.id)}
                        onAssign={(assigneeId) => onAssign(stage.id, task.id, assigneeId)}
                        onRename={(title) => onRenameTask(stage.id, task.id, title)}
                        onDescribe={(desc) => onDescribeTask(stage.id, task.id, desc)}
                        labels={{
                          cycle: t("cycleStatus"),
                          del: t("deleteTask"),
                          drag: t("dragTask"),
                          assign: t("assign"),
                          unassigned: t("unassigned"),
                          addNotes: t("addNotes"),
                        }}
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
  members,
  onCycle,
  onDelete,
  onAssign,
  onRename,
  onDescribe,
  labels,
}: {
  task: Task;
  canEdit: boolean;
  members: Member[];
  onCycle: () => void;
  onDelete: () => void;
  onAssign: (assigneeId: string | null) => void;
  onRename: (title: string) => void | Promise<void>;
  onDescribe: (description: string) => void | Promise<void>;
  labels: { cycle: string; del: string; drag: string; assign: string; unassigned: string; addNotes: string };
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
      <span className="min-w-0 flex-1">
        <InlineText
          value={task.title}
          canEdit={canEdit}
          as="span"
          onCommit={onRename}
          className={cn("block truncate", task.status === "DONE" && "text-muted-foreground line-through")}
        />
        {(canEdit || task.description) && (
          <InlineText
            value={task.description ?? ""}
            canEdit={canEdit}
            as="p"
            multiline
            placeholder={labels.addNotes}
            onCommit={onDescribe}
            className="mt-0.5 whitespace-pre-wrap text-xs leading-snug text-muted-foreground [&:not(:hover)]:line-clamp-3"
            inputClassName="text-xs"
          />
        )}
      </span>
      {canEdit ? (
        <Select
          value={task.assigneeId ?? "none"}
          onValueChange={(v) => onAssign(v === "none" ? null : v)}
        >
          <SelectTrigger className="h-7 w-28 shrink-0 text-xs" aria-label={labels.assign}>
            <SelectValue placeholder={labels.unassigned} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">{labels.unassigned}</SelectItem>
            {members.map((m) => (
              <SelectItem key={m.userId} value={m.userId}>
                <bdi>{m.name}</bdi>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        task.assigneeId && (
          <span className="shrink-0 truncate text-xs text-muted-foreground">
            <bdi>{members.find((m) => m.userId === task.assigneeId)?.name ?? ""}</bdi>
          </span>
        )
      )}
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
