"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Check, Copy, Settings } from "lucide-react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PrivacyToggle } from "@/components/dashboard/PrivacyToggle"
import type { DashboardData } from "@/types/dashboard"
import { ROUTES, buildRoute } from "@/lib/routes"
import { updateUserProfile } from "@/app/dashboard/actions"
import { getUsernameLengthHelpText, sanitizeUsernameInput } from "@/lib/username"

interface ProfileCardProps {
  user: DashboardData["user"]
}

export function ProfileCard({ user }: ProfileCardProps) {
  const router = useRouter()
  const [origin, setOrigin] = useState("")
  const [isCopied, setIsCopied] = useState(false)
  const [name, setName] = useState(user.name || "")
  const [username, setUsername] = useState(user.username || "")
  const [isPublic, setIsPublic] = useState(user.isPublic)
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    setOrigin(window.location.origin)
  }, [])

  useEffect(() => {
    setName(user.name || "")
    setUsername(user.username || "")
    setIsPublic(user.isPublic)
  }, [user.name, user.username, user.isPublic])

  const trimmedName = name.trim()
  const trimmedUsername = username.trim()
  const publicProfileUrl = trimmedUsername && origin ? `${origin}${buildRoute.userProfile(trimmedUsername)}` : null
  const hasChanges = trimmedName !== user.name || trimmedUsername !== (user.username || "") || isPublic !== user.isPublic
  const hasLinkChanges = trimmedUsername !== (user.username || "") || isPublic !== user.isPublic

  const clearStatus = () => {
    if (formError) {
      setFormError(null)
    }
    if (saveMessage) {
      setSaveMessage(null)
    }
  }

  const handleNameChange = (value: string) => {
    setName(value)
    clearStatus()
  }

  const handleUsernameChange = (value: string) => {
    setUsername(sanitizeUsernameInput(value))
    clearStatus()
  }

  const handleSaveQuickSettings = async () => {
    if (!hasChanges) {
      return
    }

    try {
      setIsSaving(true)
      setFormError(null)
      setSaveMessage(null)
      await updateUserProfile({
        name: trimmedName,
        username: trimmedUsername,
        isPublic,
      })
      setSaveMessage("Saved.")
      router.refresh()
    } catch (error) {
      console.error("Failed to update quick profile settings:", error)
      setFormError(error instanceof Error ? error.message : "Failed to save quick settings.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleCopyUrl = async () => {
    if (!publicProfileUrl) {
      return
    }

    try {
      await navigator.clipboard.writeText(publicProfileUrl)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    } catch (error) {
      console.error("Failed to copy public profile URL:", error)
    }
  }

  return (
    <Card className="border-2 border-primary">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <CardTitle className="truncate text-2xl font-black uppercase">Profile</CardTitle>
          </div>

          <Button asChild className="border-2 border-primary bg-brutal-pink shrink-0">
            <Link href={ROUTES.profileEdit}>Edit Full Profile</Link>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-4">
          <div>
            <Label className="text-xs font-black uppercase text-muted-foreground mb-1 block">Name</Label>
            <Input
              value={name}
              onChange={(event) => handleNameChange(event.target.value)}
              className="border-2 border-primary bg-background"
              placeholder="Your name"
            />
          </div>

          <div>
            <Label className="text-xs font-black uppercase text-muted-foreground mb-1 block">Handle</Label>
            <Input
              value={username}
              onChange={(event) => handleUsernameChange(event.target.value)}
              className="border-2 border-primary bg-background"
              placeholder="your_handle"
            />
            <p className="mt-1 text-xs font-bold text-muted-foreground">{getUsernameLengthHelpText()}</p>
          </div>

          <div>
            <p className="text-xs font-black uppercase text-muted-foreground mb-2">Privacy</p>
            <PrivacyToggle
              isPublic={isPublic}
              onChange={(nextValue) => {
                setIsPublic(nextValue)
                clearStatus()
              }}
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={handleSaveQuickSettings}
              disabled={!hasChanges || isSaving}
              className="border-2 border-primary bg-brutal-pink"
            >
              {isSaving ? "Saving..." : "Save"}
            </Button>
            {saveMessage && <p className="text-sm font-bold text-foreground">{saveMessage}</p>}
            {formError && <p className="text-sm font-bold text-red-600">{formError}</p>}
          </div>
        </div>

        {isPublic && publicProfileUrl && !hasLinkChanges ? (
          <div className="border-2 border-primary border-dashed bg-muted/30 p-4">
            <p className="text-xs font-black uppercase text-muted-foreground mb-2">Public Profile Link</p>
            <div className="flex items-center gap-2">
              <div className="min-w-0 flex-1 border-2 border-primary bg-background px-3 py-2 font-mono text-xs font-bold">
                <span className="block truncate">{publicProfileUrl}</span>
              </div>
              <Button
                variant="outline"
                onClick={handleCopyUrl}
                className="border-2 border-primary shrink-0"
              >
                {isCopied ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : hasLinkChanges ? (
          <div className="border-2 border-primary border-dashed bg-muted/30 p-4">
            <p className="text-sm font-bold text-muted-foreground">
              Save your handle/privacy changes to update your public profile link.
            </p>
          </div>
        ) : (
          <div className="border-2 border-primary border-dashed bg-muted/30 p-4">
            <p className="text-sm font-bold text-muted-foreground">
              Add a handle and make your profile public on the profile page to get a shareable profile link.
            </p>
          </div>
        )}

        <div className="flex flex-wrap gap-3 pt-2">
          <Button asChild variant="outline" className="border-2 border-primary">
            <Link href={ROUTES.dashboardSettings}>
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
