import { Righteous } from "next/font/google";
import { BillSection } from "@/components/eos-preview/BillSection";
import { ComparisonMatrix } from "@/components/eos-preview/ComparisonMatrix";
import { FeaturedProducts } from "@/components/eos-preview/FeaturedProducts";
import { FooterSection } from "@/components/eos-preview/FooterSection";
import { OptimizedDaySection } from "@/components/eos-preview/OptimizedDaySection";
import { ReviewsSection } from "@/components/eos-preview/ReviewsSection";
import { SelectEarthSection } from "@/components/eos-preview/SelectEarthSection";
import { StoreSection } from "@/components/eos-preview/StoreSection";
import { SuiteSection } from "@/components/eos-preview/SuiteSection";
import { ThermostatSection } from "@/components/eos-preview/ThermostatSection";
import { YourMoveSection } from "@/components/eos-preview/YourMoveSection";
import "./eos-preview.css";

const righteous = Righteous({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-eos-display",
});

/**
 * Earth Optimization Services landing page (v2) — /eos-preview.
 *
 * Full implementation of optimitron:dev:eos-landing-page-v2. All eleven
 * sections from the spec, in order. The existing /eos route is untouched;
 * Mike decides cutover later.
 *
 * Spec (source of truth, copy is verbatim):
 *   e:/eos/manual/knowledge/production/eos-landing-page.qmd
 */
export function EosLandingPreviewPage() {
  return (
    <div className={`eos-preview ${righteous.variable}`}>
      {/* 1 · The Bill (charge sheet) + the register pivot */}
      <BillSection />

      {/* 2 · The Store */}
      <StoreSection />

      {/* 3 · The Comparison Matrix */}
      <ComparisonMatrix />

      {/* 4 · Featured Products */}
      <FeaturedProducts />

      {/* 5 · The Government Replacement Suite */}
      <SuiteSection />

      {/* 6 · Why Your Government Does Not Have a Thermostat */}
      <ThermostatSection />

      {/* 7 · Please Select an Earth */}
      <SelectEarthSection />

      {/* 8 · A Day in the Optimized Life */}
      <OptimizedDaySection />

      {/* 9 · Reviews */}
      <ReviewsSection />

      {/* 10 · Your Move */}
      <YourMoveSection />

      {/* 11 · Footer */}
      <FooterSection />
    </div>
  );
}
