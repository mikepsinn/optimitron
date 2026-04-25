"use client";

import type { ReactNode } from "react";
import { Accordion } from "@/components/retroui/Accordion";
import { ParameterValue } from "@/components/shared/ParameterValue";
import { POINT } from "@/lib/messaging";
import {
  PRIZE_POOL_HORIZON_MULTIPLE,
} from "@optimitron/data/parameters";
import { MAJORITY_OF_HUMANS_ON_EARTH } from "@/lib/majority-humanity-target";

const objections: { id: string; question: string; answer: ReactNode }[] = [
  {
    id: "scam",
    question: "Isn't this a scam?",
    answer:
      "Zero team allocation. No admin keys. Dominant assurance contract — you cannot lose principal. Smart contract controls distribution. Code on GitHub.",
  },
  {
    id: "politicians",
    question: "Can politicians just ignore this?",
    answer: <>A majority of humans on Earth is the target. That&apos;s <ParameterValue param={MAJORITY_OF_HUMANS_ON_EARTH} display="withUnit" /> publicly agreeing that the 1% Treaty is a good idea. The referendum proves demand. Ignoring proven demand costs more than acting.</>,
  },
  {
    id: "fails",
    question: "What if the plan fails?",
    answer: <>That&apos;s the entire point of dominant assurance. If the plan fails after 15 years, depositors claim their principal plus projected ~<ParameterValue param={PRIZE_POOL_HORIZON_MULTIPLE} display="withUnit" /> in Prize fund growth (based on VC-sector diversification). All return figures are hypothetical projections, not guarantees.</>,
  },
  {
    id: "trust",
    question: "Why should I trust an alien?",
    answer:
      "Don't. Trust the smart contracts. Open source, public blockchain, no admin keys. The alien is just the narrator. VoterPrizeTreasury.sol — full source on GitHub.",
  },
  {
    id: "share",
    question: "Why should I share this with friends?",
    answer: <>Everyone wants less war and disease. Nobody knows everyone else does. That&apos;s pluralistic ignorance. Each friend proves one more person agrees and earns you a {POINT}. You&apos;re not asking a favour. You&apos;re showing them the maths.</>,
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
