"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/retroui/Card";
import { Button } from "@/components/retroui/Button";
import { ParameterizedText } from "./ParameterizedText";
import { SourceChip } from "./SourceChip";
import type { ObjectionNodeContent } from "@/lib/reasoning/arm-content";

export function ObjectionNodeView({
  content,
  onReAnswer,
  onStillDisagree,
  onEndThis,
}: {
  content: ObjectionNodeContent;
  onReAnswer: () => void;
  onStillDisagree: () => void;
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
        <div className="mb-4 border-l-4 border-brutal-yellow bg-brutal-yellow/10 p-4">
          <h3 className="text-xs font-black uppercase mb-2 text-muted-foreground">
            The strongest version of your No:
          </h3>
          <p className="text-base font-bold leading-snug">
            <ParameterizedText text={content.steelman} />
          </p>
        </div>

        <div className="mb-4">
          <h3 className="text-xs font-black uppercase mb-2 text-muted-foreground">
            Our response:
          </h3>
          <p className="text-base font-bold leading-snug">
            <ParameterizedText text={content.rebuttal} />
          </p>
        </div>

        {content.sources.length > 0 ? (
          <div className="flex flex-wrap gap-2 mb-4">
            {content.sources.map((s, i) => (
              <SourceChip key={i} source={s} />
            ))}
          </div>
        ) : null}

        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={onReAnswer}
            className="flex-1 h-12 text-sm font-black uppercase bg-brutal-cyan hover:bg-brutal-cyan/90 text-brutal-cyan-foreground border-4 border-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
          >
            {content.reAnswerCta}
          </Button>
          <Button
            onClick={onStillDisagree}
            className="flex-1 h-12 text-sm font-black uppercase bg-background hover:bg-muted text-foreground border-4 border-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
          >
            {content.stillDisagreeCta}
          </Button>
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
