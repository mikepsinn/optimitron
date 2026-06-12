"use client"

import { IDKitRequestWidget, orbLegacy } from "@worldcoin/idkit"
import { ShieldCheck, ShieldQuestion } from "lucide-react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { useState, useTransition } from "react"
import { Button } from "@/components/retroui/Button"
import { PersonhoodStatusBadge } from "@/components/personhood/PersonhoodStatusBadge"
import { AlertCard } from "@/components/ui/alert-card"
import { API_ROUTES } from "@/lib/api-routes"
import { clientEnv } from "@/lib/env"
import { createLogger } from "@/lib/logger"
import type { WorldIdRequestPayload, WorldIdVerificationPayload } from "@/lib/world-id"
import { useWishPoints } from "@/components/wishes/WishPointProvider"

const logger = createLogger("world-id-verification-inline")

export function WorldIdVerificationInline() {
  const router = useRouter()
  const { data: session, update } = useSession()
  const { showWishReward } = useWishPoints()
  const [requestPayload, setRequestPayload] = useState<WorldIdRequestPayload | null>(null)
  const [requestError, setRequestError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isLoadingRequest, setIsLoadingRequest] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isWidgetOpen, setIsWidgetOpen] = useState(false)
  const [isRefreshing, startRefresh] = useTransition()
  const worldIdEnabled = clientEnv.NEXT_PUBLIC_WORLD_ID_ENABLED !== "false"
  const sessionUser = session?.user
  const isVerified = Boolean(sessionUser?.personhoodVerified)

  if (!sessionUser?.id) {
    return null
  }

  async function handleStartVerification() {
    setRequestError(null)
    setSuccessMessage(null)
    setIsLoadingRequest(true)

    try {
      const response = await fetch(API_ROUTES.personhood.worldIdRequest)
      const payload = (await response.json().catch(() => null)) as
        | WorldIdRequestPayload
        | { error?: string }
        | null

      if (!response.ok) {
        throw new Error(payload && "error" in payload ? payload.error : "Unable to start personhood verification.")
      }

      setRequestPayload(payload as WorldIdRequestPayload)
      setIsWidgetOpen(true)
    } catch (error) {
      logger.error("Failed to load World ID request", error)
      setRequestPayload(null)
      setRequestError(
        error instanceof Error ? error.message : "Unable to start personhood verification right now.",
      )
    } finally {
      setIsLoadingRequest(false)
    }
  }

  async function handleVerify(result: WorldIdVerificationPayload) {
    setIsSubmitting(true)
    setRequestError(null)

    try {
      const response = await fetch(API_ROUTES.personhood.worldIdVerify, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(result),
      })
      const payload = (await response.json().catch(() => null)) as
        | { error?: string; wishesEarned?: number }
        | null

      if (!response.ok) {
        throw new Error(payload?.error ?? "Personhood verification failed.")
      }

      if (payload?.wishesEarned) {
        try {
          showWishReward(payload.wishesEarned, "Verified Personhood")
        } catch {
          // noop
        }
      }
    } catch (error) {
      setRequestError(
        error instanceof Error ? error.message : "Personhood verification failed.",
      )
      throw error
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleSuccess() {
    setSuccessMessage("Verified. Your account now counts as a confirmed person.")
    await update({ refreshPersonhood: true })
    startRefresh(() => {
      router.refresh()
    })
  }

  const verifiedDate = sessionUser.personhoodVerifiedAt
    ? new Date(sessionUser.personhoodVerifiedAt).toLocaleDateString()
    : null

  return (
    <div className="space-y-3">
      {successMessage ? <AlertCard type="success" message={successMessage} /> : null}
      {requestError ? <AlertCard type="error" message={requestError} /> : null}

      <div className="flex items-start justify-between gap-4 border-y border-foreground/30 bg-background py-4">
        <div className="flex min-w-0 items-start gap-3">
          {isVerified ? (
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-foreground" />
          ) : (
            <ShieldQuestion className="mt-0.5 h-5 w-5 shrink-0 text-foreground" />
          )}
          <div className="space-y-1">
            <p className="font-black">Personhood</p>
            <p className="text-sm text-muted-foreground">
              {isVerified
                ? "Proof of personhood is linked to this account."
                : worldIdEnabled
                  ? "Add a uniqueness proof on top of your sign-in so your civic input counts as human."
                  : "Personhood verification is disabled for this environment."}
            </p>
            {sessionUser.personhoodVerificationLevel ? (
              <p className="text-sm text-muted-foreground">
                Credential: {sessionUser.personhoodVerificationLevel}
              </p>
            ) : null}
            {verifiedDate ? (
              <p className="text-sm text-muted-foreground">Verified on {verifiedDate}.</p>
            ) : null}
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-3">
          <PersonhoodStatusBadge
            provider={sessionUser.personhoodProvider ?? null}
            verified={isVerified}
          />
          {!isVerified && worldIdEnabled ? (
            <Button
              type="button"
              className="font-bold uppercase"
              disabled={isLoadingRequest || isSubmitting || isRefreshing}
              onClick={() => {
                void handleStartVerification()
              }}
            >
              {isLoadingRequest
                ? "Preparing..."
                : isSubmitting || isRefreshing
                  ? "Verifying..."
                  : "Verify"}
            </Button>
          ) : null}
        </div>
      </div>

      {requestPayload ? (
        <IDKitRequestWidget
          open={isWidgetOpen}
          onOpenChange={setIsWidgetOpen}
          app_id={requestPayload.app_id}
          action={requestPayload.action}
          environment={requestPayload.environment}
          rp_context={requestPayload.rp_context}
          allow_legacy_proofs={requestPayload.allow_legacy_proofs}
          preset={orbLegacy({ signal: requestPayload.signal })}
          handleVerify={handleVerify}
          onSuccess={handleSuccess}
          onError={(errorCode) => {
            logger.error("World ID widget error", errorCode)
            setRequestError("Personhood verification was cancelled or could not be completed.")
          }}
        />
      ) : null}
    </div>
  )
}
