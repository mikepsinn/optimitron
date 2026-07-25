import type { ReactNode } from "react";
import { US_CONGRESS_MEMBER_COUNT } from "@optimitron/data/parameters";
import { ParameterValue } from "@/components/shared/ParameterValue";
import { Reveal } from "@/components/eos-preview/Reveal";
import { TransformationCards } from "@/components/eos-preview/TransformationCards";

/**
 * SECTION 8: A DAY IN THE OPTIMIZED LIFE. The sunrise moment: cream
 * background, dark ink, one ordinary Tuesday after the products are
 * installed. Copy verbatim from the spec; entries reveal on scroll.
 */
const ENTRIES: { time: string; text: ReactNode }[] = [
  {
    time: "6:00 AM",
    text: (
      <>
        You wake up without an alarm. Your health monitor adjusted your sleep
        cycle overnight. Depression was cured eleven years ago; the protocol
        cost $340 million in trial funding and replaced $320 billion in annual
        treatment costs.
      </>
    ),
  },
  {
    time: "12:00 PM",
    text: (
      <>
        Your five pairwise budget votes for the week take ninety seconds during
        lunch. Medical research or military? 85-15. Infrastructure or space?
        60-40. You do not vote on things you know nothing about. Nobody does.
      </>
    ),
  },
  {
    time: "3:00 PM",
    text: (
      <>
        Your child&apos;s school teaches history, including the chapter on
        diseases. &ldquo;You mean people just... had cancer? And they
        couldn&apos;t fix it? What did they do?&rdquo; &ldquo;They held
        fundraising walks.&rdquo; &ldquo;They WALKED? That was the plan?&rdquo;
      </>
    ),
  },
  {
    time: "6:00 PM",
    text: (
      <>
        Dinner costs less because the tax is 0.5% on transactions, automatic,
        invisible. No filing. No April. No accountant. The government&apos;s
        share was allocated by 8 billion people simultaneously, which turned out
        to work better than having{" "}
        <ParameterValue
          display="integer"
          param={US_CONGRESS_MEMBER_COUNT}
          presentation="inline"
        />{" "}
        people do it while being handed envelopes.
      </>
    ),
  },
  {
    time: "9:00 PM",
    text: (
      <>
        You are not worried about medical bankruptcy. Nobody is. That concept is
        taught alongside &ldquo;bloodletting&rdquo; and &ldquo;phrenology.&rdquo;
        You are also not worried about war, because the disposal robots handled
        the weapons and the settlement engine handled the disputes and the last
        war was boring enough to end on its own.
      </>
    ),
  },
];

export function OptimizedDaySection() {
  return (
    <section className="eos-section eos-day" id="optimized-day">
      <div className="eos-container">
        <Reveal className="eos-catalog-head">
          <p className="eos-eyebrow" style={{ color: "rgba(23, 19, 10, 0.55)" }}>
            Section 8
          </p>
          <h2 className="eos-catalog-title">Welcome to Tuesday</h2>
        </Reveal>

        <div>
          {ENTRIES.map((e) => (
            <Reveal key={e.time}>
              <div className="eos-day-entry">
                <div className="eos-day-time">{e.time}</div>
                <div className="eos-day-text">{e.text}</div>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal>
          <div style={{ maxWidth: "76ch", margin: "2.5rem auto 0" }}>
            <TransformationCards />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
