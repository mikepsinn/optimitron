"use client"

import { useState } from "react"
import { Card } from "@/components/retroui/Card"
import { Button } from "@/components/retroui/Button"
import { Copy, Check, Mail } from "lucide-react"
import {
  VOTER_LIVES_SAVED,
  VOTER_SUFFERING_HOURS_PREVENTED,
  EFFICACY_LAG_YEARS,
} from "@/lib/parameters-calculations-citations"

interface EmailSignatureCardProps {
  referralLink: string
  userName: string
}

const LIVES_PER_VOTE = VOTER_LIVES_SAVED.value.toFixed(1)
const HOURS_PER_YEAR = 8_760
const SUFFERING_YEARS = Math.round(
  VOTER_SUFFERING_HOURS_PREVENTED.value / HOURS_PER_YEAR,
)
const EFFICACY_LAG = EFFICACY_LAG_YEARS.value

export function EmailSignatureCard({ referralLink, userName }: EmailSignatureCardProps) {
  const [copied, setCopied] = useState(false)

  const generateSignature = () => {
    return `<div style="margin-top: 20px; padding-top: 15px; border-top: 2px solid #000;">
  <p style="margin: 0; font-family: Arial, sans-serif; font-size: 14px; color: #000;">
    <strong>${userName}</strong>
  </p>
  <p style="margin: 5px 0 0 0; font-family: Arial, sans-serif; font-size: 12px; color: #666;">
    🌍 <strong>Help Optimize Earth:</strong>
    <a href="${referralLink}" style="color: #FF6B9D; font-weight: bold; text-decoration: none;">Vote to accelerate cures by ${EFFICACY_LAG} years</a>
  </p>
  <p style="margin: 3px 0 0 0; font-family: Arial, sans-serif; font-size: 11px; color: #999;">
    ${LIVES_PER_VOTE} lives saved + ${SUFFERING_YEARS} years of suffering prevented per vote (30 sec)
  </p>
</div>`
  }

  const copySignature = async () => {
    try {
      const signature = generateSignature()

      const tempElement = document.createElement("div")
      tempElement.innerHTML = signature
      document.body.appendChild(tempElement)

      const range = document.createRange()
      range.selectNode(tempElement)
      window.getSelection()?.removeAllRanges()
      window.getSelection()?.addRange(range)
      document.execCommand("copy")

      window.getSelection()?.removeAllRanges()
      document.body.removeChild(tempElement)

      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      await navigator.clipboard.writeText(generateSignature())
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <Card className="border-4 border-primary mb-8">
      <Card.Header>
        <Card.Title className="text-2xl font-black uppercase flex items-center gap-2">
          <Mail className="h-6 w-6" />
          Email Signature Generator
        </Card.Title>
        <Card.Description className="font-bold">
          Paste this into your email signature. Every email becomes a tiny act of civilisation repair. Zero effort on your part, which I&apos;ve learned is important
        </Card.Description>
      </Card.Header>
      <Card.Content>
        <div className="space-y-4">
          <div className="border-4 border-primary p-4 bg-background">
            <p className="text-xs text-muted-foreground mb-3 font-bold uppercase">Preview:</p>
            <div
              dangerouslySetInnerHTML={{ __html: generateSignature() }}
              className="text-sm"
            />
          </div>

          <Button
            onClick={() => void copySignature()}
            className="w-full bg-brutal-pink hover:bg-brutal-yellow border-4 border-primary font-black uppercase"
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

          <div className="text-xs text-muted-foreground space-y-1">
            <p className="font-bold uppercase mb-2">How to add:</p>
            <p><strong>Gmail:</strong> Settings → Signature → Paste → Save</p>
            <p><strong>Outlook:</strong> File → Options → Mail → Signatures → Paste</p>
            <p><strong>Apple Mail:</strong> Preferences → Signatures → Paste</p>
          </div>
        </div>
      </Card.Content>
    </Card>
  )
}
