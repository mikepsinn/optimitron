"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { AuthForm } from "@/components/auth/AuthForm";
import { Button } from "@/components/retroui/Button";
import { Input } from "@/components/retroui/Input";
import { Label } from "@/components/retroui/Label";
import { postRepresentedPersonDraft, syncPendingRepresentedPeople } from "@/lib/represented-person-sync";
import { ROUTES } from "@/lib/routes";
import { storage, type PendingRepresentedPersonDraft } from "@/lib/storage";
import { TREATY_REFERENDUM_SLUG } from "@/lib/treaty";
import { cn } from "@/lib/utils";

type FormMode = "idle" | "auth" | "saving" | "saved" | "syncing" | "error";

function createDraftId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `represented-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

interface RepresentedPersonConversionFormProps {
  className?: string;
  referendumSlug?: string;
}

export function RepresentedPersonConversionForm({
  className,
  referendumSlug = TREATY_REFERENDUM_SLUG,
}: RepresentedPersonConversionFormProps) {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const [displayName, setDisplayName] = useState("");
  const [mode, setMode] = useState<FormMode>("idle");
  const [error, setError] = useState<string | null>(null);
  const [savedNames, setSavedNames] = useState<string[]>([]);
  const [syncAttempt, setSyncAttempt] = useState(0);
  const syncStartedRef = useRef(false);

  const hasName = displayName.trim().length > 0;
  const isAuthenticated = sessionStatus === "authenticated" && Boolean(session?.user);
  const pendingCount = useMemo(() => {
    if (typeof window === "undefined") return 0;
    return storage.getPendingRepresentedPeople().length;
  }, [mode]);

  useEffect(() => {
    if (sessionStatus !== "unauthenticated" || mode !== "idle") return;
    if (storage.getPendingRepresentedPeople().length > 0) {
      setMode("auth");
    }
  }, [mode, sessionStatus]);

  useEffect(() => {
    if (!isAuthenticated || syncStartedRef.current) return;
    const drafts = storage.getPendingRepresentedPeople();
    if (drafts.length === 0) return;

    syncStartedRef.current = true;
    setMode("syncing");
    setError(null);

    void syncPendingRepresentedPeople()
      .then((result) => {
        if (result.skippedBecauseLocked) {
          window.setTimeout(() => {
            syncStartedRef.current = false;
            setMode("idle");
            setSyncAttempt((current) => current + 1);
          }, 1_000);
          return;
        }

        if (result.syncedDrafts.length > 0) {
          setSavedNames(result.syncedDrafts.map((draft) => draft.displayName));
        }

        if (result.failedDrafts.length > 0) {
          const first = result.failedDrafts[0]!;
          setDisplayName(first.displayName);
          setError("I could not save that person yet. The draft is still here.");
          setMode("error");
          return;
        }

        if (result.syncedDrafts.length > 0) {
          router.refresh();
        }

        setMode(result.syncedDrafts.length > 0 ? "saved" : "idle");
      })
      .catch(() => {
        setError("I could not save that person yet. The draft is still here.");
        setMode("error");
      })
      .finally(() => {
        syncStartedRef.current = false;
      });
  }, [isAuthenticated, router, syncAttempt]);

  function resetForm() {
    setDisplayName("");
  }

  function buildDraft(): PendingRepresentedPersonDraft {
    return {
      clientDraftId: createDraftId(),
      displayName: displayName.trim(),
      isPublic: true,
      lifeStatus: "UNKNOWN",
      originUrl: typeof window !== "undefined" ? window.location.href : undefined,
      referendumSlug,
      timestamp: new Date().toISOString(),
      version: 1,
    };
  }

  async function submit() {
    if (!hasName || mode === "saving" || mode === "syncing") return;
    const draft = buildDraft();
    setMode("saving");
    setError(null);

    if (!isAuthenticated) {
      storage.addPendingRepresentedPerson(draft);
      setSavedNames([draft.displayName]);
      setMode("auth");
      resetForm();
      return;
    }

    try {
      const ok = await postRepresentedPersonDraft(draft);
      if (!ok) {
        throw new Error("Could not save this person.");
      }
      setSavedNames([draft.displayName]);
      router.refresh();
      setMode("saved");
      resetForm();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save this person.");
      setMode("error");
    }
  }

  const shellClass = cn(
    "border border-foreground bg-background p-5 text-foreground sm:p-6",
    className,
  );

  if (mode === "auth") {
    return (
      <section className={shellClass} data-testid="represented-person-auth">
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-3">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">
              Name saved
            </p>
            <h2 className="text-3xl font-black uppercase leading-tight">
              Verify to sign for {savedNames[0] ?? "them"}.
            </h2>
            <p className="font-bold leading-7 text-muted-foreground">
              We saved the name in this browser. Verify once to finish the
              signature.
            </p>
            {pendingCount > 1 ? (
              <p className="text-sm font-black uppercase tracking-[0.12em]">
                {pendingCount} drafts waiting.
              </p>
            ) : null}
          </div>
          <AuthForm
            callbackUrl={ROUTES.people}
            compact
            hideContainer
            title="Verify"
            subtitle="One verification, then their treaty signature is added."
            googleButtonLabel="Verify with Google"
            emailButtonLabel="Verify by email"
            emailPendingButtonLabel="Sending verification link..."
          />
        </div>
      </section>
    );
  }

  if (mode === "syncing") {
    return (
      <section className={shellClass} data-testid="represented-person-syncing">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">
          Signing for them
        </p>
        <h2 className="mt-3 text-3xl font-black uppercase leading-tight">
          Adding their signature now.
        </h2>
      </section>
    );
  }

  if (mode === "saved") {
    const names = savedNames.join(", ");
    return (
      <section className={shellClass} data-testid="represented-person-saved">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">
          Signed
        </p>
        <h2 className="mt-3 text-3xl font-black uppercase leading-tight">
          You signed for {names || "them"}.
        </h2>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button
            className="border border-foreground bg-foreground px-5 py-3 text-sm font-black uppercase tracking-[0.14em] text-background shadow-none hover:translate-x-0 hover:translate-y-0"
            onClick={() => {
              setSavedNames([]);
              setMode("idle");
            }}
            type="button"
          >
            Sign for another
          </Button>
          <Link
            className="inline-flex min-h-12 items-center border border-foreground bg-background px-5 py-3 text-sm font-black uppercase tracking-[0.14em] text-foreground"
            href={ROUTES.peopleManage}
          >
            Edit record
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className={shellClass} data-testid="represented-person-form">
      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-3">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">
            Sign for someone
          </p>
          <h2 className="text-3xl font-black uppercase leading-tight">
            Who can no longer sign?
          </h2>
          <p className="font-bold leading-7 text-muted-foreground">
            Use their real name or the name people know them by.
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs font-black uppercase" htmlFor="represented-fast-name">
              Name
            </Label>
            <Input
              autoComplete="name"
              className="min-h-14 border-border bg-background text-lg font-bold"
              disabled={mode === "saving"}
              id="represented-fast-name"
              onChange={(event) => setDisplayName(event.target.value)}
              placeholder="Grandma Kay"
              value={displayName}
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              className="min-h-12 border border-foreground bg-foreground px-5 font-black uppercase tracking-[0.12em] text-background shadow-none hover:translate-x-0 hover:translate-y-0 disabled:opacity-40"
              disabled={!hasName || mode === "saving"}
              onClick={() => void submit()}
              type="button"
            >
              {mode === "saving" ? "Saving..." : "Sign for them"}
            </Button>
          </div>

          {error ? (
            <p className="border border-border bg-background p-3 text-sm font-black">
              {error}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
