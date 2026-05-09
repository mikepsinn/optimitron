"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/retroui/Card";
import { Button } from "@/components/retroui/Button";
import { UrgencyTimer } from "./UrgencyTimer";
import { HandoffComposer } from "./HandoffComposer";
import { ReferrerCohortStats } from "./ReferrerCohortStats";
import type {
  HandoffContent,
  ReplicationCtaContent,
} from "@/lib/reasoning/arm-content";
import type { RelationshipBucket } from "@/lib/reasoning/types";

export function ReplicationNodeView({
  content,
  handoffTemplates,
  buildReferralUrl,
  onSend,
  onSigned,
  onWalkAway,
  cohortStats,
  signatureCount,
  threshold,
}: {
  content: ReplicationCtaContent;
  handoffTemplates: Record<RelationshipBucket, HandoffContent>;
  buildReferralUrl: (bucket: RelationshipBucket) => string;
  onSend: (p: { bucket: RelationshipBucket; channel: string; message: string }) => void;
  onSigned: () => void;
  onWalkAway: () => void;
  cohortStats?: {
    referredCount: number;
    votedCount: number;
    forwardedCount: number;
    chainDepth: number;
  };
  signatureCount: number;
  threshold: number;
}) {
  const [selectedBucket, setSelectedBucket] = useState<RelationshipBucket | null>(null);
  const [firstSendConfirmed, setFirstSendConfirmed] = useState(false);

  const handleSend = (bucket: RelationshipBucket, params: { message: string; channel: string }) => {
    onSend({ bucket, ...params });
    setFirstSendConfirmed(true);
  };
  const handleCopy = (bucket: RelationshipBucket, message: string) => {
    void navigator.clipboard.writeText(message);
    onSend({ bucket, channel: "copy", message });
    setFirstSendConfirmed(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="bg-background text-foreground border-4 border-primary p-6 sm:p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-2xl mx-auto mb-6">
        <div className="mb-4 text-center">
          <p className="text-xs font-black uppercase text-muted-foreground">
            Current signature count
          </p>
          <p className="text-2xl font-black">
            {signatureCount.toLocaleString()} / {threshold.toLocaleString()}
          </p>
        </div>

        <div className="mb-4">
          <UrgencyTimer durationSeconds={30} copy={content.urgencyCopy} />
        </div>

        <h2 className="text-center text-xl sm:text-2xl font-black uppercase mb-4">
          {content.primaryCta}
        </h2>

        <div className="grid grid-cols-2 gap-2 mb-4">
          {content.buckets.map((bucket) => (
            <Button
              key={bucket}
              onClick={() => setSelectedBucket(bucket)}
              className={`h-12 text-xs font-black uppercase border-4 border-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${selectedBucket === bucket ? "bg-foreground text-background" : "bg-background text-foreground hover:bg-background/90"}`}
            >
              {bucket.replace("-", " / ")}
            </Button>
          ))}
        </div>

        {selectedBucket && handoffTemplates[selectedBucket] ? (
          <HandoffComposer
            template={handoffTemplates[selectedBucket]}
            url={buildReferralUrl(selectedBucket)}
            onSend={(p) => handleSend(selectedBucket, p)}
            onCopy={(m) => handleCopy(selectedBucket, m)}
          />
        ) : null}

        {firstSendConfirmed ? (
          <div className="mt-4 border-t-2 border-primary/20 pt-4">
            <p className="text-center text-sm font-bold mb-2">
              {content.expansionCopy}
            </p>
            <p className="text-center text-xs text-muted-foreground">
              {content.secondaryCta}
            </p>
          </div>
        ) : null}

        {cohortStats ? <ReferrerCohortStats {...cohortStats} /> : null}

        <div className="mt-6 flex flex-col sm:flex-row gap-2">
          <Button
            onClick={onSigned}
            className="flex-1 h-12 text-sm font-black uppercase bg-brutal-green hover:bg-brutal-green/90 text-brutal-green-foreground border-4 border-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
          >
            Sign the treaty
          </Button>
          <Button
            onClick={onWalkAway}
            className="flex-1 h-12 text-sm font-black uppercase bg-background hover:bg-muted text-foreground border-4 border-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
          >
            Walk away
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}
