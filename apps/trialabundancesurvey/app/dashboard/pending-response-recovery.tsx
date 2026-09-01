"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useState } from "react"

import { Button } from "@optimitron/neobrutalist-ui/ui/button"
import { storage } from "@/lib/storage"
import { syncPendingTrialAbundanceResponse } from "@/lib/trial-abundance-survey"

type RecoveryState = "checking" | "missing" | "saving" | "saved" | "error"

export function PendingResponseRecovery() {
  const router = useRouter()
  const [state, setState] = useState<RecoveryState>("checking")

  const recoverResponse = useCallback(async () => {
    if (!storage.getPendingTrialAbundanceResponse()) {
      setState("missing")
      return
    }

    setState("saving")
    const saved = await syncPendingTrialAbundanceResponse()
    if (!saved) {
      setState("error")
      return
    }

    setState("saved")
    router.refresh()
  }, [router])

  useEffect(() => {
    void recoverResponse()
  }, [recoverResponse])

  if (state === "checking" || state === "saving") {
    return (
      <p className="text-lg font-bold" aria-live="polite">
        Saving the response from this browser…
      </p>
    )
  }

  if (state === "saved") {
    return (
      <p className="text-lg font-bold" aria-live="polite">
        Response saved. Loading it now…
      </p>
    )
  }

  if (state === "error") {
    return (
      <div className="space-y-4" aria-live="polite">
        <p className="text-lg font-bold">
          Your response is still saved in this browser, but the server could not
          save it yet.
        </p>
        <Button type="button" onClick={() => void recoverResponse()}>
          Retry save
        </Button>
      </div>
    )
  }

  return (
    <p className="text-lg font-bold">
      No response on file yet.{" "}
      <Link href="/#vote" className="underline">
        Take the survey
      </Link>
    </p>
  )
}
