"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/retroui/Button"
import { Card } from "@/components/retroui/Card"
import { Label } from "@/components/retroui/Label"
import {
  EMAIL_SCOPES,
  NON_TRANSACTIONAL_SCOPES,
  type EmailScope,
} from "@/lib/email/scopes"
import type { EmailPreferencesState } from "@/types/settings"

interface EmailPreferencesCardProps {
  initialPreferences: EmailPreferencesState
  onRefresh: () => void
}

function isMasterDisabled(preferences: EmailPreferencesState): boolean {
  return (
    !preferences.newsletterSubscribed ||
    preferences.unsubscribedScopes.includes("all")
  )
}

function normalizeLocalPreferences(
  newsletterSubscribed: boolean,
  unsubscribedScopes: readonly EmailScope[],
): EmailPreferencesState {
  const uniqueScopes = Array.from(new Set(unsubscribedScopes))
  if (!newsletterSubscribed || uniqueScopes.includes("all")) {
    return {
      newsletterSubscribed: false,
      unsubscribedScopes: [
        ...uniqueScopes.filter((scope) => scope !== "all"),
        "all",
      ],
    }
  }

  return {
    newsletterSubscribed: true,
    unsubscribedScopes: uniqueScopes.filter((scope) => scope !== "all"),
  }
}

export function EmailPreferencesCard({
  initialPreferences,
  onRefresh,
}: EmailPreferencesCardProps) {
  const [preferences, setPreferences] = useState(initialPreferences)
  const [error, setError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)

  useEffect(() => {
    setPreferences(initialPreferences)
  }, [initialPreferences])

  const persistPreferences = (nextPreferences: EmailPreferencesState) => {
    void (async () => {
      try {
        setIsPending(true)
        setError(null)
        const response = await fetch("/api/settings/email-preferences", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(nextPreferences),
        })

        if (!response.ok) {
          const payload = await response.json().catch(() => null)
          setError(payload?.error ?? "Failed to update email preferences.")
          return
        }

        const payload = await response.json()
        setPreferences(payload.emailPreferences)
        onRefresh()
      } catch (updateError) {
        console.error("Failed to update email preferences:", updateError)
        setError("Failed to update email preferences.")
      } finally {
        setIsPending(false)
      }
    })()
  }

  const toggleMaster = () => {
    const nextMasterEnabled = isMasterDisabled(preferences)
    const nextPreferences = normalizeLocalPreferences(
      nextMasterEnabled,
      nextMasterEnabled
        ? preferences.unsubscribedScopes.filter((scope) => scope !== "all")
        : preferences.unsubscribedScopes,
    )
    void persistPreferences(nextPreferences)
  }

  const toggleScope = (scope: EmailScope) => {
    if (isMasterDisabled(preferences)) {
      return
    }

    const nextScopes = preferences.unsubscribedScopes.includes(scope)
      ? preferences.unsubscribedScopes.filter((candidate) => candidate !== scope)
      : [...preferences.unsubscribedScopes, scope]

    void persistPreferences(
      normalizeLocalPreferences(preferences.newsletterSubscribed, nextScopes),
    )
  }

  const masterDisabled = isMasterDisabled(preferences)

  return (
    <Card className="border-4 border-primary mb-8" id="email-preferences">
      <Card.Header>
        <Card.Title className="text-2xl font-black uppercase">
          EMAIL PREFERENCES
        </Card.Title>
        <Card.Description className="font-bold">
          The canonical place for non-transactional email. Sign-in and security
          mail still bypasses this, because civilisation would collapse
          otherwise.
        </Card.Description>
      </Card.Header>
      <Card.Content className="space-y-4">
        <div className="border-4 border-primary bg-background p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Label className="text-sm font-black uppercase">
                All Non-Essential Email
              </Label>
              <p className="text-xs text-muted-foreground">
                Master switch for onboarding, reminders, and future campaign
                email categories.
              </p>
            </div>
            <Button
              type="button"
              variant={masterDisabled ? "outline" : "default"}
              onClick={toggleMaster}
              disabled={isPending}
              className="border-4 border-primary min-w-28"
            >
              {masterDisabled ? "OFF" : "ON"}
            </Button>
          </div>
        </div>

        {NON_TRANSACTIONAL_SCOPES.map((scope) => {
          const descriptor = EMAIL_SCOPES[scope]
          const enabled =
            !masterDisabled && !preferences.unsubscribedScopes.includes(scope)

          return (
            <div
              key={scope}
              className="grid grid-cols-1 gap-3 border-4 border-primary bg-background p-4 sm:grid-cols-[1fr_auto]"
            >
              <div>
                <Label className="text-sm font-black uppercase">
                  {descriptor.label}
                </Label>
                {descriptor.description ? (
                  <p className="text-xs text-muted-foreground">
                    {descriptor.description}
                  </p>
                ) : null}
              </div>
              <Button
                type="button"
                variant={enabled ? "default" : "outline"}
                onClick={() => toggleScope(scope)}
                disabled={isPending || masterDisabled}
                className="border-4 border-primary min-w-28"
              >
                {enabled ? "ON" : "OFF"}
              </Button>
            </div>
          )
        })}

        <div className="border-2 border-dashed border-primary bg-muted p-4">
          <p className="text-sm font-bold">
            {masterDisabled
              ? "Master email is off. Turn it back on before any category-level toggle can deliver mail."
              : "Category toggles work only for non-transactional mail. Security and sign-in messages stay on."}
          </p>
        </div>

        {error ? (
          <p className="text-sm font-bold text-red-600">{error}</p>
        ) : null}
      </Card.Content>
    </Card>
  )
}
