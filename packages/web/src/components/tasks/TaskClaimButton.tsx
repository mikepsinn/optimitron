"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/retroui/Button";
import { API_ROUTES } from "@/lib/api-routes";
import { getTaskPath } from "@/lib/routes";

interface TaskClaimButtonProps {
  canClaim: boolean;
  signedIn: boolean;
  signInHref: string;
  taskId: string;
  viewerHasClaim: boolean;
}

export function TaskClaimButton({
  canClaim,
  signedIn,
  signInHref,
  taskId,
  viewerHasClaim,
}: TaskClaimButtonProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (viewerHasClaim) {
    return (
      <Button asChild className="font-black uppercase" variant="outline">
        <Link href={getTaskPath(taskId)}>View Claim</Link>
      </Button>
    );
  }

  if (!signedIn) {
    return (
      <Button asChild className="font-black uppercase">
        <Link href={signInHref}>Sign In To Claim</Link>
      </Button>
    );
  }

  return (
    <div className="space-y-2">
      <Button
        className="font-black uppercase"
        disabled={!canClaim || isPending}
        onClick={() => {
          setError(null);
          startTransition(() => {
            void fetch(API_ROUTES.tasks.claim(taskId), {
              method: "POST",
            })
              .then(async (response) => {
                const payload = (await response.json().catch(() => null)) as
                  | { error?: string }
                  | null;

                if (!response.ok) {
                  throw new Error(payload?.error ?? "Unable to claim task.");
                }

                router.refresh();
              })
              .catch((claimError) => {
                setError(
                  claimError instanceof Error ? claimError.message : "Unable to claim task.",
                );
              });
          });
        }}
      >
        {isPending ? "Claiming..." : canClaim ? "Claim Task" : "Unavailable"}
      </Button>
      {error ? (
        <p className="text-xs font-bold uppercase tracking-wide text-brutal-red">
          {error}
        </p>
      ) : null}
    </div>
  );
}
