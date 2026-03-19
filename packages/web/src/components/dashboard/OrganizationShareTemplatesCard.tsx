"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Copy, Check, MessageSquare } from "lucide-react"

interface OrganizationShareTemplatesCardProps {
  surveyLink: string
  organizationName: string
}

export function OrganizationShareTemplatesCard({ surveyLink, organizationName }: OrganizationShareTemplatesCardProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  const templates = [
    {
      label: "Impact-Focused",
      text: `${organizationName} wants to know what you'd spend money on. 30 seconds. Anonymous. The maths does the rest: ${surveyLink}`,
    },
    {
      label: "Short & Direct",
      text: `${organizationName} is collecting budget preferences from actual humans. Takes 30 seconds. Shorter than your last complaint about politicians: ${surveyLink}`,
    },
    {
      label: "Data-Driven",
      text: `${organizationName} is building a budget based on what people actually want instead of what lobbyists want. Revolutionary concept. 30 seconds: ${surveyLink}`,
    },
    {
      label: "Mission-Oriented",
      text: `Nobody asked you how to spend your government's budget. ${organizationName} is fixing that. 30-second survey, real impact: ${surveyLink}`,
    },
    {
      label: "Personal Appeal",
      text: `${organizationName} needs 30 seconds of your time to rank budget priorities. Less time than you spent on your last social media argument, more impact: ${surveyLink}`,
    },
  ]

  const copyTemplate = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedIndex(index)
      setTimeout(() => setCopiedIndex(null), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  return (
    <Card className="border-4 border-primary mb-8">
      <CardHeader>
        <CardTitle className="text-2xl font-black uppercase flex items-center gap-2">
          <MessageSquare className="h-6 w-6" />
          Share Templates
        </CardTitle>
        <CardDescription className="font-bold">
          Copy-paste messages to share your organization&apos;s priority survey
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {templates.map((template, index) => (
            <div
              key={index}
              className="border-4 border-primary p-4 bg-background hover:bg-brutal-yellow/10 transition-colors"
            >
              <div className="flex items-start justify-between gap-4 mb-2">
                <p className="font-black uppercase text-sm text-brutal-cyan">{template.label}</p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyTemplate(template.text, index)}
                  className="border-4 border-primary hover:bg-brutal-pink shrink-0"
                >
                  {copiedIndex === index ? (
                    <>
                      <Check className="h-4 w-4 mr-1" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-1" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
              <p className="text-sm text-foreground/80">{template.text}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
