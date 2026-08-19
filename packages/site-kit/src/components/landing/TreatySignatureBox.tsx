"use client"

import { useEffect, useRef, useState } from "react"
import { useSession } from "next-auth/react"
import { useSearchParams } from "next/navigation"
import confetti from "canvas-confetti"
import { Button } from "@optimitron/neobrutalist-ui/ui/button"
import { Card } from "@optimitron/neobrutalist-ui/ui/card"
import { storage } from "../../lib/storage"
import { syncPendingVote } from "../../lib/vote-utils"
import { getUsernameOrReferralCode } from "../../lib/referral.client"
import { buildUserReferralUrl, getBaseUrl } from "../../lib/url"
import { trackVoteSubmitted } from "../../lib/analytics"
import { TreatyPostVoteFlow } from "./TreatyPostVoteFlow"

const inputClassName =
  "w-full border-4 border-primary bg-background px-4 py-3 text-lg font-bold text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"

interface TreatySignatureBoxProps {
  /** Server-checked: the session user already has a YES vote recorded. */
  initialSignedYes?: boolean
}

/**
 * Document-style signature box for `/treaty`: a name field, a Sign button,
 * and a date-stamped "Signed this day, [date]" line. Reading and signing a
 * treaty is one motion.
 *
 * Submission semantics:
 *   - The YES vote (with the typed name) is staged as the pending vote.
 *   - Signed-in: synced to /api/votes/sync immediately.
 *   - Signed-out: the post-vote flow's email verification saves it on the
 *     next authenticated visit (the box also syncs on mount when a signer
 *     returns from the email link).
 *
 * The typed signature name and optional first/middle/last legal name are
 * stored on the voter's Person so signer lists can display the human who
 * signed, when they consent.
 */
export function TreatySignatureBox({
  initialSignedYes = false,
}: TreatySignatureBoxProps) {
  const { data: session, status } = useSession()
  const searchParams = useSearchParams()
  const referralCode = searchParams?.get("ref") || null
  const inviteToken = searchParams?.get("invite") || null

  const [name, setName] = useState("")
  const [showLegalName, setShowLegalName] = useState(false)
  const [firstName, setFirstName] = useState("")
  const [middleName, setMiddleName] = useState("")
  const [lastName, setLastName] = useState("")
  const [makePublic, setMakePublic] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [signed, setSigned] = useState(initialSignedYes)
  const [error, setError] = useState<string | null>(null)

  // Hydration-safe date stamp: rendered client-side only, marked volatile
  // so screenshot review ignores it.
  const [today, setToday] = useState<string | null>(null)
  useEffect(() => {
    setToday(
      new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    )
  }, [])

  // Returning from the email sign-in link: the pending YES signature is
  // still in localStorage — sync it, then show the signed state.
  const hasSyncedRef = useRef(false)
  useEffect(() => {
    if (status !== "authenticated" || !session || hasSyncedRef.current) return
    hasSyncedRef.current = true
    const pendingVote = storage.getPendingVote()
    if (!pendingVote) return
    void syncPendingVote(session).then((synced) => {
      if (synced && pendingVote.answer === "YES") setSigned(true)
    })
  }, [status, session])

  async function handleSign() {
    const trimmed = name.trim().replace(/\s+/g, " ")
    if (!trimmed) {
      setError("Enter your name to sign.")
      return
    }
    if (submitting) return
    setSubmitting(true)
    setError(null)

    const sourceUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}${window.location.pathname}`
        : null
    const sourceReferrer =
      typeof document !== "undefined" ? document.referrer || null : null

    storage.setPendingVote({
      answer: "YES",
      referredBy: referralCode,
      inviteToken,
      timestamp: new Date().toISOString(),
      organizationId: null,
      sourceUrl,
      sourceReferrer,
      displayName: trimmed,
      firstName: firstName.trim() || null,
      middleName: middleName.trim() || null,
      lastName: lastName.trim() || null,
      makePublic,
    })
    storage.clearVoteStatusCache()

    trackVoteSubmitted({
      voteType: "treaty_vote",
      answer: "YES",
      authenticated: status === "authenticated",
    })

    if (status === "authenticated" && session) {
      const synced = await syncPendingVote(session)
      if (!synced) {
        setSubmitting(false)
        setError("Failed to record your signature. Try again.")
        return
      }
      const referralIdentifier = getUsernameOrReferralCode(session.user)
      if (referralIdentifier) {
        storage.setVoteStatusCache({
          hasVoted: true,
          VotePosition: "YES",
          referralCode: referralIdentifier,
        })
      }
    }

    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.7 },
      colors: ["#FF6B9D", "#00D9FF", "#FFE66D"],
    })
    setSubmitting(false)
    setSigned(true)
  }

  if (signed) {
    const baseUrl = getBaseUrl()
    const shareUrl = session?.user
      ? buildUserReferralUrl(session.user, baseUrl)
      : baseUrl
    return (
      <div className="mx-auto max-w-2xl">
        <p className="mb-6 text-center text-2xl font-black uppercase">
          Signed. Thank you for ending war and disease.
        </p>
        <TreatyPostVoteFlow
          answer="yes"
          mode="full"
          status={status}
          session={session}
          shareUrl={shareUrl}
          referralCode={referralCode}
          inviteToken={inviteToken}
        />
      </div>
    )
  }

  return (
    <Card className="mx-auto flex max-w-2xl flex-col gap-4 border-4 border-primary bg-background p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] md:p-12">
      <p className="text-center text-xl font-bold">
        Signed this day,{" "}
        <span data-volatile="signature date">{today ?? ""}</span>, in the year
        of our ongoing confusion.
      </p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              void handleSign()
            }
          }}
          placeholder="Your name"
          className={`${inputClassName} flex-1`}
          aria-label="Your name"
          autoComplete="name"
        />
        <Button
          onClick={() => void handleSign()}
          disabled={!name.trim() || submitting}
          className="h-auto border-4 border-primary bg-brutal-cyan px-8 py-3 text-lg font-black uppercase text-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-1 hover:translate-y-1 hover:bg-brutal-cyan/90 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] disabled:opacity-40"
        >
          {submitting ? "..." : "Sign"}
        </Button>
      </div>
      {showLegalName ? (
        <div className="grid gap-3 sm:grid-cols-3">
          <input
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="First name"
            className={inputClassName}
            aria-label="First name"
            autoComplete="given-name"
          />
          <input
            value={middleName}
            onChange={(e) => setMiddleName(e.target.value)}
            placeholder="Middle name"
            className={inputClassName}
            aria-label="Middle name"
            autoComplete="additional-name"
          />
          <input
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Last name"
            className={inputClassName}
            aria-label="Last name"
            autoComplete="family-name"
          />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowLegalName(true)}
          className="self-start text-sm font-bold underline decoration-dotted underline-offset-2 hover:opacity-80"
        >
          Add your first, middle, and last name (optional)
        </button>
      )}
      <label className="flex cursor-pointer items-start gap-2 text-sm font-bold">
        <input
          type="checkbox"
          checked={makePublic}
          onChange={(e) => setMakePublic(e.target.checked)}
          className="mt-1 h-4 w-4 cursor-pointer accent-foreground"
        />
        <span>
          Display my name publicly on the signer list and leaderboards{" "}
          <span className="opacity-70">(recommended)</span>.
        </span>
      </label>
      {error ? (
        <p className="text-center text-xs font-bold uppercase">{error}</p>
      ) : null}
    </Card>
  )
}
