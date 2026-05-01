"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { ROUTES } from "@/lib/routes";

interface TaskDeleteButtonProps {
  taskId: string;
  taskTitle: string;
}

export function TaskDeleteButton({ taskId, taskTitle }: TaskDeleteButtonProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    if (busy) return;
    const confirmed = window.confirm(
      `Delete "${taskTitle}"? This can't be undone from the UI.`,
    );
    if (!confirmed) return;

    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(body?.error ?? "Failed to delete task.");
      }
      router.push(ROUTES.tasks);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete task.");
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={() => void handleDelete()}
        disabled={busy}
        className="inline-flex w-fit items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-muted-foreground hover:text-brutal-red disabled:opacity-50"
      >
        <Trash2 className="h-3.5 w-3.5" />
        {busy ? "Deleting..." : "Delete"}
      </button>
      {error ? (
        <p className="text-xs font-bold text-brutal-red">{error}</p>
      ) : null}
    </div>
  );
}
