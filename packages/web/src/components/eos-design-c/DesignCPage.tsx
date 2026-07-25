import "@/components/eos-design-c/design-c.css";

import { BillFinale } from "@/components/eos-design-c/BillFinale";
import { DcDefs } from "@/components/eos-design-c/DcDefs";
import { MatrixFrame } from "@/components/eos-design-c/MatrixFrame";
import { OptimitronFrame } from "@/components/eos-design-c/OptimitronFrame";
import { PivotReel } from "@/components/eos-design-c/PivotReel";
import { StoreFrame } from "@/components/eos-design-c/StoreFrame";

/**
 * Version C of the EOS landing page: THE EDUCATIONAL FILM.
 *
 * A 1950s classroom filmstrip. Section 1 (The Bill) stays dark and airless;
 * everything after the pivot is cream paper, primary inks, and hand-drawn
 * diagrams. Concepts are drawn, not written: prose lives behind "read the
 * math" disclosure and every screen leads with a number, a drawing, or a
 * demo. Copy is verbatim from knowledge/production/eos-landing-page.qmd;
 * every figure renders through the ParameterValue pipeline.
 *
 * Scope: the end of Section 1 plus the pivot, Section 2, Section 4's first
 * product, and Section 3 — the slice the three competing versions share.
 */
export function DesignCPage() {
  return (
    <main className="dc">
      <DcDefs />
      <BillFinale />
      <PivotReel />
      <StoreFrame />
      <OptimitronFrame />
      <MatrixFrame />
      <footer className="dc-end">
        <p className="dc-slate">
          End of reel · Sections 5 through 11 not yet filmed
        </p>
      </footer>
    </main>
  );
}
