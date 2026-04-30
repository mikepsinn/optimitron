"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/retroui/Button";
import { Textarea } from "@/components/retroui/Textarea";
import { API_ROUTES } from "@/lib/api-routes";

interface TaskVerifyFormProps {
  claimId?: string | null;
  defaultEvidence?: string | null;
  helperText: string;
  submitLabel: string;
  taskId: string;
}

export function TaskVerifyForm({
  claimId,
  defaultEvidence,
  helperText,
  submitLabel,
  taskId,
}: TaskVerifyFormProps) {
  const router = useRouter();
  const [text, setText] = useState(defaultEvidence ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="space-y-3">
      <p className="text-sm font-bold text-muted-foreground">{helperText}</p>
      <Textarea
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder="Verification note or public evidence."
      />
      <Button
        className="font-black uppercase"
        disabled={isPending}
        onClick={() => {
          setError(null);
          startTransition(() => {
            void fetch(API_ROUTES.tasks.verify(taskId), {
              body: JSON.stringify(
                claimId
                  ? { claimId, verificationNote: text }
                  : { completionEvidence: text },
              ),
              headers: { "Content-Type": "application/json" },
              method: "POST",
            })
              .then(async (response) => {
                const payload = (await response.json().catch(() => null)) as
                  | { error?: string }
                  | null;

                if (!response.ok) {
                  throw new Error(payload?.error ?? "Unable to verify task.");
                }

                router.refresh();
              })
              .catch((verifyError) => {
                setError(
                  verifyError instanceof Error ? verifyError.message : "Unable to verify task.",
                );
              });
          });
        }}
      >
        {isPending ? "Saving..." : submitLabel}
      </Button>
      {error ? (
        <p className="text-xs font-bold uppercase tracking-wide text-brutal-red">
          {error}
        </p>
      ) : null}
    </div>
  );
}
