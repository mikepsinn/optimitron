import { Righteous } from "next/font/google";
import { BillSection } from "@/components/eos-preview/BillSection";
import { ComparisonMatrix } from "@/components/eos-preview/ComparisonMatrix";
import "./eos-preview.css";

const righteous = Righteous({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-eos-display",
});

/** Out-of-scope section placeholder for this first vertical slice. */
function SectionStub({
  n,
  title,
  note,
}: {
  n: string;
  title: string;
  note: string;
}) {
  return (
    <section className="eos-stub" id={`stub-${n}`}>
      <div className="eos-container eos-stub-inner">
        <p className="eos-stub-tag">Section {n} · TODO (out of scope)</p>
        <h2 className="eos-stub-title">{title}</h2>
        <p className="eos-stub-note">{note}</p>
      </div>
    </section>
  );
}

/**
 * Earth Optimization Services landing page (v2) — /eos-preview.
 *
 * FIRST VERTICAL SLICE of optimitron:dev:eos-landing-page-v2. This PR ships the
 * shared two-register design system plus the two highest-impact sections:
 * Section 1 (The Bill) and Section 3 (The Comparison Matrix). Every other
 * section is a clearly-marked TODO stub. The existing /eos route is untouched;
 * Mike decides cutover later.
 *
 * Spec (source of truth, copy is verbatim):
 *   e:/eos/manual/knowledge/production/eos-landing-page.qmd
 */
export function EosLandingPreviewPage() {
  return (
    <div className={`eos-preview ${righteous.variable}`}>
      {/* Section 1 — built */}
      <BillSection />

      {/* Section 2 — stub */}
      <SectionStub
        n="2"
        note="The cheerful pitchman arrives. EOS as a product for the first time: buys the companies that control your government, hands their lobbyists the optimal budget. One Class A share per human, free; Class B shares for returns."
        title="The Store"
      />

      {/* Section 3 — built */}
      <ComparisonMatrix />

      {/* Section 4 — stub */}
      <SectionStub
        n="4"
        note="Featured products as full cards with Retail price / Currently paying and working demos: the Optimitron (OPG + OBG), the Optimal Budget Generator, the Decentralized TODO List for Humanity, the Loving Takeover, the Wishocracy budget slider."
        title="Featured Products"
      />

      {/* Section 5 — stub */}
      <SectionStub
        n="5"
        note="The Government Replacement Suite: a grid of agency cards (Decentralized FDA, Automated Revenue Service, Universal Security Administration, Department of Peace, Decentralized Congress) plus the remaining-agencies grid and total cost-comparison bar."
        title="The Government Replacement Suite"
      />

      {/* Section 6 — stub */}
      <SectionStub
        n="6"
        note="The closed-loop control-system schematic: your oven has a thermostat; your government is open-loop. Animated oven loop vs dead-ending government loop, then the full EOS feedback loop."
        title="Why Your Government Does Not Have a Thermostat"
      />

      {/* Section 7 — stub */}
      <SectionStub
        n="7"
        note="Please Select an Earth: a personalized four-trajectory GDP chart (Collapse / Fantasy Baseline / Treaty / Optimal Governance) that rescales to the visitor's net worth or income."
        title="Please Select an Earth"
      />

      {/* Section 8 — stub */}
      <SectionStub
        n="8"
        note="A Day in the Optimized Life: the sunrise moment. A scroll-driven timeline of one Tuesday after the products are installed. Lighter background, warmer colors."
        title="A Day in the Optimized Life"
      />

      {/* Section 9 — stub */}
      <SectionStub
        n="9"
        note="Reviews from the Competition (the diseases' one-star reviews) and Customer Reviews (planet testimonials with star ratings)."
        title="Reviews"
      />

      {/* Section 10 — stub */}
      <SectionStub
        n="10"
        note="Your Move: the investor structure, floor, upside, ROI projections, and Reg D 506(c) disclosure, plus the two other participation paths (claim your free Class A share; fund or do a task)."
        title="Your Move"
      />

      {/* Section 11 — stub */}
      <SectionStub
        n="11"
        note="Footer closer and standard links. Includes the canonical line: The disease coming for someone you love almost certainly has no cure yet. This is how one gets found."
        title="Footer"
      />
    </div>
  );
}
