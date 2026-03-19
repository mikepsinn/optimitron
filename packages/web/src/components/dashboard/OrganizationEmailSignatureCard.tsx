"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Copy, Check, Mail } from "lucide-react"

interface OrganizationEmailSignatureCardProps {
  surveyLink: string
  organizationName: string
  userName: string
}

export function OrganizationEmailSignatureCard({ surveyLink, organizationName, userName }: OrganizationEmailSignatureCardProps) {
  const [copied, setCopied] = useState(false)

  const generateSignature = () => {
    return `<div style="margin-top: 20px; padding-top: 15px; border-top: 2px solid #000;">
  <p style="margin: 0; font-family: Arial, sans-serif; font-size: 14px; color: #000;">
    <strong>${userName}</strong>
  </p>
  <p style="margin: 5px 0 0 0; font-family: Arial, sans-serif; font-size: 12px; color: #666;">
    <strong>Help optimize governance:</strong>
    <a href="${surveyLink}" style="color: #FF6B9D; font-weight: bold; text-decoration: none;">${organizationName}'s Priority Survey</a>
  </p>
  <p style="margin: 3px 0 0 0; font-family: Arial, sans-serif; font-size: 11px; color: #999;">
    Help optimize governance. Every vote counts toward the tipping point. (30 sec survey)
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
    } catch (err) {
      console.error("Failed to copy:", err)
      await navigator.clipboard.writeText(generateSignature())
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <Card className="border-4 border-primary mb-8">
      <CardHeader>
        <CardTitle className="text-2xl font-black uppercase flex items-center gap-2">
          <Mail className="h-6 w-6" />
          Email Signature Generator
        </CardTitle>
        <CardDescription className="font-bold">
          Paste this into your email signature. Every email becomes a tiny act of civilisation repair
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="border-4 border-primary p-4 bg-background">
            <p className="text-xs text-muted-foreground mb-3 font-bold uppercase">Preview:</p>
            <div
              dangerouslySetInnerHTML={{ __html: generateSignature() }}
              className="text-sm"
            />
          </div>

          <Button
            onClick={copySignature}
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
            <p><strong>Gmail:</strong> Settings &rarr; Signature &rarr; Paste &rarr; Save</p>
            <p><strong>Outlook:</strong> File &rarr; Options &rarr; Mail &rarr; Signatures &rarr; Paste</p>
            <p><strong>Apple Mail:</strong> Preferences &rarr; Signatures &rarr; Paste</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
