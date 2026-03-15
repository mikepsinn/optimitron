"use client";

import { useState, useCallback } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  TREATY_TRAJECTORY_LIFETIME_INCOME_GAIN_PER_CAPITA,
  WISHONIA_TRAJECTORY_LIFETIME_INCOME_GAIN_PER_CAPITA,
  VICTORY_BOND_ANNUAL_RETURN_PCT,
} from "@/lib/parameters-calculations-citations";

/**
 * Interactive Incentive Alignment Bond return calculator.
 *
 * Fail scenario:  principal × (1.10)^15  (10% staking yield, 15-year escrow)
 * Succeed scenario: 272% annual revenue share + per-capita lifetime income gain
 * Break-even: 0.0067% probability shift per $1K (treaty floor)
 */

const STAKING_RATE = 0.10;
const ESCROW_YEARS = 15;
const FAIL_MULTIPLIER = Math.pow(1 + STAKING_RATE, ESCROW_YEARS); // ≈ 4.177

const ANNUAL_RETURN_RATE = VICTORY_BOND_ANNUAL_RETURN_PCT.value; // annual revenue share

const TREATY_INCOME_GAIN = TREATY_TRAJECTORY_LIFETIME_INCOME_GAIN_PER_CAPITA.value; // $14.9M per-capita lifetime
const WISHONIA_INCOME_GAIN = WISHONIA_TRAJECTORY_LIFETIME_INCOME_GAIN_PER_CAPITA.value; // $52.1M per-capita lifetime

// Break-even: 0.0067% probability shift per $1K unreimbursed (treaty floor)
const BREAKEVEN_PER_1K = 0.0067; // percent

const PRESET_AMOUNTS = [100, 1_000, 10_000, 100_000];

function formatUSD(n: number): string {
  if (n >= 1_000_000) {
    return `$${(n / 1_000_000).toFixed(1)}M`;
  }
  if (n >= 1_000) {
    return `$${Math.round(n).toLocaleString("en-US")}`;
  }
  return `$${n.toFixed(2)}`;
}

export function IABCalculator() {
  const [amount, setAmount] = useState(1000);
  const reduced = useReducedMotion();

  const handleSlider = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setAmount(Number(e.target.value));
  }, []);

  const handleInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, "");
    setAmount(Number(val) || 0);
  }, []);

  const failReturn = amount * FAIL_MULTIPLIER;
  const failProfit = failReturn - amount;
  const annualRevShare = amount * ANNUAL_RETURN_RATE;
  const breakevenPct = (amount / 1000) * BREAKEVEN_PER_1K;

  return (
    <div>
      {/* Input */}
      <div className="mb-6">
        <label className="block text-xs font-black uppercase text-black/50 mb-2">
          Your Investment
        </label>
        <div className="flex items-center gap-4 mb-3">
          <div className="relative flex-grow max-w-xs">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg font-black text-black/40">
              $
            </span>
            <input
              type="text"
              value={amount.toLocaleString("en-US")}
              onChange={handleInput}
              className="w-full pl-8 pr-3 py-3 text-xl font-black text-black border-4 border-black bg-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {PRESET_AMOUNTS.map((preset) => (
              <button
                key={preset}
                onClick={() => setAmount(preset)}
                className={`px-3 py-2 text-xs font-black border-2 border-black transition-colors ${
                  amount === preset
                    ? "bg-black text-white"
                    : "bg-white text-black hover:bg-black/10"
                }`}
              >
                {formatUSD(preset)}
              </button>
            ))}
          </div>
        </div>
        <input
          type="range"
          min={100}
          max={100000}
          step={100}
          value={Math.min(amount, 100000)}
          onChange={handleSlider}
          className="w-full h-2 bg-black/20 appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:bg-black [&::-webkit-slider-thumb]:border-0 [&::-webkit-slider-thumb]:cursor-pointer"
        />
      </div>

      {/* Two outcomes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Fail scenario */}
        <motion.div
          key={`fail-${amount}`}
          initial={reduced ? {} : { opacity: 0.5, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
          className="p-5 border-4 border-black bg-brutal-yellow shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
        >
          <div className="text-xs font-black uppercase text-black/50 mb-1">
            If the Plan Fails
          </div>
          <div className="text-3xl font-black text-black mb-1">
            {formatUSD(failReturn)}
          </div>
          <div className="text-sm font-bold text-black/60 mb-3">
            +{formatUSD(failProfit)} profit ({FAIL_MULTIPLIER.toFixed(1)}x your money)
          </div>
          <div className="text-xs text-black/40 font-medium space-y-1">
            <p>
              10% annual staking yield × 15 years.
            </p>
            <p>
              Principal escrowed in locked stablecoin staking.
              Returned with bonus if threshold not met.
            </p>
            <p className="font-bold text-black/60 pt-1">
              Your &ldquo;worst case&rdquo; is {FAIL_MULTIPLIER.toFixed(1)}x your money.
            </p>
          </div>
        </motion.div>

        {/* Succeed scenario */}
        <motion.div
          key={`succeed-${amount}`}
          initial={reduced ? {} : { opacity: 0.5, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
          className="p-5 border-4 border-black bg-brutal-cyan shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
        >
          <div className="text-xs font-black uppercase text-black/50 mb-1">
            If the Plan Succeeds
          </div>
          <div className="text-3xl font-black text-black mb-1">
            {formatUSD(annualRevShare)}/yr
          </div>
          <div className="text-sm font-bold text-black/60 mb-3">
            {(VICTORY_BOND_ANNUAL_RETURN_PCT.value * 100).toFixed(0)}% annual revenue share of treaty funding flows
          </div>
          <div className="text-xs text-black/40 font-medium space-y-1">
            <p>
              Plus your personal lifetime income increases by{" "}
              <span className="font-bold text-black/60">
                {formatUSD(TREATY_INCOME_GAIN)}–{formatUSD(WISHONIA_INCOME_GAIN)}
              </span>{" "}
              — just for being alive when the treaty passes.
            </p>
            <p className="font-bold text-black/60 pt-1">
              That&apos;s everyone. Not just bondholders. Everyone.
            </p>
          </div>
        </motion.div>
      </div>

      {/* Expected value / break-even */}
      <div className="p-4 border-2 border-black bg-black/5">
        <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-4 mb-2">
          <span className="text-xs font-black uppercase text-black/40">
            Break-even probability
          </span>
          <span className="text-lg font-black text-black">
            {breakevenPct < 0.01
              ? breakevenPct.toFixed(4)
              : breakevenPct < 1
                ? breakevenPct.toFixed(3)
                : breakevenPct.toFixed(1)}%
          </span>
        </div>
        <p className="text-xs text-black/40 font-medium">
          If you believe there&apos;s even a{" "}
          <span className="font-bold text-black/60">
            {breakevenPct < 1
              ? `${breakevenPct.toFixed(3)}%`
              : `${breakevenPct.toFixed(1)}%`}
          </span>{" "}
          chance this works, your expected value is positive.
          And if it doesn&apos;t work, you still get {formatUSD(failReturn)} back.
        </p>
      </div>
    </div>
  );
}
