"use client";

import { useState } from "react";
import Link from "next/link";
import { WISHOCRATIC_ITEMS } from "@/lib/wishocracy-data";
import { ROUTES } from "@/lib/routes";

/**
 * The real Wishocracy pairwise interaction, restyled for the eos-retro
 * exhibit hall (adapted from wishocracy/wishocratic-pair-slider.tsx with
 * the neobrutalist chrome stripped). Guests can drag; the split lives in
 * local state only. The full ten-pair ballot lives at ROUTES.wishocracy.
 */

const ITEM_A_ID = "PRAGMATIC_CLINICAL_TRIALS";
const ITEM_B_ID = "BOMBING_IRAN";

function roiCaption(ratio: string): string {
  return ratio.toUpperCase().includes("ROI") ? ratio : `ROI ${ratio}`;
}

export function WishocracyBooth() {
  // The thumb is the divider: everything left of it goes to item A.
  const [value, setValue] = useState(50);
  const [submitted, setSubmitted] = useState(false);

  const itemA = WISHOCRATIC_ITEMS[ITEM_A_ID];
  const itemB = WISHOCRATIC_ITEMS[ITEM_B_ID];
  const allocationA = value;
  const allocationB = 100 - value;

  return (
    <div className="er-panel er-ticked p-5 sm:p-8">
      <p className="er-caption">
        One live pair from the ballot. Of the money available for both,
        drag the handle to split it. Your drag stays on this page.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="text-center">
          <div aria-hidden="true" className="text-4xl sm:text-5xl">
            {itemA.icon}
          </div>
          <div className="er-split-value mt-3" style={{ color: "var(--er-cyan)" }}>
            {allocationA}%
          </div>
          <p className="er-card-title mt-2 text-sm" style={{ color: "var(--er-cream)" }}>
            {itemA.name}
          </p>
          <p className="er-caption mt-2">
            ${itemA.annualBudgetBillions}B/yr today
            {itemA.roiData ? ` · ${roiCaption(itemA.roiData.ratio)}` : ""}
          </p>
        </div>
        <div className="text-center">
          <div aria-hidden="true" className="text-4xl sm:text-5xl">
            {itemB.icon}
          </div>
          <div className="er-split-value mt-3" style={{ color: "var(--er-orange)" }}>
            {allocationB}%
          </div>
          <p className="er-card-title mt-2 text-sm" style={{ color: "var(--er-cream)" }}>
            {itemB.name}
          </p>
          <p className="er-caption mt-2">
            ${itemB.annualBudgetBillions}B/yr today
            {itemB.roiData ? ` · ${roiCaption(itemB.roiData.ratio)}` : ""}
          </p>
        </div>
      </div>

      <div className="mt-6">
        <input
          aria-label={`Split funding between ${itemA.name} and ${itemB.name}`}
          className="er-range"
          max={100}
          min={0}
          onChange={(e) => {
            setValue(Number(e.target.value));
            setSubmitted(false);
          }}
          style={{
            background: `linear-gradient(to right, var(--er-cyan) ${allocationA}%, var(--er-orange) ${allocationA}%)`,
          }}
          type="range"
          value={value}
        />
      </div>

      {submitted ? (
        <div className="mt-6 border p-4 text-center" style={{ borderColor: "var(--er-gold)" }}>
          <p className="er-body">
            Recorded: {allocationA}% cures, {allocationB}% bombs. That took
            you about four seconds. Nine more pairs and you have allocated a
            budget more coherently than any legislature in your species&apos;
            history.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-4">
            <Link className="er-btn er-btn-solid" href={ROUTES.wishocracy}>
              Do the other nine pairs
            </Link>
          </div>
        </div>
      ) : (
        <div className="mt-6 text-center">
          <button className="er-btn" onClick={() => setSubmitted(true)} type="button">
            Lock in my split
          </button>
        </div>
      )}
    </div>
  );
}
