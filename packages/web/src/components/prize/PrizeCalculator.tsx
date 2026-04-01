"use client";

import { useState, useCallback } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  PRIZE_POOL_HORIZON_MULTIPLE,
  PRIZE_POOL_ANNUAL_RETURN,
  VOTE_TOKEN_VALUE,
  VOTE_2_CLAIMS_PAYOUT,
  fmtParam,
} from "@optimitron/data/parameters";
/**
 * Interactive Prize return calculator.
 *
 * Fail scenario:  deposit × PRIZE_POOL_HORIZON_MULTIPLE (~11.1x over 15 years)
 * Success scenario: VOTE points × pro-rata share of pool (VOTE_TOKEN_VALUE per VOTE if canonical pool size)
 */

const FAIL_MULTIPLIER = PRIZE_POOL_HORIZON_MULTIPLE.value;
const VOTE_VALUE = VOTE_TOKEN_VALUE.value;

const PRESET_AMOUNTS = [1];
const PRESET_VOTES = [1, 2, 5, 10];

function formatUSD(n: number): string {
  if (n >= 1_000_000) {
    return `$${(n / 1_000_000).toFixed(1)}M`;
  }
  if (n >= 1_000) {
    return `$${Math.round(n).toLocaleString("en-US")}`;
  }
  return `$${n.toFixed(2)}`;
}

export function PrizeCalculator() {
  const [depositAmount, setDepositAmount] = useState(1);
  const [voteCount, setVoteCount] = useState(2);
  const reduced = useReducedMotion();

  const handleDepositSlider = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setDepositAmount(Number(e.target.value));
  }, []);

  const handleDepositInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, "");
    setDepositAmount(Number(val) || 0);
  }, []);

  const failReturn = depositAmount * FAIL_MULTIPLIER;
  const failProfit = failReturn - depositAmount;
  const successPayout = voteCount * VOTE_VALUE;

  return (
    <div>
      {/* Deposit input */}
      <div className="mb-6">
        <label className="block text-xs font-black uppercase text-muted-foreground mb-2">
          Your Deposit (USDC)
        </label>
        <div className="flex items-center gap-4 mb-3">
          <div className="relative flex-grow max-w-xs">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg font-black text-muted-foreground">
              $
            </span>
            <input
              type="text"
              value={depositAmount.toLocaleString("en-US")}
              onChange={handleDepositInput}
              className="w-full pl-8 pr-3 py-3 text-xl font-black text-foreground border-4 border-primary bg-background shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:outline-none transition-shadow"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {PRESET_AMOUNTS.map((preset) => (
              <button
                key={preset}
                onClick={() => setDepositAmount(preset)}
                className={`px-3 py-2 text-xs font-black border-4 border-primary transition-colors ${
                  depositAmount === preset
                    ? "bg-foreground text-background"
                    : "bg-background text-foreground hover:bg-muted"
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
          value={Math.min(depositAmount, 100000)}
          onChange={handleDepositSlider}
          className="w-full h-2 bg-muted appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:bg-foreground [&::-webkit-slider-thumb]:border-0 [&::-webkit-slider-thumb]:cursor-pointer"
        />
      </div>

      {/* VOTE points input */}
      <div className="mb-6">
        <label className="block text-xs font-black uppercase text-muted-foreground mb-2">
          Verified Voters You Recruit
        </label>
        <div className="flex gap-2 flex-wrap">
          {PRESET_VOTES.map((preset) => (
            <button
              key={preset}
              onClick={() => setVoteCount(preset)}
              className={`px-4 py-2 text-sm font-black border-4 border-primary transition-colors ${
                voteCount === preset
                  ? "bg-foreground text-background"
                  : "bg-background text-foreground hover:bg-muted"
              }`}
            >
              {preset} voter{preset > 1 ? "s" : ""}
            </button>
          ))}
        </div>
      </div>

      {/* Two outcomes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Fail scenario (depositor wins) */}
        <motion.div
          key={`fail-${depositAmount}`}
          initial={reduced ? {} : { opacity: 0.5, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
          className="p-5 border-4 border-primary bg-brutal-yellow text-brutal-yellow-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
        >
          <div className="text-xs font-black uppercase mb-1">
            If Metrics Miss Targets (15 Years)
          </div>
          <div className="text-3xl font-black mb-1">
            {formatUSD(failReturn)}
          </div>
          <div className="text-sm font-bold mb-3">
            +{formatUSD(failProfit)} profit ({fmtParam(PRIZE_POOL_HORIZON_MULTIPLE)} your deposit)
          </div>
          <div className="text-xs font-bold space-y-1">
            <p>
              {fmtParam(PRIZE_POOL_ANNUAL_RETURN)} annual Prize fund return × 15 years.
            </p>
            <p className="font-bold pt-1">
              Your &ldquo;worst case&rdquo; is {fmtParam(PRIZE_POOL_HORIZON_MULTIPLE)} your money.
            </p>
          </div>
        </motion.div>

        {/* Success scenario (VOTE holders win) */}
        <motion.div
          key={`succeed-${voteCount}`}
          initial={reduced ? {} : { opacity: 0.5, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
          className="p-5 border-4 border-primary bg-brutal-cyan text-brutal-cyan-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
        >
          <div className="text-xs font-black uppercase mb-1">
            If Metrics Hit Targets (15 Years)
          </div>
          <div className="text-3xl font-black mb-1">
            {formatUSD(successPayout)}
          </div>
          <div className="text-sm font-bold mb-3">
            {voteCount} VOTE point{voteCount > 1 ? "s" : ""} × {formatUSD(VOTE_VALUE)} each
          </div>
          <div className="text-xs font-bold space-y-1">
            <p>
              VOTE holders split the pool pro-rata. Each VOTE point
              is worth ~{fmtParam(VOTE_TOKEN_VALUE)} if the canonical pool
              size materializes. You earned {voteCount} by recruiting {voteCount} verified voter{voteCount > 1 ? "s" : ""}.
            </p>
            <p className="font-bold pt-1">
              Plus everyone&apos;s lifetime income increases. Not just yours. Everyone&apos;s.
            </p>
          </div>
        </motion.div>
      </div>

      {/* Break-even */}
      <div className="p-4 border-4 border-primary bg-muted">
        <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-4 mb-2">
          <span className="text-xs font-black uppercase text-muted-foreground">
            Break-even probability
          </span>
          <span className="text-lg font-black text-foreground">
            0.0067%
          </span>
        </div>
        <p className="text-xs text-muted-foreground font-bold">
          That&apos;s 1 in 15,000. If you believe there&apos;s even a 0.0067% chance
          the 1% Treaty happens and the metrics move, your expected value is positive.
          And if it doesn&apos;t work, you still get {formatUSD(failReturn)} back.
        </p>
      </div>
    </div>
  );
}
