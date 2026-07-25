import "./eos-design-b.css";

import { BillTailAndPivot } from "@/components/eos-design-b/BillTailAndPivot";
import { ComparisonSheet } from "@/components/eos-design-b/ComparisonSheet";
import { OptimitronSheet } from "@/components/eos-design-b/OptimitronSheet";
import { StoreSheet } from "@/components/eos-design-b/StoreSheet";

/**
 * EOS landing — Version B, "The Press Kit".
 *
 * A competing visual direction, built as a comparison slice rather than the
 * full eleven-section page: the end of Section 1 and the pivot, Section 2,
 * one Section 4 product at full scale, and Section 3.
 *
 * Section order follows the build brief rather than the spec's numbering, so
 * the matrix closes the slice: Bill tail, pivot, Store, Optimitron, matrix.
 * Every figure the spec supplies as a variable renders through
 * ParameterValue; the plain-text figures are verbatim spec prose.
 */
export function EosDesignBPage() {
  return (
    <main className="pkb">
      <BillTailAndPivot />
      <StoreSheet />
      <OptimitronSheet />
      <ComparisonSheet />
    </main>
  );
}
