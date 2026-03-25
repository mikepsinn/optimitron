"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/retroui/Button"
import { Input } from "@/components/retroui/Input"
import { Label } from "@/components/retroui/Label"
import { Textarea } from "@/components/retroui/Textarea"
import { ArrowRight, Loader2, CheckCircle } from "lucide-react"

interface OrganizationResult {
    id: string
    name: string
    slug: string
}

interface OrganizationFormProps {
    onSuccess?: (org: OrganizationResult) => void
    onCancel?: () => void
    compact?: boolean
    initialName?: string
}

export function OrganizationForm({ onSuccess, onCancel, compact = false, initialName = "" }: OrganizationFormProps) {
    const router = useRouter()
    const [formSubmitted, setFormSubmitted] = useState(false)
    const [isCreating, setIsCreating] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const [orgName, setOrgName] = useState(initialName)
    const [website, setWebsite] = useState("")
    const [description, setDescription] = useState("")
    const [createdOrg, setCreatedOrg] = useState<OrganizationResult | null>(null)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setIsCreating(true)

        try {
            if (!orgName.trim()) {
                throw new Error("Organization name is required")
            }

            const response = await fetch("/api/organizations", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: orgName.trim(),
                    website: website.trim() || undefined,
                    description: description.trim() || undefined,
                }),
            })

            const result = await response.json()

            if (!response.ok) {
                throw new Error(result.error || "Failed to create organization")
            }

            if (result.success && result.organization) {
                setCreatedOrg(result.organization)
                setFormSubmitted(true)
                if (onSuccess) {
                    onSuccess(result.organization)
                }
            }
        } catch (err) {
            console.error("Failed to create organization:", err)
            setError(err instanceof Error ? err.message : "Failed to create organization")
        } finally {
            setIsCreating(false)
        }
    }

    if (formSubmitted && createdOrg) {
        return (
            <div className={`space-y-4 ${compact ? "p-0" : "p-8 bg-background border-4 border-primary shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"}`}>
                <div className="p-4 bg-brutal-yellow border-4 border-primary">
                    <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="h-5 w-5 text-foreground" />
                        <span className="font-black uppercase text-foreground">ORGANIZATION CREATED</span>
                    </div>
                    <p className="font-bold text-foreground text-lg">{createdOrg.name}</p>
                </div>

                {!compact && (
                    <div className="flex justify-center">
                        <Button
                            onClick={() => router.push(`/dashboard/organizations/${createdOrg.slug}`)}
                            className="bg-foreground text-background border-4 border-primary hover:bg-brutal-pink hover:text-foreground font-black uppercase"
                        >
                            Manage Organization
                        </Button>
                    </div>
                )}
            </div>
        )
    }

    return (
        <div className={compact ? "" : "p-8 bg-background border-4 border-primary shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"}>
            <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                    <div className="p-3 bg-red-100 border-4 border-red-500 text-red-700 font-bold text-sm">
                        {error}
                    </div>
                )}

                <div>
                    <Label htmlFor="org-name" className="text-foreground font-black uppercase mb-1 block text-sm">
                        Organization Name *
                    </Label>
                    <Input
                        id="org-name"
                        value={orgName}
                        onChange={(e) => setOrgName(e.target.value)}
                        placeholder="Your Organization"
                        className="border-4 border-primary shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-bold bg-background text-foreground"
                        required
                        autoFocus
                    />
                </div>

                <div>
                    <Label htmlFor="org-website" className="text-foreground font-black uppercase mb-1 block text-sm">
                        Website (optional)
                    </Label>
                    <Input
                        id="org-website"
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                        type="url"
                        placeholder="https://yourorganization.org"
                        className="border-4 border-primary shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-bold bg-background text-foreground"
                    />
                </div>

                <div>
                    <Label htmlFor="org-description" className="text-foreground font-black uppercase mb-1 block text-sm">
                        About (optional)
                    </Label>
                    <Textarea
                        id="org-description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Brief description..."
                        className="border-4 border-primary shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-bold min-h-[80px] bg-background text-foreground"
                    />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                    {onCancel && (
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onCancel}
                            disabled={isCreating}
                            className="border-4 border-primary font-bold uppercase"
                        >
                            Cancel
                        </Button>
                    )}
                    <Button
                        type="submit"
                        disabled={isCreating}
                        className="bg-foreground text-background border-4 border-primary hover:bg-brutal-pink hover:text-foreground font-black uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                    >
                        {isCreating ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...
                            </>
                        ) : (
                            <>
                                Create <ArrowRight className="ml-2 h-4 w-4" />
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    )
}
