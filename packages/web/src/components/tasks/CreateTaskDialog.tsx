"use client";

import { FormEvent, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { X } from "lucide-react";
import { Button } from "@/components/retroui/Button";
import { Dialog } from "@/components/retroui/Dialog";
import { Input } from "@/components/retroui/Input";
import { Textarea } from "@/components/retroui/Textarea";
import { getSignInPath, ROUTES } from "@/lib/routes";
import { cn } from "@/lib/utils";

type TaskMode = "self" | "person";

interface FixedPersonAssignee {
  id: string;
  label: string;
}

interface CreateTaskDialogProps {
  callbackUrl?: string;
  fixedAssigneePerson?: FixedPersonAssignee;
  onOpenChange: (open: boolean) => void;
  open: boolean;
}

async function readApiError(response: Response) {
  const body = await response.json().catch(() => null);
  return typeof body?.error === "string" ? body.error : "Request failed.";
}

export function CreateTaskDialog({
  callbackUrl,
  fixedAssigneePerson,
  onOpenChange,
  open,
}: CreateTaskDialogProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const [taskMode, setTaskMode] = useState<TaskMode>("self");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignee, setAssignee] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fieldClass =
    "border border-foreground bg-background font-bold shadow-none focus:shadow-none";

  function resetTaskForm() {
    setTaskMode("self");
    setTitle("");
    setDescription("");
    setAssignee("");
    setError(null);
  }

  async function createTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError("Title is required.");
      return;
    }
    if (!fixedAssigneePerson && taskMode === "person" && !assignee.trim()) {
      setError("Person handle or URL is required.");
      return;
    }

    try {
      setCreating(true);
      setError(null);
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assigneePersonId: fixedAssigneePerson
            ? fixedAssigneePerson.id
            : taskMode === "self"
              ? session?.user.personId
              : undefined,
          assigneePersonIdentifier:
            !fixedAssigneePerson && taskMode === "person"
              ? assignee.trim()
              : undefined,
          description: description.trim(),
          isPublic: fixedAssigneePerson ? true : taskMode === "person",
          title: trimmedTitle,
        }),
      });

      if (response.status === 401) {
        router.push(getSignInPath(callbackUrl ?? pathname ?? ROUTES.tasks));
        return;
      }

      if (!response.ok) {
        throw new Error(await readApiError(response));
      }

      const body = (await response.json()) as { data?: { id?: string } };
      const taskId = body.data?.id;
      onOpenChange(false);
      resetTaskForm();
      if (taskId) {
        router.push(`/tasks/${taskId}`);
      } else {
        router.push(ROUTES.tasks);
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create task.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen);
        if (!nextOpen) resetTaskForm();
      }}
    >
      <Dialog.Content
        title="Create task"
        size="screen"
        className="max-h-[min(42rem,calc(100vh-2rem))] w-[min(34rem,calc(100vw-2rem))] overflow-y-auto border-2 border-foreground bg-background text-foreground shadow-none"
      >
        <form onSubmit={(event) => void createTask(event)}>
          <Dialog.Header
            asChild
            className="border-b-2 border-foreground bg-background px-4 py-3 text-foreground"
          >
            <div className="flex w-full items-center justify-between gap-4">
              <h2 className="text-xl font-black uppercase leading-tight">
                Create task
              </h2>
              <Dialog.Close className="flex h-9 w-9 items-center justify-center border border-foreground bg-background text-foreground hover:bg-foreground hover:text-background">
                <X className="h-4 w-4 stroke-[2.5px]" />
                <span className="sr-only">Close</span>
              </Dialog.Close>
            </div>
          </Dialog.Header>

          <div className="space-y-4 px-4 py-4">
            {fixedAssigneePerson ? (
              <div className="border border-foreground px-3 py-2">
                <p className="text-xs font-black uppercase tracking-[0.12em] text-muted-foreground">
                  Assignee
                </p>
                <p className="mt-1 text-sm font-black text-foreground">
                  {fixedAssigneePerson.label}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 border border-foreground">
                {(["self", "person"] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => {
                      setTaskMode(mode);
                      setError(null);
                    }}
                    className={cn(
                      "min-h-11 px-3 text-sm font-black uppercase transition-colors",
                      mode === "person" ? "border-l border-foreground" : "",
                      taskMode === mode
                        ? "bg-foreground text-background"
                        : "bg-background text-foreground hover:bg-muted",
                    )}
                  >
                    {mode === "self" ? "For myself" : "For someone"}
                  </button>
                ))}
              </div>
            )}

            <label className="block space-y-1">
              <span className="text-xs font-black uppercase tracking-[0.12em]">
                Title
              </span>
              <Input
                className={fieldClass}
                maxLength={120}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="What needs doing?"
                value={title}
              />
            </label>

            <label className="block space-y-1">
              <span className="text-xs font-black uppercase tracking-[0.12em]">
                Description
              </span>
              <Textarea
                className={fieldClass}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Add useful context."
                rows={5}
                value={description}
              />
            </label>

            {!fixedAssigneePerson && taskMode === "person" ? (
              <label className="block space-y-1">
                <span className="text-xs font-black uppercase tracking-[0.12em]">
                  Person handle or URL
                </span>
                <Input
                  className={fieldClass}
                  onChange={(event) => setAssignee(event.target.value)}
                  placeholder="@wishonia or /people/wishonia"
                  value={assignee}
                />
              </label>
            ) : null}

            {error ? (
              <p className="border border-destructive px-3 py-2 text-sm font-bold text-destructive">
                {error}
              </p>
            ) : null}
          </div>

          <Dialog.Footer
            position="static"
            className="border-t-2 border-foreground bg-background px-4 py-3"
          >
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetTaskForm();
                onOpenChange(false);
              }}
              className="min-h-11 border border-foreground bg-background px-4 text-sm font-black uppercase text-foreground shadow-none hover:translate-x-0 hover:translate-y-0"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={creating}
              className="min-h-11 border border-foreground bg-foreground px-4 text-sm font-black uppercase text-background shadow-none hover:translate-x-0 hover:translate-y-0 hover:bg-background hover:text-foreground disabled:opacity-60"
            >
              {creating ? "Creating" : "Create task"}
            </Button>
          </Dialog.Footer>
        </form>
      </Dialog.Content>
    </Dialog>
  );
}
