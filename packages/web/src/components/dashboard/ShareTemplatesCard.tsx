"use client"

import { useState } from "react"
import { Card } from "@/components/retroui/Card"
import { Button } from "@/components/retroui/Button"
import { Copy, Check, MessageSquare } from "lucide-react"
import {
  VOTER_LIVES_SAVED,
  VOTER_SUFFERING_HOURS_PREVENTED,
  EFFICACY_LAG_YEARS,
  PRIZE_POOL_HORIZON_MULTIPLE,
  fmtParam,
} from "@optimitron/data/parameters";
interface ShareTemplatesCardProps {
  referralLink: string
}

const LIVES_PER_VOTE = VOTER_LIVES_SAVED.value.toFixed(1)
const HOURS_PER_YEAR = 8_760
const SUFFERING_YEARS_PER_VOTE = Math.round(
  VOTER_SUFFERING_HOURS_PREVENTED.value / HOURS_PER_YEAR,
).toLocaleString()
const EFFICACY_LAG = EFFICACY_LAG_YEARS.value

export function ShareTemplatesCard({ referralLink }: ShareTemplatesCardProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  const templates = [
    {
      label: "Impact-Focused",
      text: `Your vote = ${LIVES_PER_VOTE} lives saved + ${SUFFERING_YEARS_PER_VOTE} years of suffering prevented. It takes 30 seconds. We can get cures to patients ${EFFICACY_LAG} years sooner through pragmatic trials. ${referralLink}`,
    },
    {
      label: "The Math",
      text: `The break-even probability for the Earth Optimization Prize is 0.0067%. Worst case: ~${fmtParam(PRIZE_POOL_HORIZON_MULTIPLE)} from the Prize fund. Best case: we end preventable disease. ${referralLink}`,
    },
    {
      label: "Personal",
      text: `Everyone knows someone suffering from disease. What if we could get cures to them ${EFFICACY_LAG} years sooner? 30 seconds to vote: ${referralLink}`,
    },
    {
      label: "Data-Driven",
      text: `95% of diseases have no FDA-approved treatment. Pragmatic trials can accelerate cures by ${EFFICACY_LAG} years at 44x less cost. Each verified vote = ${LIVES_PER_VOTE} lives saved. ${referralLink}`,
    },
    {
      label: "Twitter/X",
      text: `30 sec to vote = ${LIVES_PER_VOTE} lives saved + ${SUFFERING_YEARS_PER_VOTE} years of suffering prevented. Make it count: ${referralLink}`,
    },
  ]

  const copyTemplate = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedIndex(index)
      setTimeout(() => setCopiedIndex(null), 2000)
      // Track share for wish points (fire-and-forget, one-time per user)
      fetch("/api/share/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateLabel: templates[index]?.label }),
      }).catch(() => {})
    } catch {
      // Clipboard API not available
    }
  }

  return (
    <Card className="border-4 border-primary mb-8">
      <Card.Header>
        <Card.Title className="text-2xl font-black uppercase flex items-center gap-2">
          <MessageSquare className="h-6 w-6" />
          Share Templates
        </Card.Title>
        <Card.Description className="font-bold">
          Copy-paste messages with your referral link and real impact numbers baked in
        </Card.Description>
      </Card.Header>
      <Card.Content>
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
                  onClick={() => void copyTemplate(template.text, index)}
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
              <p className="text-sm text-muted-foreground">{template.text}</p>
            </div>
          ))}
        </div>
      </Card.Content>
    </Card>
  )
}
