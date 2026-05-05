"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/retroui/Button";
import { Textarea } from "@/components/retroui/Textarea";
import { API_ROUTES } from "@/lib/api-routes";

interface TaskCompleteFormProps {
  taskId: string;
}

export function TaskCompleteForm({ taskId }: TaskCompleteFormProps) {
  const router = useRouter();
  const [completionEvidence, setCompletionEvidence] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <div id="complete" className="scroll-mt-32 space-y-3">
      <Textarea
        value={completionEvidence}
        onChange={(event) => setCompletionEvidence(event.target.value)}
        placeholder="Link, screenshot, write-up, or brief proof of completion."
      />
      <div className="flex flex-wrap gap-3">
        <Button
          className="font-black uppercase"
          disabled={isPending}
          onClick={() => {
            setError(null);
            startTransition(() => {
              void fetch(API_ROUTES.tasks.complete(taskId), {
                body: JSON.stringify({ completionEvidence }),
                headers: { "Content-Type": "application/json" },
                method: "POST",
              })
                .then(async (response) => {
                  const payload = (await response.json().catch(() => null)) as {
                    error?: string;
                  } | null;

                  if (!response.ok) {
                    throw new Error(
                      payload?.error ?? "Unable to submit completion.",
                    );
                  }

                  setCompletionEvidence("");
                  router.refresh();
                })
                .catch((submitError) => {
                  setError(
                    submitError instanceof Error
                      ? submitError.message
                      : "Unable to submit completion.",
                  );
                });
            });
          }}
        >
          {isPending ? "Submitting..." : "Submit Proof"}
        </Button>
      </div>
      {error ? (
        <p className="text-xs font-bold uppercase tracking-wide text-brutal-red">
          {error}
        </p>
      ) : null}
    </div>
  );
}
