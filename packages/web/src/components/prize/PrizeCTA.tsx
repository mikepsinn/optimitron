"use client";

import Link from "next/link";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { PRIZE_POOL_HORIZON_MULTIPLE } from "@/lib/parameters-calculations-citations";
import { fmtParam } from "@/lib/format-parameter";

const variantStyles = {
  pink: {
    bg: "bg-brutal-pink",
    text: "text-brutal-pink-foreground",
    subtext: "text-background",
    stat: "border-border text-brutal-pink-foreground",
    statLabel: "text-muted-foreground",
    btn: "bg-foreground text-background hover:bg-foreground/80",
    kicker: "text-muted-foreground",
  },
  yellow: {
    bg: "bg-brutal-yellow",
    text: "text-foreground",
    subtext: "text-foreground",
    stat: "border-primary text-foreground",
    statLabel: "text-muted-foreground",
    btn: "bg-foreground text-background hover:bg-foreground/80",
    kicker: "text-muted-foreground",
  },
  cyan: {
    bg: "bg-brutal-cyan",
    text: "text-foreground",
    subtext: "text-foreground",
    stat: "border-primary text-foreground",
    statLabel: "text-muted-foreground",
    btn: "bg-foreground text-background hover:bg-foreground/80",
    kicker: "text-muted-foreground",
  },
  dark: {
    bg: "bg-foreground",
    text: "text-background",
    subtext: "text-background",
    stat: "border-border text-background",
    statLabel: "text-muted-foreground",
    btn: "bg-brutal-pink text-brutal-pink-foreground hover:bg-brutal-pink/80",
    kicker: "text-muted-foreground",
  },
} as const;

interface PrizeCTAProps {
  headline: string;
  body: string;
  variant?: keyof typeof variantStyles;
}

export function PrizeCTA({ headline, body, variant = "pink" }: PrizeCTAProps) {
  const s = variantStyles[variant];

  return (
    <ScrollReveal>
      <div
        className={`${s.bg} border-4 border-primary p-8 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]`}
      >
        <p className={`text-[10px] font-black uppercase tracking-[0.3em] ${s.kicker} mb-3`}>
          Earth Optimization Prize
        </p>
        <h3 className={`text-xl font-black uppercase ${s.text} mb-2`}>
          {headline}
        </h3>
        <p className={`text-sm font-bold ${s.subtext} mb-5 leading-relaxed`}>
          {body}
        </p>
        <div className="flex flex-wrap gap-4 mb-5">
          <div className={`border-2 ${s.stat} px-3 py-1.5`}>
            <div className={`text-[10px] font-black uppercase ${s.statLabel}`}>Plan fails</div>
            <div className="text-sm font-black">~{fmtParam(PRIZE_POOL_HORIZON_MULTIPLE)} back</div>
          </div>
          <div className={`border-2 ${s.stat} px-3 py-1.5`}>
            <div className={`text-[10px] font-black uppercase ${s.statLabel}`}>Plan succeeds</div>
            <div className="text-sm font-black">Higher GDP</div>
          </div>
          <div className={`border-2 ${s.stat} px-3 py-1.5`}>
            <div className={`text-[10px] font-black uppercase ${s.statLabel}`}>Downside</div>
            <div className="text-sm font-black">None</div>
          </div>
        </div>
        <Link
          href="/prize"
          className={`inline-flex items-center justify-center ${s.btn} border-4 border-primary px-6 py-2.5 text-sm font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]`}
        >
          Play the Game
        </Link>
      </div>
    </ScrollReveal>
  );
}
