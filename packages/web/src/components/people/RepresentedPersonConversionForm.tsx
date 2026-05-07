"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { AuthForm } from "@/components/auth/AuthForm";
import { Button } from "@/components/retroui/Button";
import { Checkbox } from "@/components/retroui/Checkbox";
import { Input } from "@/components/retroui/Input";
import { Label } from "@/components/retroui/Label";
import {
  postRepresentedPersonDraft,
  syncPendingRepresentedPeople,
  type SyncedRepresentedPerson,
} from "@/lib/represented-person-sync";
import { getRepresentedPersonDetailsHref } from "@/lib/plaintiffs-flow";
import { ROUTES } from "@/lib/routes";
import { storage, type PendingRepresentedPersonDraft } from "@/lib/storage";
import { TREATY_REFERENDUM_SLUG } from "@/lib/treaty";
import { cn } from "@/lib/utils";

type FormMode = "idle" | "auth" | "saving" | "saved" | "syncing" | "error";

interface SavedRepresentedPerson {
  displayName: string;
  personId?: string;
}

function createDraftId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `represented-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function savedPersonFromSync(
  person: SyncedRepresentedPerson,
): SavedRepresentedPerson {
  return {
    displayName: person.displayName,
    personId: person.personId,
  };
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
  const [authorityConfirmed, setAuthorityConfirmed] = useState(false);
  const [publicDisplayAcknowledged, setPublicDisplayAcknowledged] =
    useState(false);
  const [mode, setMode] = useState<FormMode>("idle");
  const [error, setError] = useState<string | null>(null);
  const [savedPeople, setSavedPeople] = useState<SavedRepresentedPerson[]>([]);
  const [syncAttempt, setSyncAttempt] = useState(0);
  const syncStartedRef = useRef(false);

  const hasName = displayName.trim().length > 0;
  const canSubmit = hasName && authorityConfirmed && publicDisplayAcknowledged;
  const isAuthenticated =
    sessionStatus === "authenticated" && Boolean(session?.user);
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

        if (result.syncedPeople.length > 0) {
          setSavedPeople(result.syncedPeople.map(savedPersonFromSync));
        }

        if (result.failedDrafts.length > 0) {
          const first = result.failedDrafts[0]!;
          setDisplayName(first.displayName);
          setError(
            "I could not save that person yet. The draft is still here.",
          );
          setMode("error");
          return;
        }

        if (result.syncedDrafts.length > 0) {
          const destination = getRepresentedPersonDetailsHref(
            result.syncedPeople,
          );
          router.push(destination);
          router.refresh();
          return;
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
    setAuthorityConfirmed(false);
    setPublicDisplayAcknowledged(false);
  }

  function buildDraft(): PendingRepresentedPersonDraft {
    return {
      authorityConfirmed,
      clientDraftId: createDraftId(),
      displayName: displayName.trim(),
      healthDisclosureConfirmed: false,
      isPublic: true,
      lifeStatus: "UNKNOWN",
      originUrl:
        typeof window !== "undefined" ? window.location.href : undefined,
      publicDisplayAcknowledged,
      referendumSlug,
      showConditionPublicly: false,
      timestamp: new Date().toISOString(),
      version: 1,
    };
  }

  async function submit() {
    if (!canSubmit || mode === "saving" || mode === "syncing") return;
    const draft = buildDraft();
    setMode("saving");
    setError(null);

    if (!isAuthenticated) {
      storage.addPendingRepresentedPerson(draft);
      setSavedPeople([{ displayName: draft.displayName }]);
      setMode("auth");
      resetForm();
      return;
    }

    try {
      const person = await postRepresentedPersonDraft(draft);
      if (!person) {
        throw new Error("Could not save this person.");
      }
      setSavedPeople([savedPersonFromSync(person)]);
      resetForm();
      router.push(getRepresentedPersonDetailsHref([person]));
      router.refresh();
    } catch (caught) {
      storage.addPendingRepresentedPerson(draft);
      setError(
        caught instanceof Error
          ? caught.message
          : "Could not save this person.",
      );
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
              Verify to register {savedPeople[0]?.displayName ?? "them"}.
            </h2>
            <p className="font-bold leading-7 text-muted-foreground">
              We saved the name in this browser. Verify once to add them to the
              case.
            </p>
            {pendingCount > 1 ? (
              <p className="text-sm font-black uppercase tracking-[0.12em]">
                {pendingCount} drafts waiting.
              </p>
            ) : null}
          </div>
          <AuthForm
            callbackUrl={ROUTES.plaintiffs}
            compact
            hideContainer
            title="Verify"
            subtitle="One verification, then the plaintiff is registered."
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
          Registering plaintiff
        </p>
        <h2 className="mt-3 text-3xl font-black uppercase leading-tight">
          Adding them to the case.
        </h2>
      </section>
    );
  }

  if (mode === "saved") {
    const names = savedPeople.map((person) => person.displayName).join(", ");
    const addDetailsHref = getRepresentedPersonDetailsHref(savedPeople);
    return (
      <section className={shellClass} data-testid="represented-person-saved">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">
          Plaintiff registered
        </p>
        <h2 className="mt-3 text-3xl font-black uppercase leading-tight">
          You registered {names || "them"}.
        </h2>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button
            className="border border-foreground bg-foreground px-5 py-3 text-sm font-black uppercase tracking-[0.14em] text-background shadow-none hover:translate-x-0 hover:translate-y-0"
            onClick={() => {
              setSavedPeople([]);
              setMode("idle");
            }}
            type="button"
          >
            Register another
          </Button>
          <Link
            className="inline-flex min-h-12 items-center border border-foreground bg-background px-5 py-3 text-sm font-black uppercase tracking-[0.14em] text-foreground"
            href={addDetailsHref}
          >
            Add details
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
            Register plaintiff
          </p>
          <h2 className="text-3xl font-black uppercase leading-tight">
            Who should be a plaintiff?
          </h2>
          <p className="font-bold leading-7 text-muted-foreground">
            Use their real name or the name people know them by.
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label
              className="text-xs font-black uppercase"
              htmlFor="represented-fast-name"
            >
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

          <label className="flex items-start gap-3 text-sm font-bold leading-6">
            <Checkbox
              checked={authorityConfirmed}
              disabled={mode === "saving"}
              onCheckedChange={(value) => setAuthorityConfirmed(value === true)}
            />
            <span>
              I have permission or legal authority to add this person, or they
              are deceased and I am their family member or personal
              representative.
            </span>
          </label>

          <label className="flex items-start gap-3 text-sm font-bold leading-6">
            <Checkbox
              checked={publicDisplayAcknowledged}
              disabled={mode === "saving"}
              onCheckedChange={(value) =>
                setPublicDisplayAcknowledged(value === true)
              }
            />
            <span>
              I understand public plaintiff cards, photos, comments, memorial
              details, and evidence may be visible to anyone.
            </span>
          </label>

          <div className="flex flex-wrap gap-3">
            <Button
              className="min-h-12 border border-foreground bg-foreground px-5 font-black uppercase tracking-[0.12em] text-background shadow-none hover:translate-x-0 hover:translate-y-0 disabled:opacity-40"
              disabled={!canSubmit || mode === "saving"}
              onClick={() => void submit()}
              type="button"
            >
              {mode === "saving" ? "Saving..." : "Register plaintiff"}
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
