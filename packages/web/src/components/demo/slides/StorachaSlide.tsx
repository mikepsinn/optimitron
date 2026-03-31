"use client";

import { useReducedMotion, motion } from "framer-motion";

const ARCADE = "font-pixel";

const SNAPSHOTS = [
  { label: "WISHOCRACY AGGREGATION", detail: "us-federal | 847 participants", cid: "bafy...k7qR3" },
  { label: "POLICY ANALYSIS", detail: "12 categories | Grade B+", cid: "bafy...xW9m2" },
  { label: "HEALTH ANALYSIS", detail: "N-of-1 | 180 days | encrypted", cid: "bafy...pN4d8" },
  { label: "BUDGET OPTIMIZATION", detail: "$6.75T analyzed", cid: "bafy...vT6j1" },
] as const;

/** Storacha slide — immutable evidence vault with CID chain */
export default function StorachaSlide() {
  const reduced = useReducedMotion();

  return (
    <div className="relative flex flex-col items-center justify-center h-full text-center px-4 sm:px-8 overflow-hidden">
      {/* Title */}
      <motion.h2
        initial={reduced ? false : { y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className={`${ARCADE} text-xl sm:text-2xl md:text-3xl text-foreground uppercase mb-8`}
      >
        STORACHA: IMMUTABLE EVIDENCE CHAIN
      </motion.h2>

      {/* Vault container */}
      <motion.div
        initial={reduced ? false : { scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.4, type: "spring" }}
        className="border-4 border-primary bg-foreground w-full max-w-xl p-4 sm:p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-6"
      >
        {/* Vault header */}
        <div className="border-4 border-background/30 bg-background/10 p-2 mb-4">
          <p className={`${ARCADE} text-xs sm:text-sm text-background uppercase tracking-wider`}>
            IPFS VAULT &mdash; CONTENT-ADDRESSED &middot; CHAINED
          </p>
        </div>

        {/* Snapshot rows with chain arrows */}
        <div className="space-y-1">
          {SNAPSHOTS.map((snap, i) => (
            <div key={snap.cid}>
              {i > 0 && (
                <motion.div
                  initial={reduced ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 + i * 0.15 - 0.05, duration: 0.2 }}
                  className="flex justify-center py-0.5"
                >
                  <span className={`${ARCADE} text-xs text-brutal-cyan`}>&#x2191; previousCid</span>
                </motion.div>
              )}
              <motion.div
                initial={reduced ? false : { x: -30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4 + i * 0.15, duration: 0.3 }}
                className="border-4 border-background/30 bg-background/5 p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1"
              >
                <div className="flex flex-col items-start">
                  <span className={`${ARCADE} text-[10px] sm:text-xs text-background uppercase`}>
                    {snap.label}
                  </span>
                  <span className="font-mono text-[9px] text-background/60">
                    {snap.detail}
                  </span>
                </div>
                <span className="font-mono text-[10px] text-brutal-cyan">
                  {snap.cid}
                </span>
              </motion.div>
            </div>
          ))}
        </div>

        {/* ACCESS DENIED badge */}
        <motion.div
          initial={reduced ? false : { scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 1.2, type: "spring", stiffness: 300 }}
          className="mt-4 inline-block border-4 border-brutal-red bg-brutal-red px-6 py-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
          style={{ animation: "access-denied-pulse 1.5s step-end infinite" }}
        >
          <p className={`${ARCADE} text-sm sm:text-base text-brutal-red-foreground uppercase`}>
            &#x1F6AB; CHAIN VERIFIED &middot; TAMPER-PROOF
          </p>
        </motion.div>
      </motion.div>

      {/* Description */}
      <motion.p
        initial={reduced ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.4 }}
        className={`${ARCADE} text-xs sm:text-sm text-foreground leading-relaxed max-w-lg`}
      >
        Each record links to the last. Break the chain?
        <br />
        The hash won&apos;t match.
      </motion.p>

      {/* Footer */}
      <motion.p
        initial={reduced ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.8, duration: 0.3 }}
        className={`${ARCADE} text-[10px] text-muted-foreground mt-4`}
      >
        POWERED BY STORACHA &middot; IPFS &middot; FILECOIN
      </motion.p>

      <style>{`
        @keyframes access-denied-pulse {
          from, to { opacity: 1; }
          50% { opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}
