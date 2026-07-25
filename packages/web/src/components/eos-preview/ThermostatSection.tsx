import type { CSSProperties, ReactNode } from "react";
import { GLOBAL_POPULATION_2024 } from "@optimitron/data/parameters";
import { ParameterValue } from "@/components/shared/ParameterValue";
import { Reveal } from "@/components/eos-preview/Reveal";

const N = "eos-num";

function FlowNode({ children, i }: { children: ReactNode; i: number }) {
  return (
    <span className="eos-loop-node" style={{ "--eos-node-i": i } as CSSProperties}>
      {children}
    </span>
  );
}

function Arrow() {
  return (
    <span aria-hidden="true" className="eos-loop-arrow">
      →
    </span>
  );
}

/**
 * SECTION 6: WHY YOUR GOVERNMENT DOES NOT HAVE A THERMOSTAT.
 * Copy verbatim from the spec. The spec's ASCII control-loop diagrams are
 * typeset as node-flow diagrams; nodes light up in sequence via CSS animation
 * (disabled under prefers-reduced-motion).
 */
export function ThermostatSection() {
  return (
    <section className="eos-section eos-r2" id="thermostat">
      <div className="eos-container">
        <Reveal className="eos-catalog-head">
          <p className="eos-eyebrow">Section 6</p>
          <h2 className="eos-catalog-title">
            Why Your Government Does Not Have a Thermostat
          </h2>
        </Reveal>

        <Reveal>
          <div className="eos-prose" style={{ maxWidth: "72ch", margin: "0 auto" }}>
            <p>
              Your oven has a sensor. It measures the temperature inside the
              oven, compares it to the temperature you requested, and adjusts
              the heating element until the two numbers match. This is called a
              closed-loop control system. Every appliance in your home has one.
              Your air conditioner, your cruise control, your refrigerator, your
              toilet. The toilet knows when to stop filling. Your government
              does not.
            </p>
          </div>
        </Reveal>

        <Reveal>
          <div
            style={{
              display: "grid",
              gap: "1.25rem",
              marginTop: "2.5rem",
              gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 26rem), 1fr))",
            }}
          >
            <div className="eos-loop" data-animated="">
              <p className="eos-loop-title" style={{ color: "var(--eos-mint)" }}>
                Your oven (closed-loop)
              </p>
              <div className="eos-loop-flow">
                <FlowNode i={0}>Set 350°F</FlowNode>
                <Arrow />
                <FlowNode i={1}>Heating Element</FlowNode>
                <Arrow />
                <FlowNode i={2}>Oven</FlowNode>
                <Arrow />
                <FlowNode i={3}>Food</FlowNode>
              </div>
              <p className="eos-loop-return">
                ↺ Thermometer measures actual temperature, adjusts input
              </p>
            </div>

            <div className="eos-loop">
              <p className="eos-loop-title" style={{ color: "var(--eos-bad)" }}>
                Your government (open-loop)
              </p>
              <div className="eos-loop-flow">
                <FlowNode i={0}>&ldquo;War on Drugs&rdquo;</FlowNode>
                <Arrow />
                <FlowNode i={1}>$1 Trillion</FlowNode>
                <Arrow />
                <FlowNode i={2}>Drug Policy</FlowNode>
                <Arrow />
                <span className="eos-loop-dead">???</span>
              </div>
              <p className="eos-loop-return" style={{ color: "var(--eos-bad)" }}>
                (no sensor) (no measurement) (no adjustment)
              </p>
              <div className="eos-loop-stats">
                Overdose deaths: <span className="eos-num">6,000 → 107,000</span>
                <br />
                Budget change: none
                <br />
                Duration: 53 years and counting
              </div>
            </div>
          </div>
        </Reveal>

        <Reveal>
          <div className="eos-prose" style={{ maxWidth: "72ch", margin: "2.5rem auto 0" }}>
            <p>
              Your War on Terror: $8 trillion spent, terrorist attacks went from
              about 1,000 per year to nearly 17,000 per year. No sensor. No
              adjustment. Fifty-three years of drug war with 18x more overdoses.
              No sensor. No adjustment. You are operating the most complex
              system in your solar system (a civilization of{" "}
              <ParameterValue
                className={N}
                figures={1}
                param={GLOBAL_POPULATION_2024}
              />{" "}
              humans) with less feedback instrumentation than a toaster.
            </p>
            <p>
              Your current system uses the same components in the opposite
              order: companies buy the government, lobbyists push for policies
              that maximize shareholder profit, and nobody measures whether
              anyone got healthier or richer. Same machine. Same parts.
              Different direction.
            </p>
            <p>
              The Optimal Policy Generator is the sensor. The Optimal Budget
              Generator is the target. The Loving Takeover is the actuator (it
              controls the lobbying apparatus that controls Congress). The 1%
              Treaty is the power supply. The Wishocracy is the allocation
              circuit. And the feedback loop closes because the sensor measures
              the output of the policies it recommended, compares them to the
              target, and adjusts. Like a thermostat. Like every system you
              build when you bother to think about it for ten seconds.
            </p>
          </div>
        </Reveal>

        <Reveal>
          <div className="eos-loop" data-animated="" style={{ marginTop: "2.5rem" }}>
            <p className="eos-loop-title" style={{ color: "var(--eos-gold)" }}>
              The closed loop
            </p>
            <div className="eos-loop-flow" style={{ rowGap: "0.75rem" }}>
              {[
                "Share Acquisition",
                "Board Seats",
                "OBG Calculates Optimal Budget",
                "Board Hands Budget to Lobbyists",
                "Lobbyists Sell Congress on the Math",
                "Policy Changes",
                "OPG Measures Outcomes",
                "Wishocracy Sets Priorities",
                "TODO List Distributes Tasks",
                "Economy Grows",
                "Value Increases",
                "More Capital for Next Fight",
              ].map((label, i, arr) => (
                <span key={label} style={{ display: "inline-flex", alignItems: "center" }}>
                  <FlowNode i={i}>{label}</FlowNode>
                  {i < arr.length - 1 ? <Arrow /> : null}
                </span>
              ))}
            </div>
            <p className="eos-loop-return">↺ A virtuous cycle. Each node lights up in sequence.</p>
          </div>
        </Reveal>

        <Reveal>
          <blockquote className="eos-testimonial" style={{ margin: "2.5rem auto 0", maxWidth: "72ch" }}>
            <p>
              &ldquo;We tried running our government without a feedback loop for
              200 years. The engineers found this extremely funny. They kept
              asking &lsquo;but how do you know if it worked?&rsquo; and we kept
              saying &lsquo;we argue about it.&rsquo; They stopped laughing when
              they realized we were serious.&rdquo;
            </p>
            <cite>(Planet Keth-7)</cite>
          </blockquote>
        </Reveal>
      </div>
    </section>
  );
}
