import "@/components/design-a/design-a.css";

import { BillTail } from "@/components/design-a/BillTail";
import { ComparisonMatrix } from "@/components/design-a/ComparisonMatrix";
import { OptimitronProduct } from "@/components/design-a/OptimitronProduct";
import { Pivot } from "@/components/design-a/Pivot";
import { StoreSection } from "@/components/design-a/StoreSection";

/**
 * Version A of the Earth Optimization Services landing page: the catalog.
 *
 * The arc built here is the comparable slice across the three competing
 * directions: the tail of the dark charge sheet, the pivot into the bright
 * register, the store, one product rendered as a full catalog page, and the
 * comparison matrix. Copy is verbatim from the production specification; every
 * parameterized figure flows through ParameterValue.
 */
export function DesignACatalogPage() {
  return (
    <main className="dsa-root">
      <BillTail />
      <Pivot />
      <StoreSection />
      <OptimitronProduct />
      <ComparisonMatrix />
    </main>
  );
}
