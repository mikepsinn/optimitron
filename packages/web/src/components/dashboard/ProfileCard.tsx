"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Check, Copy, ExternalLink, Globe } from "lucide-react"
import { PrivacyToggle } from "@/components/dashboard/PrivacyToggle"
import type { DashboardUser } from "@/types/dashboard"
import Link from "next/link"

interface ProfileCardProps {
  user: DashboardUser
  onUserChange: (user: DashboardUser) => void
  onRefresh: () => void
}

export function ProfileCard({ user, onUserChange, onRefresh }: ProfileCardProps) {
  const [formError, setFormError] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({
    name: user.name,
    username: user.username || "",
    bio: user.bio,
    isPublic: user.isPublic,
    website: user.website || "",
    headline: user.headline || "",
    coverImage: user.coverImage || "",
  })
  const [isSaving, setIsSaving] = useState(false)
  const [isCopied, setIsCopied] = useState(false)
  const [origin, setOrigin] = useState("")

  useEffect(() => {
    setEditForm({
      name: user.name,
      username: user.username || "",
      bio: user.bio,
      isPublic: user.isPublic,
      website: user.website || "",
      headline: user.headline || "",
      coverImage: user.coverImage || "",
    })
  }, [user])

  useEffect(() => {
    setOrigin(window.location.origin)
  }, [])

  const handleUsernameChange = (value: string) => {
    const sanitized = value.replace(/[^a-zA-Z0-9_]/g, "")
    setEditForm((prev) => ({ ...prev, username: sanitized }))
  }

  const handleCopyUrl = () => {
    const url = `${origin}/u/${editForm.username}`
    navigator.clipboard.writeText(url)
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
  }

  const saveProfile = async () => {
    try {
      setIsSaving(true)
      setFormError(null)
      const res = await fetch("/api/dashboard/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editForm.name,
          username: editForm.username,
          bio: editForm.bio,
          isPublic: editForm.isPublic,
          website: editForm.website || null,
          headline: editForm.headline || null,
          coverImage: editForm.coverImage || null,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to update profile")
      }

      onUserChange({
        ...user,
        name: editForm.name,
        bio: editForm.bio,
        username: editForm.username ? editForm.username : null,
        isPublic: editForm.isPublic,
        website: editForm.website || null,
        headline: editForm.headline || null,
        coverImage: editForm.coverImage || null,
      })

      onRefresh()
    } catch (error) {
      console.error("Failed to update profile:", error)
      setFormError(error instanceof Error ? error.message : "Failed to update profile. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card className="border-2 border-primary">
      <CardHeader>
        <CardTitle className="text-2xl font-black uppercase">YOUR PROFILE</CardTitle>
        <CardDescription className="font-bold">Manage your public presence</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-bold uppercase">Name</Label>
            <Input
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              className="border-2 border-primary bg-background"
            />
          </div>
          <div>
            <Label className="text-sm font-bold uppercase">Handle</Label>
            <Input
              value={editForm.username}
              onChange={(e) => handleUsernameChange(e.target.value)}
              className="border-2 border-primary bg-background"
              placeholder="your_handle"
            />
            <p className="text-xs text-muted-foreground mt-1">
              3-24 characters. Letters, numbers, and underscores only.
            </p>
          </div>
          <div>
            <Label className="text-sm font-bold uppercase">Bio</Label>
            <Textarea
              value={editForm.bio}
              onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
              className="border-2 border-primary bg-background"
              rows={3}
            />
          </div>
          <div>
            <Label className="text-sm font-bold uppercase">Professional Headline</Label>
            <Input
              value={editForm.headline}
              onChange={(e) => setEditForm({ ...editForm, headline: e.target.value })}
              className="border-2 border-primary bg-background"
              placeholder="Software Engineer | AI Enthusiast"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Short professional tagline (shown on your profile)
            </p>
          </div>
          <div>
            <Label className="text-sm font-bold uppercase">Website</Label>
            <Input
              value={editForm.website}
              onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
              className="border-2 border-primary bg-background"
              placeholder="https://yourwebsite.com"
              type="url"
            />
          </div>
          <div>
            <Label className="text-sm font-bold uppercase">Cover Image URL</Label>
            <Input
              value={editForm.coverImage}
              onChange={(e) => setEditForm({ ...editForm, coverImage: e.target.value })}
              className="border-2 border-primary bg-background"
              placeholder="https://example.com/cover.jpg"
              type="url"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Profile banner image (recommended: 1500x500px)
            </p>
          </div>
        </div>

        <div className="space-y-3 pt-2">
          <Label className="text-sm font-bold uppercase mb-2 block">Privacy Settings</Label>
          <PrivacyToggle
            isPublic={editForm.isPublic}
            onChange={(value) => setEditForm({ ...editForm, isPublic: value })}
          />

          {editForm.isPublic && editForm.username && (
            <div className="mt-4 p-4 bg-muted/30 border-2 border-primary border-dashed rounded-lg animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between mb-2">
                <Label className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1">
                  <Globe className="w-3 h-3" />
                  Public Profile Link
                </Label>
                <Link
                  href={`/u/${editForm.username}`}
                  target="_blank"
                  className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                >
                  View Profile <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={`${origin}/u/${editForm.username}`}
                  className="bg-background border-2 border-primary h-9 font-mono text-sm"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopyUrl}
                  className="border-2 border-primary shrink-0 w-24"
                >
                  {isCopied ? (
                    <>
                      <Check className="w-4 h-4 mr-1" /> Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-1" /> Copy
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end pt-4 border-t-2 border-primary">
          <Button onClick={saveProfile} disabled={isSaving} className="border-2 border-primary bg-brutal-pink w-full sm:w-auto">
            {isSaving ? "Saving..." : "Update Profile"}
          </Button>
        </div>

        {formError && <p className="text-sm font-bold text-red-600">{formError}</p>}
      </CardContent>
    </Card>
  )
}
