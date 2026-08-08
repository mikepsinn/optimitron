"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Copy, Mail, UserRound } from "lucide-react"
import { Button } from "@optimitron/neobrutalist-ui/ui/button"
import { Input } from "@optimitron/neobrutalist-ui/ui/input"
import { Card } from "@optimitron/neobrutalist-ui/ui/card"
import { updateUserProfile } from "@/app/dashboard/actions"
import { buildDefaultReferralInvitationMessage, getFirstName, isValidInviteEmail } from "../../lib/referral-invitations"
import { sanitizeUsernameInput, validateUsername } from "../../lib/username"
import { getBaseUrl } from "../../lib/url"
import { createLogger } from "../../lib/logger"
import { cn } from "@optimitron/neobrutalist-ui/cn"
import { VOTER_LIVES_SAVED } from "@optimitron/impact-params/parameters"
import { ParameterValue } from "../shared/ParameterValue"

const log = createLogger("referral-send-loop")

type LoopStep = "name" | "message" | "copied" | "sent" | "impact"

interface ReferralSendLoopProps {
  referralUrl: string
  isAuthenticated: boolean
  user: {
    name?: string | null
    username?: string | null
    referralCode?: string | null
  } | null
  alt?: boolean
  compact?: boolean
  className?: string
  onSentCountChange?: (count: number) => void
  onDone?: (dismissive: boolean) => void
}

export function ReferralSendLoop({
  referralUrl,
  isAuthenticated,
  user,
  alt = false,
  compact = false,
  className,
  onSentCountChange,
  onDone,
}: ReferralSendLoopProps) {
  const router = useRouter()
  const [step, setStep] = useState<LoopStep>("name")
  const [recipientName, setInviteeName] = useState("")
  const [inviteeEmail, setInviteeEmail] = useState("")
  const [activeName, setActiveName] = useState("")
  const [activeEmail, setActiveEmail] = useState("")
  const [lastInviteeName, setLastInviteeName] = useState("")
  const [lastInviteeEmail, setLastInviteeEmail] = useState("")
  const [lastEmailProvided, setLastEmailProvided] = useState(false)
  const [sentCount, setSentCount] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [isWorking, setIsWorking] = useState(false)
  const [handle, setHandle] = useState(user?.username || "")
  const [handleSaved, setHandleSaved] = useState(false)
  const [handleError, setHandleError] = useState<string | null>(null)
  const [savingHandle, setSavingHandle] = useState(false)

  const cleanName = recipientName.trim()
  const cleanEmail = inviteeEmail.trim()
  const activeFirstName = getFirstName(activeName)
  const lastFirstName = getFirstName(lastInviteeName)
  const canContinue = cleanName.length > 0
  const activeEmailIsValid = activeEmail.length > 0 && isValidInviteEmail(activeEmail)
  const cleanEmailIsValid = cleanEmail.length === 0 || isValidInviteEmail(cleanEmail)

  const effectiveReferralUrl = useMemo(() => {
    const cleanHandle = handle.trim()
    if (isAuthenticated && (handleSaved || user?.username) && cleanHandle) {
      return `${getBaseUrl()}/vote/${cleanHandle}`
    }
    return referralUrl
  }, [handle, handleSaved, isAuthenticated, referralUrl, user?.username])

  const messagePreview = activeName
    ? buildDefaultReferralInvitationMessage(activeName, effectiveReferralUrl)
    : ""

  if (!isAuthenticated) {
    return null
  }

  const saveHandle = async () => {
    const normalized = sanitizeUsernameInput(handle.trim())
    const validation = validateUsername(normalized)
    if (validation) {
      setHandleError(validation)
      return
    }

    setSavingHandle(true)
    setHandleError(null)
    try {
      await updateUserProfile({ username: normalized })
      setHandle(normalized)
      setHandleSaved(true)
      router.refresh()
    } catch (error) {
      setHandleError(error instanceof Error ? error.message : "Failed to save handle.")
    } finally {
      setSavingHandle(false)
    }
  }

  const startMessage = () => {
    if (!canContinue) return
    setError(null)
    setActiveName(cleanName)
    setActiveEmail(cleanEmail)
    setStep("message")
  }

  const recordSent = () => {
    const nextCount = sentCount + 1
    setSentCount(nextCount)
    setLastInviteeName(activeName)
    setLastInviteeEmail(activeEmail)
    setLastEmailProvided(activeEmailIsValid)
    onSentCountChange?.(nextCount)
  }

  const copyMessage = async () => {
    if (!activeName) return

    setIsWorking(true)
    setError(null)
    try {
      let message = messagePreview

      const res = await fetch("/api/referral-invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "copy",
          recipientName: activeName,
          inviteeContact: activeEmailIsValid ? activeEmail : null,
          messageText: messagePreview,
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(json.error || "Failed to create invitation.")
      }
      message = json.invitations?.[0]?.messageText || message

      await navigator.clipboard.writeText(message)
      router.refresh()
      setStep("copied")
    } catch (error) {
      log.error("Failed to copy referral message", { error })
      setError(error instanceof Error ? error.message : "Failed to copy message.")
    } finally {
      setIsWorking(false)
    }
  }

  const confirmCopiedSent = () => {
    recordSent()
    setStep("impact")
  }

  const sendEmail = async () => {
    if (!activeName || !activeEmailIsValid) return

    setIsWorking(true)
    setError(null)
    try {
      const res = await fetch("/api/referral-invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "send",
          recipientName: activeName,
          inviteeContact: activeEmail,
          messageText: messagePreview,
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(json.error || "Failed to send email.")
      }
      recordSent()
      router.refresh()
      setStep("sent")
    } catch (error) {
      log.error("Failed to send referral email", { error })
      setError(error instanceof Error ? error.message : "Failed to send email.")
    } finally {
      setIsWorking(false)
    }
  }

  const resetForNext = () => {
    setInviteeName("")
    setInviteeEmail("")
    setActiveName("")
    setActiveEmail("")
    setError(null)
    setStep("name")
  }

  const finish = () => {
    if (onDone) {
      onDone(true)
      return
    }
    router.push("/dashboard")
  }

  return (
    <Card
      className={cn(
        "border-4 border-primary bg-background p-5 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]",
        compact && "shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]",
        className
      )}
    >
      {step === "name" && (
        <NameAndContactStep
          sentCount={sentCount}
          alt={alt}
          recipientName={recipientName}
          inviteeEmail={inviteeEmail}
          cleanEmailIsValid={cleanEmailIsValid}
          canContinue={canContinue}
          isWorking={isWorking}
          user={user}
          handle={handle}
          handleError={handleError}
          savingHandle={savingHandle}
          onHandleChange={(value) => {
            setHandle(sanitizeUsernameInput(value))
            setHandleError(null)
          }}
          onSaveHandle={saveHandle}
          onNameChange={(value) => {
            setInviteeName(value)
            setError(null)
          }}
          onEmailChange={(value) => {
            setInviteeEmail(value)
            setError(null)
          }}
          onContinue={startMessage}
        />
      )}

      {step === "message" && (
        <MessageStep
          firstName={activeFirstName}
          activeEmail={activeEmail}
          activeEmailIsValid={activeEmailIsValid}
          messagePreview={messagePreview}
          isWorking={isWorking}
          error={error}
          onCopy={copyMessage}
          onSend={sendEmail}
        />
      )}

      {step === "copied" && (
        <CopiedStep
          firstName={activeFirstName}
          error={error}
          isWorking={isWorking}
          onConfirm={confirmCopiedSent}
        />
      )}

      {step === "sent" && (
        <SentStep email={activeEmail} error={error} onContinue={() => setStep("impact")} />
      )}

      {step === "impact" && (
        <ImpactStep
          sentCount={sentCount}
          lastFirstName={lastFirstName}
          lastInviteeEmail={lastInviteeEmail}
          lastEmailProvided={lastEmailProvided}
          onDone={finish}
          onOneMore={resetForNext}
        />
      )}
    </Card>
  )
}

function NameAndContactStep({
  sentCount,
  alt,
  recipientName,
  inviteeEmail,
  cleanEmailIsValid,
  canContinue,
  isWorking,
  user,
  handle,
  handleError,
  savingHandle,
  onHandleChange,
  onSaveHandle,
  onNameChange,
  onEmailChange,
  onContinue,
}: {
  sentCount: number
  alt: boolean
  recipientName: string
  inviteeEmail: string
  cleanEmailIsValid: boolean
  canContinue: boolean
  isWorking: boolean
  user: ReferralSendLoopProps["user"]
  handle: string
  handleError: string | null
  savingHandle: boolean
  onHandleChange: (value: string) => void
  onSaveHandle: () => void
  onNameChange: (value: string) => void
  onEmailChange: (value: string) => void
  onContinue: () => void
}) {
  return (
    <div className="space-y-5">
      {!user?.username && (
        <div className="border-4 border-primary bg-brutal-yellow p-4">
          <div className="mb-2 flex items-center gap-2">
            <UserRound className="h-4 w-4" />
            <p className="text-sm font-black uppercase">Want a cleaner link?</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              value={handle}
              onChange={(event) => onHandleChange(event.target.value)}
              placeholder="your_handle"
              className="h-11 border-4 border-primary bg-background font-bold"
            />
            <Button
              type="button"
              onClick={onSaveHandle}
              disabled={savingHandle || !handle.trim()}
              className="h-11 border-4 border-primary bg-foreground font-black text-background"
            >
              {savingHandle ? "Saving" : "Claim"}
            </Button>
          </div>
          <p className="mt-2 break-all text-xs font-bold">Preview: /vote/{handle.trim() || "your_handle"}</p>
          {handleError && <p className="mt-2 text-sm font-bold text-red-600">{handleError}</p>}
        </div>
      )}

      <div className="space-y-3">
        <p className="text-xl font-black leading-snug">
          {alt && sentCount === 0 ? "One at a time. Bear with me." : sentCount === 0 ? "Who do you want to tell first?" : "Who's next?"}
        </p>
        <label className="grid gap-2 text-sm font-black">
          First name:
          <Input
            value={recipientName}
            onChange={(event) => onNameChange(event.target.value)}
            className="h-12 border-4 border-primary bg-background text-base font-bold"
          />
        </label>
        <label className="grid gap-2 text-sm font-black">
          {alt || sentCount === 0 ? "Their email (optional — we'll nudge them so you don't have to):" : "Their email (optional):"}
          <Input
            value={inviteeEmail}
            onChange={(event) => onEmailChange(event.target.value)}
            className="h-12 border-4 border-primary bg-background text-base font-bold"
          />
        </label>
        {!cleanEmailIsValid && <p className="text-xs font-bold text-red-600">Enter a valid email or leave it blank.</p>}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button
          type="button"
          onClick={onContinue}
          disabled={!canContinue || isWorking}
          variant="outline"
          className="h-12 flex-1 border-4 border-primary bg-background font-black"
        >
          Let me just copy
        </Button>
        <Button
          type="button"
          onClick={onContinue}
          disabled={!canContinue || isWorking}
          className="h-12 flex-1 border-4 border-primary bg-brutal-cyan font-black"
        >
          Continue
        </Button>
      </div>
    </div>
  )
}

function MessageStep({
  firstName,
  activeEmail,
  activeEmailIsValid,
  messagePreview,
  isWorking,
  error,
  onCopy,
  onSend,
}: {
  firstName: string
  activeEmail: string
  activeEmailIsValid: boolean
  messagePreview: string
  isWorking: boolean
  error: string | null
  onCopy: () => void
  onSend: () => void
}) {
  const showEmailButton = activeEmail.length > 0

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <p className="text-xl font-black leading-snug">Here's your message to {firstName}:</p>
        <div className="border-4 border-primary bg-brutal-yellow p-4">
          <p className="break-words text-sm font-bold leading-relaxed">"{messagePreview}"</p>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button
          type="button"
          onClick={onCopy}
          disabled={isWorking}
          className={cn(
            "h-12 border-4 border-primary bg-brutal-cyan font-black",
            showEmailButton ? "flex-1" : "w-full"
          )}
        >
          <Copy className="mr-2 h-4 w-4" />
          Copy
        </Button>
        {showEmailButton && (
          <Button
            type="button"
            onClick={onSend}
            disabled={isWorking || !activeEmailIsValid}
            className="h-12 flex-1 border-4 border-primary bg-brutal-pink font-black"
          >
            <Mail className="mr-2 h-4 w-4" />
            Send email to {activeEmail} for me
          </Button>
        )}
      </div>
      {showEmailButton && !activeEmailIsValid && (
        <p className="text-xs font-bold text-red-600">Enter a valid email to send through our system.</p>
      )}
      {error && <p className="text-sm font-bold text-red-600">{error}</p>}
    </div>
  )
}

function CopiedStep({
  firstName,
  error,
  isWorking,
  onConfirm,
}: {
  firstName: string
  error: string | null
  isWorking: boolean
  onConfirm: () => void
}) {
  return (
    <div className="space-y-5">
      <p className="text-xl font-black leading-snug">
        Now paste it into your texts, WhatsApp, email, Signal — whichever gets to {firstName} fastest. Come back here when
        you've sent it.
      </p>
      <Button
        type="button"
        onClick={onConfirm}
        disabled={isWorking}
        className="h-12 w-full border-4 border-primary bg-brutal-cyan font-black"
      >
        I sent it
      </Button>
      {error && <p className="text-sm font-bold text-red-600">{error}</p>}
    </div>
  )
}

function SentStep({
  email,
  error,
  onContinue,
}: {
  email: string
  error: string | null
  onContinue: () => void
}) {
  return (
    <div className="space-y-5">
      <p className="text-xl font-black leading-snug">
        Sent to {email}. We'll gently nudge them in 3 days if they haven't voted yet.
      </p>
      <Button
        type="button"
        onClick={onContinue}
        className="h-12 w-full border-4 border-primary bg-brutal-cyan font-black"
      >
        Continue
      </Button>
      {error && <p className="text-sm font-bold text-red-600">{error}</p>}
    </div>
  )
}

function ImpactStep({
  sentCount,
  lastFirstName,
  lastInviteeEmail,
  lastEmailProvided,
  onDone,
  onOneMore,
}: {
  sentCount: number
  lastFirstName: string
  lastInviteeEmail: string
  lastEmailProvided: boolean
  onDone: () => void
  onOneMore: () => void
}) {
  const pendingLives = sentCount * VOTER_LIVES_SAVED.value
  const livesText = formatLives(pendingLives)
  const firstSend = sentCount === 1

  return (
    <div className="space-y-5">
      {firstSend ? (
        <div className="space-y-4 text-xl font-black leading-snug">
          <p>
            When {lastFirstName} votes: +1 lifetime of suffering prevented. +
            <ParameterValue param={VOTER_LIVES_SAVED} format={{ precision: 1 }} /> lives saved.
          </p>
          <div className="border-4 border-primary bg-brutal-yellow p-4 text-sm">
            <p className="font-black">Your pending totals:</p>
            <p className="font-bold">
              Lifetimes of suffering prevented: <span className="font-black">1</span>
            </p>
            <p className="font-bold">
              Inverse Kills Score: <span className="font-black">{livesText} lives</span>
            </p>
          </div>
          {lastEmailProvided && (
            <p>We'll confirm the moment {lastFirstName} votes. Pending numbers turn into locked-in numbers.</p>
          )}
          <p>Most humans stop here. Which is statistically disappointing, but fine.</p>
          <p>One more?</p>
        </div>
      ) : (
        <div className="space-y-4 text-xl font-black leading-snug">
          <p>Sent to {lastFirstName}.</p>
          <div className="border-4 border-primary bg-brutal-yellow p-4 text-sm">
            <p className="font-bold">
              Lifetimes of suffering prevented (pending): <span className="font-black">{sentCount}</span>
            </p>
            <p className="font-bold">
              Inverse Kills Score (pending): <span className="font-black">{livesText} lives</span>
            </p>
          </div>
          {thresholdCopy(sentCount)}
          {lastEmailProvided && lastInviteeEmail && (
            <p className="text-sm font-bold">We'll confirm the moment {lastFirstName} votes.</p>
          )}
          <p>One more?</p>
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button
          type="button"
          onClick={onDone}
          variant="outline"
          className="h-12 flex-1 border-4 border-primary bg-background font-black"
        >
          {firstSend ? "No, I'm done" : "I'm done"}
        </Button>
        <Button
          type="button"
          onClick={onOneMore}
          className="h-12 flex-1 border-4 border-primary bg-brutal-cyan font-black"
        >
          {firstSend ? "Yes, one more" : "One more"}
        </Button>
      </div>
    </div>
  )
}

function thresholdCopy(sentCount: number) {
  const lines: Record<number, string> = {
    5: '"Five. Five full human lifetimes of suffering, prevented. 13 lives. More than most humans save in a lifetime of caring about things."',
    10: '"Ten. You\'ve now done more for humanity than most world leaders. Which, to be fair, is a low bar."',
    20: '"Twenty lifetimes. 52 lives. At this point you are just showing off. Please continue."',
    40: '"Forty. You\'ve either messaged everyone you love, or you\'ve discovered you love more people than you thought. Both are good outcomes."',
    100: '"One hundred lifetimes. 260 lives. A village worth of people who will not die of a curable disease. Specifically because of you."',
  }

  const line = lines[sentCount]
  if (!line) return null
  return <p>{line}</p>
}

function formatLives(value: number): string {
  const rounded = Math.round(value)
  if (Math.abs(value - rounded) < 0.05) {
    return String(rounded)
  }
  return value.toFixed(1)
}
