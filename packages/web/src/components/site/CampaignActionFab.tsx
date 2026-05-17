"use client";

import { FormEvent, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Check, Clipboard, Plus, Share2, X } from "lucide-react";
import { Button } from "@/components/retroui/Button";
import { Dialog } from "@/components/retroui/Dialog";
import { Input } from "@/components/retroui/Input";
import { Textarea } from "@/components/retroui/Textarea";
import { buildUserReferralUrl } from "@/lib/url";
import { cn } from "@/lib/utils";

type TaskMode = "self" | "person";

const HIDDEN_PATH_PREFIXES = [
  "/api",
  "/auth",
  "/survey",
  "/vote",
] as const;

function shouldHideForPath(pathname: string | null) {
  if (!pathname) return true;
  return HIDDEN_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

async function copyToClipboard(text: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
}

async function readApiError(response: Response) {
  const body = await response.json().catch(() => null);
  return typeof body?.error === "string" ? body.error : "Request failed.";
}

export function CampaignActionFab() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [taskOpen, setTaskOpen] = useState(false);
  const [taskMode, setTaskMode] = useState<TaskMode>("self");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignee, setAssignee] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const referralUrl = useMemo(
    () => buildUserReferralUrl(session?.user),
    [session?.user],
  );

  if (status !== "authenticated" || shouldHideForPath(pathname)) {
    return null;
  }

  async function copyShareLink() {
    await copyToClipboard(referralUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

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
    if (taskMode === "person" && !assignee.trim()) {
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
          assigneePersonId:
            taskMode === "self" ? session?.user.personId : undefined,
          assigneePersonIdentifier:
            taskMode === "person" ? assignee.trim() : undefined,
          description: description.trim(),
          isPublic: taskMode === "person",
          title: trimmedTitle,
        }),
      });

      if (!response.ok) {
        throw new Error(await readApiError(response));
      }

      const body = (await response.json()) as { data?: { id?: string } };
      const taskId = body.data?.id;
      setTaskOpen(false);
      resetTaskForm();
      if (taskId) {
        router.push(`/tasks/${taskId}`);
      } else {
        router.push("/tasks");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create task.");
    } finally {
      setCreating(false);
    }
  }

  const actionButtonClass =
    "group min-h-10 justify-start gap-2 rounded-full bg-background/95 py-1.5 pl-1.5 pr-3 text-xs font-black uppercase tracking-[0.08em] text-foreground shadow-[0_8px_24px_rgba(0,0,0,0.14)] ring-1 ring-foreground/10 hover:bg-foreground hover:text-background focus-visible:ring-2 focus-visible:ring-foreground";
  const actionIconClass =
    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-foreground text-background group-hover:bg-background group-hover:text-foreground";
  const fieldClass =
    "border border-foreground bg-background font-bold shadow-none focus:shadow-none";

  return (
    <>
      {!taskOpen ? (
        <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-2 sm:bottom-6 sm:right-6">
          {open ? (
            <div className="flex flex-col items-end gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => void copyShareLink()}
                className={actionButtonClass}
              >
                <span className={actionIconClass}>
                  {copied ? (
                    <Check className="h-4 w-4 stroke-[2.5px]" />
                  ) : (
                    <Share2 className="h-4 w-4 stroke-[2.5px]" />
                  )}
                </span>
                {copied ? "Copied" : "Copy share link"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setTaskOpen(true);
                  setOpen(false);
                }}
                className={actionButtonClass}
              >
                <span className={actionIconClass}>
                  <Clipboard className="h-4 w-4 stroke-[2.5px]" />
                </span>
                Create task
              </Button>
            </div>
          ) : null}
          <Button
            type="button"
            variant="ghost"
            aria-expanded={open}
            aria-label={
              open ? "Close campaign actions" : "Open campaign actions"
            }
            onClick={() => setOpen((value) => !value)}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-foreground p-0 text-background shadow-[0_10px_28px_rgba(0,0,0,0.22)] ring-1 ring-background/80 hover:bg-background hover:text-foreground focus-visible:ring-2 focus-visible:ring-foreground"
          >
            {open ? (
              <X className="h-6 w-6 stroke-[2.5px]" />
            ) : (
              <Plus className="h-6 w-6 stroke-[2.5px]" />
            )}
          </Button>
        </div>
      ) : null}

      <Dialog
        open={taskOpen}
        onOpenChange={(nextOpen) => {
          setTaskOpen(nextOpen);
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
                  placeholder="Add the useful context."
                  rows={5}
                  value={description}
                />
              </label>

              {taskMode === "person" ? (
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
                onClick={() => setTaskOpen(false)}
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
    </>
  );
}
