"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/retroui/Card";
import { Button } from "@/components/retroui/Button";
import { KILL_CRITERIA } from "@/lib/reasoning/call-script";
import { UpdateLog } from "./UpdateLog";

type Tone = "cta-signed" | "cta-shared" | "decline-polite" | "goodbye";

export function TerminalNodeView({
  tone,
  body,
  onReset,
}: {
  tone: Tone;
  body: string;
  onReset?: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="bg-background text-foreground border-4 border-primary p-6 sm:p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-2xl mx-auto mb-6 text-center">
        <p className="text-lg font-bold leading-snug whitespace-pre-line mb-6">
          {body}
        </p>

        {tone === "decline-polite" || tone === "goodbye" ? (
          <div className="border-t-2 border-primary/20 pt-4 mb-4 text-left">
            <h3 className="text-xs font-black uppercase mb-2">Kill criteria</h3>
            <ul className="list-disc pl-5 space-y-1 text-xs font-bold text-muted-foreground">
              {KILL_CRITERIA.map((k, i) => (
                <li key={i}>{k}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {onReset ? (
          <Button
            onClick={onReset}
            className="h-10 text-xs font-black uppercase bg-background hover:bg-muted text-foreground border-4 border-primary shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
          >
            Change your mind?
          </Button>
        ) : null}

        <UpdateLog />
      </Card>
    </motion.div>
  );
}
