"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useRef, useState } from "react"
import { useSession } from "next-auth/react"
import { AuthForm } from "@/components/auth/AuthForm"
import {
  postRepresentedPersonDraft,
  syncPendingRepresentedPeople,
  type SyncedRepresentedPerson,
} from "@/lib/represented-person-sync"
import {
  buildDisplayNameFromParts,
  splitDisplayNameIntoNameParts,
} from "@/lib/person-name"
import { getRepresentedPersonDetailsHref } from "@/lib/plaintiffs-flow"
import { ROUTES } from "@/lib/routes"
import { storage, type PendingRepresentedPersonDraft } from "@/lib/storage"
import {
  defaultButtonClassName,
  primaryButtonClassName,
} from "@optimitron/site-kit/components/ui/default-button"

type FormMode = "idle" | "auth" | "saving" | "saved" | "syncing" | "error"

interface SavedRepresentedPerson {
  displayName: string
  personId?: string
}

const fieldLabelClassName =
  "mb-1 block text-xs font-bold uppercase tracking-widest text-muted-foreground"
const textInputClassName =
  "min-h-14 w-full border-2 border-foreground bg-background px-3 py-2 text-lg font-bold text-foreground"

function createDraftId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }
  return `represented-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function savedPersonFromSync(
  person: SyncedRepresentedPerson,
): SavedRepresentedPerson {
  return {
    displayName: person.displayName,
    personId: person.personId,
  }
}

function nameFromDraft(draft: PendingRepresentedPersonDraft) {
  const fallback = splitDisplayNameIntoNameParts(draft.displayName)
  return {
    firstName: draft.firstName ?? fallback.firstName,
    middleName: draft.middleName ?? fallback.middleName,
    lastName: draft.lastName ?? fallback.lastName,
  }
}

interface RegisterPlaintiffFormProps {
  /**
   * Required, not defaulted. `TREATY_REFERENDUM_SLUG` re-exports from
   * `@optimitron/db`, so importing it here would pull the Prisma client into
   * the client bundle. The server component passes it down instead.
   */
  referendumSlug: string
}

export function RegisterPlaintiffForm({
  referendumSlug,
}: RegisterPlaintiffFormProps) {
  const router = useRouter()
  const { data: session, status: sessionStatus } = useSession()
  const [firstName, setFirstName] = useState("")
  const [middleName, setMiddleName] = useState("")
  const [lastName, setLastName] = useState("")
  const [authorityConfirmed, setAuthorityConfirmed] = useState(false)
  const [publicDisplayAcknowledged, setPublicDisplayAcknowledged] =
    useState(false)
  const [mode, setMode] = useState<FormMode>("idle")
  const [error, setError] = useState<string | null>(null)
  const [savedPeople, setSavedPeople] = useState<SavedRepresentedPerson[]>([])
  const [syncAttempt, setSyncAttempt] = useState(0)
  const syncStartedRef = useRef(false)

  const displayName = buildDisplayNameFromParts({
    firstName,
    middleName,
    lastName,
  })
  const hasName = firstName.trim().length > 0 && lastName.trim().length > 0
  const canSubmit = hasName && authorityConfirmed && publicDisplayAcknowledged
  const isAuthenticated =
    sessionStatus === "authenticated" && Boolean(session?.user)
  const pendingCount = useMemo(() => {
    if (typeof window === "undefined") return 0
    return storage.getPendingRepresentedPeople().length
  }, [mode])

  useEffect(() => {
    if (sessionStatus !== "unauthenticated" || mode !== "idle") return
    if (storage.getPendingRepresentedPeople().length > 0) {
      setMode("auth")
    }
  }, [mode, sessionStatus])

  useEffect(() => {
    if (!isAuthenticated || syncStartedRef.current) return
    const drafts = storage.getPendingRepresentedPeople()
    if (drafts.length === 0) return

    syncStartedRef.current = true
    setMode("syncing")
    setError(null)

    void syncPendingRepresentedPeople()
      .then((result) => {
        if (result.skippedBecauseLocked) {
          window.setTimeout(() => {
            syncStartedRef.current = false
            setMode("idle")
            setSyncAttempt((current) => current + 1)
          }, 1_000)
          return
        }

        if (result.syncedPeople.length > 0) {
          setSavedPeople(result.syncedPeople.map(savedPersonFromSync))
        }

        if (result.failedDrafts.length > 0) {
          const first = result.failedDrafts[0]!
          const draftName = nameFromDraft(first)
          setFirstName(draftName.firstName)
          setMiddleName(draftName.middleName)
          setLastName(draftName.lastName)
          setError("I could not save that person yet. The draft is still here.")
          setMode("error")
          return
        }

        if (result.syncedDrafts.length > 0) {
          const destination = getRepresentedPersonDetailsHref(
            result.syncedPeople,
          )
          router.push(destination)
          router.refresh()
          return
        }

        setMode(result.syncedDrafts.length > 0 ? "saved" : "idle")
      })
      .catch(() => {
        setError("I could not save that person yet. The draft is still here.")
        setMode("error")
      })
      .finally(() => {
        syncStartedRef.current = false
      })
  }, [isAuthenticated, router, syncAttempt])

  function resetForm() {
    setFirstName("")
    setMiddleName("")
    setLastName("")
    setAuthorityConfirmed(false)
    setPublicDisplayAcknowledged(false)
  }

  function buildDraft(): PendingRepresentedPersonDraft {
    return {
      authorityConfirmed,
      clientDraftId: createDraftId(),
      displayName,
      healthDisclosureConfirmed: false,
      isPublic: true,
      firstName: firstName.trim(),
      middleName: middleName.trim(),
      lastName: lastName.trim(),
      lifeStatus: "UNKNOWN",
      originUrl:
        typeof window !== "undefined" ? window.location.href : undefined,
      publicDisplayAcknowledged,
      referendumSlug,
      showConditionPublicly: false,
      timestamp: new Date().toISOString(),
      version: 1,
    }
  }

  async function submit() {
    if (!canSubmit || mode === "saving" || mode === "syncing") return
    const draft = buildDraft()
    setMode("saving")
    setError(null)

    if (!isAuthenticated) {
      storage.addPendingRepresentedPerson(draft)
      setSavedPeople([{ displayName: draft.displayName }])
      setMode("auth")
      resetForm()
      return
    }

    try {
      const person = await postRepresentedPersonDraft(draft)
      if (!person) {
        throw new Error("Could not save this person.")
      }
      setSavedPeople([savedPersonFromSync(person)])
      resetForm()
      router.push(getRepresentedPersonDetailsHref([person]))
      router.refresh()
    } catch (caught) {
      storage.addPendingRepresentedPerson(draft)
      setError(
        caught instanceof Error ? caught.message : "Could not save this person.",
      )
      setMode("error")
    }
  }

  const shellClass = "border-2 border-foreground bg-background p-6 text-foreground"

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
          {/* Site-kit's AuthForm has no title/subtitle props, so the heading
              copy the Optimitron form passed in is rendered here instead. */}
          <div className="space-y-3">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">
              Verify
            </p>
            <p className="font-bold leading-7 text-muted-foreground">
              One verification, then the plaintiff is registered.
            </p>
            <AuthForm
              callbackUrl={ROUTES.plaintiffs}
              compact
              emailButtonLabel="Verify by email"
              emailLoadingLabel="Sending verification link..."
            />
          </div>
        </div>
      </section>
    )
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
    )
  }

  if (mode === "saved") {
    const names = savedPeople.map((person) => person.displayName).join(", ")
    const addDetailsHref = getRepresentedPersonDetailsHref(savedPeople)
    return (
      <section className={shellClass} data-testid="represented-person-saved">
        <h2 className="text-3xl font-black uppercase leading-tight">
          You registered {names || "them"}.
        </h2>
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            className={defaultButtonClassName}
            onClick={() => {
              setSavedPeople([])
              setMode("idle")
            }}
            type="button"
          >
            Register another
          </button>
          <Link className={defaultButtonClassName} href={addDetailsHref}>
            Add details
          </Link>
        </div>
      </section>
    )
  }

  return (
    <section className={shellClass} data-testid="represented-person-form">
      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-3">
          <h2 className="text-3xl font-black uppercase leading-tight">
            Register plaintiff
          </h2>
        </div>

        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label
                className={fieldLabelClassName}
                htmlFor="represented-fast-first-name"
              >
                First name
              </label>
              <input
                autoComplete="given-name"
                className={textInputClassName}
                disabled={mode === "saving"}
                id="represented-fast-first-name"
                onChange={(event) => setFirstName(event.target.value)}
                placeholder="Kay"
                value={firstName}
              />
            </div>
            <div>
              <label
                className={fieldLabelClassName}
                htmlFor="represented-fast-middle-name"
              >
                Middle name optional
              </label>
              <input
                autoComplete="additional-name"
                className={textInputClassName}
                disabled={mode === "saving"}
                id="represented-fast-middle-name"
                onChange={(event) => setMiddleName(event.target.value)}
                placeholder="Elaine"
                value={middleName}
              />
            </div>
            <div>
              <label
                className={fieldLabelClassName}
                htmlFor="represented-fast-last-name"
              >
                Last name
              </label>
              <input
                autoComplete="family-name"
                className={textInputClassName}
                disabled={mode === "saving"}
                id="represented-fast-last-name"
                onChange={(event) => setLastName(event.target.value)}
                placeholder="Sinn"
                value={lastName}
              />
            </div>
          </div>

          <label className="flex items-start gap-3 text-sm font-bold leading-6">
            <input
              checked={authorityConfirmed}
              className="mt-1 h-4 w-4 shrink-0 border-2 border-foreground"
              disabled={mode === "saving"}
              onChange={(event) => setAuthorityConfirmed(event.target.checked)}
              type="checkbox"
            />
            <span>
              I have permission or legal authority to add this person, or they
              are deceased and I am their family member or personal
              representative.
            </span>
          </label>

          <label className="flex items-start gap-3 text-sm font-bold leading-6">
            <input
              checked={publicDisplayAcknowledged}
              className="mt-1 h-4 w-4 shrink-0 border-2 border-foreground"
              disabled={mode === "saving"}
              onChange={(event) =>
                setPublicDisplayAcknowledged(event.target.checked)
              }
              type="checkbox"
            />
            <span>
              I understand public plaintiff cards, photos, comments, memorial
              details, and evidence may be visible to anyone.
            </span>
          </label>

          <div className="flex flex-wrap gap-3">
            <button
              className={`${primaryButtonClassName} disabled:opacity-40`}
              disabled={!canSubmit || mode === "saving"}
              onClick={() => void submit()}
              type="button"
            >
              {mode === "saving" ? "Saving..." : "Register plaintiff"}
            </button>
          </div>

          {error ? (
            <p className="border-2 border-foreground bg-background p-3 text-sm font-black">
              {error}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  )
}
