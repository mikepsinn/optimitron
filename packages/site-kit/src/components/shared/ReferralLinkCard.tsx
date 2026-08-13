"use client"

import { useEffect, useMemo, useState } from "react"
import { Card } from "@optimitron/neobrutalist-ui/ui/card"
import { Button } from "@optimitron/neobrutalist-ui/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@optimitron/neobrutalist-ui/ui/select"
import { CopyLinkButton } from "../sharing/copy-link-button"
import { SocialShareButtons } from "../sharing/social-share-buttons"
import { SHARE_TEXT } from "../../lib/constants"
import { trackCopyLink } from "../../lib/analytics"
import { getDefaultShareTemplates, type ShareTemplateOption } from "../../lib/share-copy"
import { cn } from "@optimitron/neobrutalist-ui/cn"
import { Check, Copy } from "lucide-react"

interface ReferralLinkCardProps {
  referralLink: string
  shareTemplates?: ShareTemplateOption[]
  className?: string
  id?: string
  introText?: string
  copyLinkLabel?: string
  linkContentType?: string
  frameless?: boolean
}

export function ReferralLinkCard({
  referralLink,
  shareTemplates,
  className = "",
  id,
  introText = "Help us get 4 billion votes and eradicate disease 12.3 times faster by sharing with all your friends!",
  copyLinkLabel = "COPY REFERRAL LINK",
  linkContentType = "referral_link",
  frameless = false,
}: ReferralLinkCardProps) {
  const [copiedText, setCopiedText] = useState(false)
  const defaultTemplates = useMemo(() => getDefaultShareTemplates(referralLink), [referralLink])
  const resolvedTemplates = shareTemplates && shareTemplates.length > 0 ? shareTemplates : defaultTemplates
  const [selectedLabel, setSelectedLabel] = useState(resolvedTemplates[0]?.label ?? "")

  useEffect(() => {
    if (!resolvedTemplates.some((template) => template.label === selectedLabel)) {
      setSelectedLabel(resolvedTemplates[0]?.label ?? "")
    }
  }, [resolvedTemplates, selectedLabel])

  const selectedTemplate =
    resolvedTemplates.find((template) => template.label === selectedLabel) ?? resolvedTemplates[0]

  const socialShareText = selectedTemplate
    ? selectedTemplate.text.replace(referralLink, "").trim()
    : SHARE_TEXT.LANDING

  const copyShareText = async () => {
    if (!selectedTemplate) {
      return
    }

    try {
      await navigator.clipboard.writeText(selectedTemplate.text)
      setCopiedText(true)
      trackCopyLink({
        contentType: `${linkContentType}_message`,
        url: referralLink,
      })
      setTimeout(() => setCopiedText(false), 2000)
    } catch (err) {
      console.error("Failed to copy share text:", err)
    }
  }

  const content = (
    <>
      <p className="font-bold text-base sm:text-lg text-center mb-2">
        {introText}
      </p>

      {selectedTemplate && (
        <>
          <div className="mb-4">
            <p className="text-xs font-black uppercase text-muted-foreground mb-2">Step 1. Select Share Message</p>
            <Select value={selectedLabel} onValueChange={setSelectedLabel}>
              <SelectTrigger className="h-12 border-4 border-primary rounded-none bg-background font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <SelectValue placeholder="Choose a share template" />
              </SelectTrigger>
              <SelectContent className="border-4 border-primary rounded-none">
                {resolvedTemplates.map((template) => (
                  <SelectItem key={template.label} value={template.label} className="font-bold uppercase">
                    {template.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="mb-3 border-4 border-primary bg-brutal-yellow/10 p-4">
            <p className="text-xs font-black uppercase text-muted-foreground mb-2">Share Text</p>
            <p className="text-sm text-foreground/80 whitespace-pre-wrap">{selectedTemplate.text}</p>
          </div>

          <Button
            onClick={copyShareText}
            className="mb-4 w-full h-14 text-lg font-black uppercase bg-brutal-pink hover:bg-brutal-pink/90 text-foreground border-4 border-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 transition-all flex items-center justify-center gap-2"
          >
            {copiedText ? (
              <>
                <Check className="w-5 h-5" />
                MESSAGE COPIED!
              </>
            ) : (
              <>
                <Copy className="w-5 h-5" />
                2. COPY SHARE TEXT
              </>
            )}
          </Button>
        </>
      )}

      <SocialShareButtons
        url={referralLink}
        text={socialShareText}
        hashtags={SHARE_TEXT.HASHTAGS}
        contentType={linkContentType}
        trailingAction={
          <CopyLinkButton
            link={referralLink}
            variant="share"
            label={copyLinkLabel}
            copiedLabel="COPIED!"
            contentType={linkContentType}
            className="w-auto h-10 shrink-0 px-4 text-sm"
          />
        }
      />
    </>
  )

  if (frameless) {
    return (
      <div className={cn("space-y-0", className)} id={id}>
        {content}
      </div>
    )
  }

  return (
    <Card
      className={cn(
        "bg-background border-4 border-primary p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]",
        className,
      )}
      id={id}
    >
      {content}
    </Card>
  )
}
