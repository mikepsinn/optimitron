"use client";

import { useState } from "react";
import {
  VOTER_LIVES_SAVED,
  VOTER_SUFFERING_HOURS_PREVENTED,
  EFFICACY_LAG_YEARS,
  GLOBAL_DISEASE_DEATHS_DAILY,
  PRIZE_POOL_HORIZON_MULTIPLE,
  fmtParam,
} from "@optimitron/data/parameters";
interface ShareTemplatesCardProps {
  referralUrl: string;
}

// Pre-computed impact values from parameters
const LIVES_PER_VOTE = VOTER_LIVES_SAVED.value.toFixed(1);
const HOURS_PER_YEAR = 8_760;
const SUFFERING_YEARS_PER_VOTE = Math.round(
  VOTER_SUFFERING_HOURS_PREVENTED.value / HOURS_PER_YEAR,
).toLocaleString();
const EFFICACY_LAG = EFFICACY_LAG_YEARS.value;
const DEATHS_DAILY = Math.round(
  GLOBAL_DISEASE_DEATHS_DAILY.value,
).toLocaleString();

const TEMPLATES = [
  {
    label: "Impact-Focused",
    color: "text-brutal-cyan",
    text: (url: string) =>
      `Your vote = ${LIVES_PER_VOTE} lives saved + ${SUFFERING_YEARS_PER_VOTE} years of suffering prevented. It takes 30 seconds. We can get cures to patients ${EFFICACY_LAG} years sooner through pragmatic trials. ${url}`,
  },
  {
    label: "The Math",
    color: "text-brutal-pink",
    text: (url: string) =>
      `The break-even probability shift for an Incentive Alignment Bond is 0.0067%. ${DEATHS_DAILY} people die daily from preventable causes. A bond that funds pragmatic clinical trials needs a 0.0067% chance of working to be positive EV. Worst case: ~${fmtParam(PRIZE_POOL_HORIZON_MULTIPLE)} from the Prize fund. ${url}`,
  },
  {
    label: "Personal",
    color: "text-brutal-yellow",
    text: (url: string) =>
      `Everyone knows someone suffering from disease. What if we could get cures to them ${EFFICACY_LAG} years sooner? Pragmatic trials let patients access treatments after safety testing while collecting real-world efficacy data. 30 seconds to vote: ${url}`,
  },
  {
    label: "Data-Driven",
    color: "text-green-700",
    text: (url: string) =>
      `95% of diseases have no FDA-approved treatment. Pragmatic trials can accelerate cures by ${EFFICACY_LAG} years at 44x less cost. Each verified vote = ${LIVES_PER_VOTE} lives saved. Prove you want it: ${url}`,
  },
  {
    label: "Twitter/X",
    color: "text-foreground",
    text: (url: string) =>
      `30 seconds to vote = ${LIVES_PER_VOTE} lives saved + ${SUFFERING_YEARS_PER_VOTE} years of suffering prevented. Make it count: ${url}`,
  },
];

export function ShareTemplatesCard({ referralUrl }: ShareTemplatesCardProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const copyTemplate = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch {
      // Clipboard API not available
    }
  };

  return (
    <div className="border-4 border-primary bg-background p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
      <h3 className="text-lg font-black uppercase text-foreground mb-2">
        Share Templates
      </h3>
      <p className="text-sm text-muted-foreground font-bold mb-4">
        Copy-paste messages with your referral link and real impact numbers
        baked in.
      </p>
      <div className="space-y-3">
        {TEMPLATES.map((t, index) => {
          const text = t.text(referralUrl);
          return (
            <div
              key={t.label}
              className="border-4 border-primary p-4 hover:bg-brutal-yellow/10 transition-colors"
            >
              <div className="flex items-start justify-between gap-4 mb-2">
                <span className={`text-xs font-black uppercase ${t.color}`}>
                  {t.label}
                </span>
                <button
                  onClick={() => void copyTemplate(text, index)}
                  className="text-xs font-black uppercase border-4 border-primary px-3 py-1 hover:bg-brutal-pink hover:text-background transition-colors shrink-0"
                >
                  {copiedIndex === index ? "Copied!" : "Copy"}
                </button>
              </div>
              <p className="text-sm text-foreground">{text}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
