"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/retroui/Button";
import { Input } from "@/components/retroui/Input";
import { Textarea } from "@/components/retroui/Textarea";
import { CreateTaskDialog } from "./CreateTaskDialog";

interface TaskManagementControlsProps {
  canAddStep: boolean;
  canArchive: boolean;
  description: string;
  dueAt: string | null;
  estimatedEffortHours: number | null;
  taskId: string;
  title: string;
}

const fieldClass =
  "border border-foreground bg-background font-bold shadow-none focus:shadow-none";
const stepTaskModes: "self"[] = ["self"];

async function readApiError(response: Response) {
  const payload = (await response.json().catch(() => null)) as {
    error?: string;
  } | null;
  return payload?.error ?? "Unable to update task.";
}

function toDateInputValue(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString().slice(0, 10) : "";
}

export function TaskManagementControls({
  canAddStep,
  canArchive,
  description: initialDescription,
  dueAt: initialDueAt,
  estimatedEffortHours: initialEstimatedEffortHours,
  taskId,
  title: initialTitle,
}: TaskManagementControlsProps) {
  const router = useRouter();
  const [stepOpen, setStepOpen] = useState(false);
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [dueAt, setDueAt] = useState(toDateInputValue(initialDueAt));
  const [effortHours, setEffortHours] = useState(
    initialEstimatedEffortHours?.toString() ?? "",
  );
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isPending, setIsPending] = useState(false);

  async function updateTask(payload: Record<string, unknown>) {
    setError(null);
    setSaved(false);
    setIsPending(true);
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        body: JSON.stringify(payload),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      });
      if (!response.ok) throw new Error(await readApiError(response));
      setSaved(true);
      router.refresh();
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : "Unable to update task.",
      );
    } finally {
      setIsPending(false);
    }
  }

  function saveTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const effort = effortHours.trim();
    void updateTask({
      description,
      dueAt: dueAt ? `${dueAt}T00:00:00.000Z` : null,
      estimatedEffortHours: effort ? Number(effort) : null,
      title,
    });
  }

  return (
    <div className="mt-5 flex flex-wrap items-start gap-2">
      {canAddStep ? (
        <Button
          className="border-foreground bg-background font-black uppercase text-foreground shadow-none hover:translate-x-0 hover:translate-y-0 hover:bg-foreground hover:text-background"
          onClick={() => setStepOpen(true)}
          type="button"
          variant="outline"
        >
          Add subtask
        </Button>
      ) : null}

      <details
        className="w-full border border-foreground bg-background sm:max-w-2xl"
        data-task-management
      >
        <summary className="cursor-pointer px-4 py-2 text-sm font-black uppercase">
          Manage
        </summary>
        <form
          className="space-y-3 border-t border-foreground p-4"
          onSubmit={saveTask}
        >
          <label className="block space-y-1">
            <span className="text-xs font-black uppercase">Title</span>
            <Input
              className={fieldClass}
              disabled={isPending}
              onChange={(event) => {
                setTitle(event.target.value);
                setSaved(false);
              }}
              required
              value={title}
            />
          </label>
          <label className="block space-y-1">
            <span className="text-xs font-black uppercase">Description</span>
            <Textarea
              className={fieldClass}
              disabled={isPending}
              onChange={(event) => {
                setDescription(event.target.value);
                setSaved(false);
              }}
              rows={5}
              value={description}
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block space-y-1">
              <span className="text-xs font-black uppercase">Due date</span>
              <Input
                className={fieldClass}
                disabled={isPending}
                onChange={(event) => {
                  setDueAt(event.target.value);
                  setSaved(false);
                }}
                type="date"
                value={dueAt}
              />
            </label>
            <label className="block space-y-1">
              <span className="text-xs font-black uppercase">
                Estimated hours
              </span>
              <Input
                className={fieldClass}
                disabled={isPending}
                min="0"
                onChange={(event) => {
                  setEffortHours(event.target.value);
                  setSaved(false);
                }}
                step="0.25"
                type="number"
                value={effortHours}
              />
            </label>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              className="font-black uppercase"
              disabled={isPending}
              type="submit"
            >
              {isPending ? "Saving..." : "Save"}
            </Button>
            {canArchive ? (
              <Button
                className="border-foreground bg-background font-black uppercase text-foreground shadow-none hover:translate-x-0 hover:translate-y-0 hover:bg-foreground hover:text-background"
                disabled={isPending}
                onClick={() => {
                  if (
                    window.confirm(
                      "Archive this task? It will leave the active queue without marking the work done.",
                    )
                  ) {
                    void updateTask({ status: "STALE" });
                  }
                }}
                type="button"
                variant="outline"
              >
                Archive
              </Button>
            ) : null}
          </div>
          {saved ? <p className="text-sm font-bold">Saved.</p> : null}
          {error ? (
            <p className="border border-destructive p-3 text-sm font-bold text-destructive">
              {error}
            </p>
          ) : null}
        </form>
      </details>

      {canAddStep ? (
        <CreateTaskDialog
          allowedTaskModes={stepTaskModes}
          callbackUrl={`/tasks/${taskId}`}
          dialogTitle="Add subtask"
          onOpenChange={setStepOpen}
          open={stepOpen}
          parentTaskId={taskId}
          submitLabel="Add subtask"
        />
      ) : null}
    </div>
  );
}
