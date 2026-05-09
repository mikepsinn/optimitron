"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/retroui/Card";
import { Button } from "@/components/retroui/Button";
import { SourceChip } from "./SourceChip";
import { ParameterizedText } from "./ParameterizedText";
import { ProbabilitySlider } from "./ProbabilitySlider";
import type { ChainNodeContent } from "@/lib/reasoning/arm-content";

export function ClaimNodeView({
  content,
  isColdOpener,
  probability,
  onProbabilityChange,
  onAnswer,
  onEndThis,
}: {
  content: ChainNodeContent;
  isColdOpener: boolean;
  probability: number;
  onProbabilityChange: (v: number) => void;
  onAnswer: (answer: "yes" | "no") => void;
  onEndThis: () => void;
}) {
  const body =
    isColdOpener && content.coldOpenerBody
      ? content.coldOpenerBody
      : content.body;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="bg-background text-foreground border-4 border-primary p-6 sm:p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-2xl mx-auto mb-6">
        <h2 className="text-center text-xl sm:text-2xl md:text-3xl font-black uppercase leading-tight mb-4">
          <ParameterizedText text={content.headline} />
        </h2>
        <p className="text-center text-base sm:text-lg font-bold leading-snug mb-4">
          <ParameterizedText text={body} />
        </p>
        {content.sources.length > 0 ? (
          <div className="flex flex-wrap justify-center gap-2 mb-4">
            {content.sources.map((s, i) => (
              <SourceChip key={i} source={s} />
            ))}
          </div>
        ) : null}

        <div className="border-t-2 border-primary/20 pt-4 mb-4">
          <ProbabilitySlider
            label="My confidence"
            value={probability}
            onChange={onProbabilityChange}
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={() => onAnswer("yes")}
            className="flex-1 h-14 text-lg font-black uppercase bg-background hover:bg-background/90 text-foreground border-4 border-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
          >
            Yes
          </Button>
          <Button
            onClick={() => onAnswer("no")}
            className="flex-1 h-14 text-lg font-black uppercase bg-foreground hover:bg-foreground/90 text-background border-4 border-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
          >
            No
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
