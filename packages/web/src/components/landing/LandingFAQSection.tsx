"use client";

import type { ReactNode } from "react";
import { Accordion } from "@/components/retroui/Accordion";
import { ParameterValue } from "@/components/shared/ParameterValue";
import {
  PRIZE_POOL_HORIZON_MULTIPLE,
  TREATY_CAMPAIGN_VOTING_BLOC_TARGET,
  MILITARY_TO_GOVERNMENT_CLINICAL_TRIALS_SPENDING_RATIO,
  TREATY_TRAJECTORY_AVG_INCOME_YEAR_15,
  CURRENT_TRAJECTORY_AVG_INCOME_YEAR_15,
  VOTE_TOKEN_VALUE,
} from "@optimitron/data/parameters";

const objections: { id: string; question: string; answer: ReactNode }[] = [
  {
    id: "scam",
    question: "Isn't this a scam?",
    answer:
      "Zero team allocation. No pre-sale. No admin keys. Every transaction is on-chain and auditable. The smart contract controls distribution — not a committee, not a founder, not an alien. It's a dominant assurance contract: the mechanism literally guarantees you can't lose your principal. The code is on GitHub. Read it.",
  },
  {
    id: "politicians",
    question: "Can politicians just ignore this?",
    answer: <>Chenoweth&apos;s research shows that 3.5% of a population is the tipping point for political change — no campaign in history has failed after reaching it. That&apos;s <ParameterValue param={TREATY_CAMPAIGN_VOTING_BLOC_TARGET} display="withUnit" /> verified supporters globally. The referendum doesn&apos;t ask permission. It proves demand. Once demand is undeniable, ignoring it becomes more expensive than acting on it.</>,
  },
  {
    id: "fails",
    question: "What if the plan fails?",
    answer: <>That&apos;s the entire point of dominant assurance. If the plan fails after 15 years, depositors claim their principal plus ~<ParameterValue param={PRIZE_POOL_HORIZON_MULTIPLE} display="withUnit" /> in Prize fund growth. You&apos;re not donating. You&apos;re making a bet where the worst case is multiplying your money. The plan failing is the scenario designed to make you rich.</>,
  },
  {
    id: "trust",
    question: "Why should I trust an alien?",
    answer:
      "You shouldn't. Trust the smart contracts. They're open source, deployed on a public blockchain, with no admin keys. The alien is just the narrator. The maths works whether or not you find her charming. VoterPrizeTreasury.sol and VoteToken.sol — full source on GitHub.",
  },
  {
    id: "share",
    question: "Why should I share this with friends?",
    answer: <>Everyone would be healthier and <ParameterValue param={{...TREATY_TRAJECTORY_AVG_INCOME_YEAR_15, value: Math.round(TREATY_TRAJECTORY_AVG_INCOME_YEAR_15.value / CURRENT_TRAJECTORY_AVG_INCOME_YEAR_15.value), unit: ""}} display="integer" />x richer if their governments weren&apos;t spending <ParameterValue param={MILITARY_TO_GOVERNMENT_CLINICAL_TRIALS_SPENDING_RATIO} display="integer" /> times more on blowing everything up than on clinical trials. But everyone assumes nobody else would agree to a saner allocation — despite the fact that this is what literally everyone wants. That&apos;s called pluralistic ignorance and it&apos;s the only thing standing between you and a cured planet. Each friend who plays proves one more person agrees, earns you a VOTE point worth <ParameterValue param={VOTE_TOKEN_VALUE} display="withUnit" />+, and moves closer to the tipping point. You&apos;re not asking for a favour. You&apos;re showing them the maths.</>,
  },
];

/**
 * Landing section 6: Objection Pre-emption
 *
 * Addresses the 4 most common objections with Wishonia-voiced answers.
 * Uses accordion for compact presentation.
 */
export function LandingFAQSection() {
  return (
    <section className="bg-background">
      <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-black uppercase tracking-tight text-foreground sm:text-4xl md:text-5xl">
            Frequently Asked Objections
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg sm:text-xl font-bold text-muted-foreground">
            I have been fielding these for 4,237 years. Your species is not as
            original as it thinks.
          </p>
        </div>

        <div className="mx-auto max-w-3xl">
          <Accordion
            type="multiple"
            className="border-4 border-primary shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
          >
            {objections.map((item) => (
              <Accordion.Item
                key={item.id}
                value={item.id}
                className="border-b-4 border-primary last:border-b-0"
              >
                <Accordion.Header className="px-6 py-5 text-base sm:text-lg font-black uppercase tracking-wide text-foreground hover:no-underline hover:bg-muted">
                  {item.question}
                </Accordion.Header>
                <Accordion.Content className="px-6">
                  <p className="text-base font-bold text-muted-foreground leading-relaxed pb-2">
                    {item.answer}
                  </p>
                </Accordion.Content>
              </Accordion.Item>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
