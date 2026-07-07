"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/retroui/Card";
import { Button } from "@/components/retroui/Button";
import { ParameterizedText } from "./ParameterizedText";
import type { InevitabilityContent } from "@/lib/reasoning/arm-content";
import type { NodeId } from "@/lib/reasoning/types";
import { KILL_CRITERIA } from "@/lib/reasoning/call-script";

export function InevitabilityNodeView({
  content,
  acceptedClaims,
  claimProbabilities,
  onRejectClaim,
  onProceed,
  onEndThis,
}: {
  content: InevitabilityContent;
  acceptedClaims: Array<{ id: NodeId; headline: string }>;
  claimProbabilities: Record<NodeId, number>;
  onRejectClaim: (id: NodeId) => void;
  onProceed: () => void;
  onEndThis: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="bg-background text-foreground border-4 border-primary p-6 sm:p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-2xl mx-auto mb-6">
        <p className="text-base sm:text-lg font-bold leading-snug whitespace-pre-line mb-6">
          <ParameterizedText text={content.body} />
        </p>

        <div className="border-t-2 border-primary/20 pt-4 mb-4">
          <h3 className="text-xs font-black uppercase mb-2">
            {content.rejectSelectorLabel}
          </h3>
          <ul className="space-y-2">
            {acceptedClaims.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => onRejectClaim(c.id)}
                  className="w-full text-left text-sm font-bold border-2 border-primary/40 hover:border-primary hover:bg-muted p-2 transition"
                >
                  <span className="font-black mr-2">
                    {Math.round((claimProbabilities[c.id] ?? 0.9) * 100)}%
                  </span>
                  {c.headline}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <Button
          onClick={onProceed}
          className="w-full h-14 text-lg font-black uppercase bg-background hover:bg-background/90 text-foreground border-4 border-primary shadow-none"
        >
          {content.proceedCtaLabel}
        </Button>

        <div className="mt-6 border-t-2 border-primary/20 pt-4">
          <h3 className="text-xs font-black uppercase mb-2">Kill criteria</h3>
          <ul className="list-disc pl-5 space-y-1 text-xs font-bold text-muted-foreground">
            {KILL_CRITERIA.map((k, i) => (
              <li key={i}>{k}</li>
            ))}
          </ul>
        </div>

        <button
          type="button"
          onClick={onEndThis}
          className="mt-4 w-full text-center text-xs font-black uppercase text-muted-foreground hover:text-foreground underline"
        >
          End this
        </button>
      </Card>
    </motion.div>
  );
}
