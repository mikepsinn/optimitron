"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Copy, Check, Mail } from "lucide-react"
import { getShareWebsiteLabel, SHARE_COPY_FACTS } from "@/lib/share-copy"

interface OrganizationEmailSignatureCardProps {
  surveyLink: string
  organizationName: string
  userName: string
}

export function OrganizationEmailSignatureCard({ surveyLink, organizationName, userName }: OrganizationEmailSignatureCardProps) {
  const [copied, setCopied] = useState(false)

  // Generate HTML email signature
  const generateSignature = () => {
    const websiteLabel = getShareWebsiteLabel(surveyLink)

    return `<div style="margin-top: 20px; padding-top: 15px; border-top: 2px solid #000;">
  <p style="margin: 0; font-family: Arial, sans-serif; font-size: 14px; color: #000;">
    <strong>${userName}</strong>
  </p>
  <p style="margin: 6px 0 0 0; font-family: Arial, sans-serif; font-size: 12px; color: #444;">
    ${organizationName} asks supporters to weigh a simple tradeoff: it takes only ${SHARE_COPY_FACTS.nuclearWinterWarheads} nuclear weapons to trigger a nuclear winter, yet humanity budgets for ${SHARE_COPY_FACTS.apocalypseBudget} apocalypses.
  </p>
  <p style="margin: 4px 0 0 0; font-family: Arial, sans-serif; font-size: 11px; color: #666;">
    We propose settling for ${SHARE_COPY_FACTS.proposedApocalypseBudget} in exchange for curing disease ${SHARE_COPY_FACTS.trialCapacityMultiplier} times faster.
  </p>
  <p style="margin: 4px 0 0 0; font-family: Arial, sans-serif; font-size: 11px; color: #666;">
    Redirecting 1% of military spending to clinical trials could compress the timeline of disease eradication from ${SHARE_COPY_FACTS.statusQuoTimelineYears} years to ${SHARE_COPY_FACTS.redirectedTimelineYears}.
  </p>
  <p style="margin: 4px 0 0 0; font-family: Arial, sans-serif; font-size: 11px;">
    <a href="${surveyLink}" style="color: #FF6B9D; font-weight: bold; text-decoration: none;">Take 30 seconds to eradicate disease at ${websiteLabel}</a>
  </p>
</div>`
  }

  const copySignature = async () => {
    try {
      const signature = generateSignature()

      // Create a temporary element to copy HTML
      const tempElement = document.createElement("div")
      tempElement.innerHTML = signature
      document.body.appendChild(tempElement)

      // Select and copy
      const range = document.createRange()
      range.selectNode(tempElement)
      window.getSelection()?.removeAllRanges()
      window.getSelection()?.addRange(range)
      document.execCommand("copy")

      // Clean up
      window.getSelection()?.removeAllRanges()
      document.body.removeChild(tempElement)

      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
      // Fallback: copy as plain text
      await navigator.clipboard.writeText(generateSignature())
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <Card className="border-2 border-primary mb-8">
      <CardHeader>
        <CardTitle className="text-2xl font-black uppercase flex items-center gap-2">
          <Mail className="h-6 w-6" />
          Email Signature Generator
        </CardTitle>
        <CardDescription className="font-bold">
          Add to every email you send - passive sharing, zero effort
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Preview */}
          <div className="border-2 border-primary p-4 bg-background">
            <p className="text-xs text-muted-foreground mb-3 font-bold uppercase">Preview:</p>
            <div
              dangerouslySetInnerHTML={{ __html: generateSignature() }}
              className="text-sm"
            />
          </div>

          {/* Copy Button */}
          <Button
            onClick={copySignature}
            className="w-full bg-brutal-pink hover:bg-brutal-yellow border-2 border-primary font-black uppercase"
          >
            {copied ? (
              <>
                <Check className="h-5 w-5 mr-2" />
                Copied to Clipboard!
              </>
            ) : (
              <>
                <Copy className="h-5 w-5 mr-2" />
                Copy Email Signature
              </>
            )}
          </Button>

          {/* Instructions */}
          <div className="text-xs text-muted-foreground space-y-1">
            <p className="font-bold uppercase mb-2">How to add:</p>
            <p><strong>Gmail:</strong> Settings → Signature → Paste → Save</p>
            <p><strong>Outlook:</strong> File → Options → Mail → Signatures → Paste</p>
            <p><strong>Apple Mail:</strong> Preferences → Signatures → Paste</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
