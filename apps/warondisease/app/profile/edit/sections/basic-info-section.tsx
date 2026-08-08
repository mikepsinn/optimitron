"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { updateUserProfile } from "@/app/dashboard/actions"
import { OrganizationSelector } from "@/components/dashboard/OrganizationSelector"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import countries from "world-countries"
import { useRouter } from "next/navigation"
import { getUsernameLengthHelpText, sanitizeUsernameInput } from "@/lib/username"

interface BasicInfoSectionProps {
  initialData: {
    name: string
    username: string
    email: string
    bio: string
    headline: string
    website: string
    coverImage: string
    location: string
    country: string
    isPublic: boolean
    organization: string | null
    organizationId: string | null
  }
}

const sortedCountries = countries
  .map((country) => ({
    code: country.cca2,
    name: country.name.common,
    flag: country.flag,
  }))
  .sort((a, b) => a.name.localeCompare(b.name))

export function BasicInfoSection({ initialData }: BasicInfoSectionProps) {
  const router = useRouter()
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isCountryOpen, setIsCountryOpen] = useState(false)
  const [form, setForm] = useState({
    name: initialData.name,
    username: initialData.username,
    bio: initialData.bio,
    headline: initialData.headline,
    website: initialData.website,
    coverImage: initialData.coverImage,
    location: initialData.location,
    country: initialData.country,
    organizationId: initialData.organizationId,
    organization: initialData.organization || "",
  })

  const handleUsernameChange = (value: string) => {
    const sanitized = sanitizeUsernameInput(value)
    setForm((prev) => ({ ...prev, username: sanitized }))
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)
      setError(null)

      await updateUserProfile({
        name: form.name,
        username: form.username,
        bio: form.bio,
        headline: form.headline || null,
        website: form.website || null,
        coverImage: form.coverImage || null,
        country: form.country || null,
        organizationId: form.organizationId,
      })

      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card className="border-2 border-primary">
      <CardHeader>
        <CardTitle className="text-2xl font-black uppercase">Basic Information</CardTitle>
        <CardDescription className="font-bold">
          Your core profile details
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label className="text-sm font-bold uppercase">Name</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="border-2 border-primary bg-background"
            />
          </div>
          <div>
            <Label className="text-sm font-bold uppercase">Handle</Label>
            <Input
              value={form.username}
              onChange={(e) => handleUsernameChange(e.target.value)}
              className="border-2 border-primary bg-background"
              placeholder="your_handle"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {getUsernameLengthHelpText()}
            </p>
          </div>
        </div>

        <div>
          <Label className="text-sm font-bold uppercase">Professional Headline</Label>
          <Input
            value={form.headline}
            onChange={(e) => setForm({ ...form, headline: e.target.value })}
            className="border-2 border-primary bg-background"
            placeholder="Software Engineer | AI Enthusiast"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Short professional tagline (shown on your profile)
          </p>
        </div>

        <div>
          <Label className="text-sm font-bold uppercase">Bio</Label>
          <Textarea
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
            className="border-2 border-primary bg-background"
            rows={4}
            placeholder="Tell us about yourself..."
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label className="text-sm font-bold uppercase">Website</Label>
            <Input
              value={form.website}
              onChange={(e) => setForm({ ...form, website: e.target.value })}
              className="border-2 border-primary bg-background"
              placeholder="https://yourwebsite.com"
              type="url"
            />
          </div>
          <div>
            <Label className="text-sm font-bold uppercase">Location</Label>
            <Input
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              className="border-2 border-primary bg-background"
              placeholder="San Francisco, CA"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label className="text-sm font-bold uppercase">Organization</Label>
            <OrganizationSelector
              value={form.organizationId}
              initialName={form.organization}
              onSelect={(orgId, orgName) => {
                setForm({
                  ...form,
                  organizationId: orgId,
                  organization: orgName || "",
                })
              }}
            />
          </div>
          <div>
            <Label className="text-sm font-bold uppercase">Country</Label>
            <Popover open={isCountryOpen} onOpenChange={setIsCountryOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={isCountryOpen}
                  className={cn(
                    "w-full justify-between border-2 border-primary bg-background",
                    !form.country && "text-muted-foreground"
                  )}
                >
                  {form.country
                    ? sortedCountries.find((country) => country.code === form.country)?.name
                    : "Select your country"}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[300px] p-0 border-2 border-primary">
                <Command>
                  <CommandInput placeholder="Search country..." />
                  <CommandList>
                    <CommandEmpty>No country found.</CommandEmpty>
                    <CommandGroup>
                      {sortedCountries.map((country) => (
                        <CommandItem
                          value={country.name}
                          key={country.code}
                          className="text-foreground"
                          onSelect={() => {
                            setForm({ ...form, country: country.code })
                            setIsCountryOpen(false)
                          }}
                        >
                          <span className="mr-2 text-lg">{country.flag}</span>
                          {country.name}
                          <Check
                            className={cn(
                              "ml-auto h-4 w-4",
                              country.code === form.country ? "opacity-100" : "opacity-0"
                            )}
                          />
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div>
          <Label className="text-sm font-bold uppercase">Cover Image URL</Label>
          <Input
            value={form.coverImage}
            onChange={(e) => setForm({ ...form, coverImage: e.target.value })}
            className="border-2 border-primary bg-background"
            placeholder="https://example.com/cover.jpg"
            type="url"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Profile banner image (recommended: 1500x500px)
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-100 border-2 border-red-600 rounded">
            <p className="text-sm font-bold text-red-600">{error}</p>
          </div>
        )}

        <div className="flex justify-end pt-4 border-t-2 border-primary">
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="border-2 border-primary bg-brutal-pink font-bold uppercase"
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
