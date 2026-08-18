"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/retroui/Button";
import { Textarea } from "@/components/retroui/Textarea";
import { API_ROUTES } from "@/lib/api-routes";

interface TaskCompleteFormProps {
  canComplete?: boolean;
  canRelease?: boolean;
  taskId: string;
}

export function TaskCompleteForm({
  canComplete = true,
  canRelease = false,
  taskId,
}: TaskCompleteFormProps) {
  const router = useRouter();
  const [completionEvidence, setCompletionEvidence] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function releaseTask() {
    if (!window.confirm("Release this task for someone else?")) return;
    setError(null);
    setIsPending(true);
    try {
      const response = await fetch(API_ROUTES.tasks.release(taskId), {
        method: "POST",
      });
      const payload = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;
      if (!response.ok) {
        throw new Error(payload?.error ?? "Unable to release task.");
      }
      router.refresh();
    } catch (releaseError) {
      setError(
        releaseError instanceof Error
          ? releaseError.message
          : "Unable to release task.",
      );
    } finally {
      setIsPending(false);
    }
  }

  async function completeTask() {
    setError(null);
    const evidence = completionEvidence.trim();
    if (!evidence) {
      setError("Add a completion note before marking this task done.");
      return;
    }
    setIsPending(true);
    try {
      const response = await fetch(API_ROUTES.tasks.complete(taskId), {
        body: JSON.stringify({ completionEvidence: evidence }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const payload = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;
      if (!response.ok) {
        throw new Error(payload?.error ?? "Unable to submit completion.");
      }
      setCompletionEvidence("");
      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to submit completion.",
      );
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div id="complete" className="scroll-mt-32 space-y-3">
      {canComplete ? (
        <label className="block space-y-1">
          <span className="text-xs font-black uppercase tracking-[0.12em]">
            Completion note (required)
          </span>
          <Textarea
            aria-required="true"
            onChange={(event) => {
              setCompletionEvidence(event.target.value);
              setError(null);
            }}
            placeholder="What did you finish? Add a link or brief proof."
            required
            value={completionEvidence}
          />
        </label>
      ) : null}
      <div className="flex flex-wrap gap-3">
        {canComplete ? (
          <Button
            className="font-black uppercase"
            disabled={isPending}
            onClick={() => void completeTask()}
          >
            {isPending ? "Saving..." : "Mark Done"}
          </Button>
        ) : null}
        {canRelease ? (
          <Button
            className="border-foreground bg-background font-black uppercase text-foreground shadow-none hover:translate-x-0 hover:translate-y-0 hover:bg-foreground hover:text-background"
            disabled={isPending}
            onClick={() => void releaseTask()}
            type="button"
            variant="outline"
          >
            Release Task
          </Button>
        ) : null}
      </div>
      {error ? (
        <p className="text-xs font-bold uppercase tracking-wide text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
