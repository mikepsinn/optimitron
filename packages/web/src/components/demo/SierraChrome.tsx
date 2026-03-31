"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, animate } from "framer-motion";
import { useSierraGame } from "./SierraGameContext";
import { DEATHS_PER_SECOND } from "@/data/collapse-constants";
import { playCoinSound } from "@/lib/wish-sound";
import {
  GLOBAL_HALE_CURRENT,
  TREATY_PROJECTED_HALE_YEAR_15,
  GLOBAL_AVG_INCOME_2025,
  TREATY_TRAJECTORY_AVG_INCOME_YEAR_15,
} from "@optimitron/data/parameters";

const ARCADE = "font-pixel";
const TYPEWRITER_SPEED = 30; // chars per second

const haleCurrent = GLOBAL_HALE_CURRENT.value.toFixed(1);
const haleTarget = TREATY_PROJECTED_HALE_YEAR_15.value.toFixed(1);
const incomeCurrent = `$${Math.round(GLOBAL_AVG_INCOME_2025.value / 1000)}K`;
const incomeTarget = `$${Math.round(TREATY_TRAJECTORY_AVG_INCOME_YEAR_15.value / 1000)}K`;

// ---------------------------------------------------------------------------
// Quest Metrics (top-left) — HALE + Income with current → target
// ---------------------------------------------------------------------------

function QuestMetrics() {
  const haleProgress = (GLOBAL_HALE_CURRENT.value / TREATY_PROJECTED_HALE_YEAR_15.value) * 100;
  const incomeProgress = (GLOBAL_AVG_INCOME_2025.value / TREATY_TRAJECTORY_AVG_INCOME_YEAR_15.value) * 100;

  return (
    <div className="flex gap-4 px-2 py-1">
      {/* HALE meter */}
      <div className="flex items-center gap-2">
        <span className="text-lg">❤️</span>
        <div className="flex flex-col gap-0.5">
          <span className={`${ARCADE} text-xs text-brutal-cyan`}>
            HALE {haleCurrent}→{haleTarget}
          </span>
          <div className="w-28 h-2.5 bg-zinc-800 border border-brutal-cyan/50 rounded-sm overflow-hidden">
            <div className="h-full bg-brutal-cyan" style={{ width: `${haleProgress}%` }} />
          </div>
        </div>
      </div>
      {/* Income meter */}
      <div className="flex items-center gap-2">
        <span className="text-lg">💰</span>
        <div className="flex flex-col gap-0.5">
          <span className={`${ARCADE} text-xs text-brutal-yellow`}>
            INCOME {incomeCurrent}→{incomeTarget}
          </span>
          <div className="w-28 h-2.5 bg-zinc-800 border border-brutal-yellow/50 rounded-sm overflow-hidden">
            <div className="h-full bg-brutal-yellow" style={{ width: `${incomeProgress}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Death Ticker (top-right)
// ---------------------------------------------------------------------------

function DeathTicker() {
  const ref = useRef<HTMLSpanElement>(null);
  const startRef = useRef(Date.now());

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf: number;
    function tick() {
      const elapsed = (Date.now() - startRef.current) / 1000;
      const deaths = Math.floor(elapsed * DEATHS_PER_SECOND);
      if (el) el.textContent = deaths.toLocaleString();
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="flex items-center gap-2 px-2 py-1 justify-end text-right">
      <div className="flex flex-col gap-0.5 items-end text-right">
        <div className="flex items-center gap-1">
          <span className="text-lg">💀</span>
          <span className={`${ARCADE} text-xs text-brutal-red tabular-nums`} ref={ref}>0</span>
        </div>
        <span className={`${ARCADE} text-xs text-brutal-red`}>
          HUMANS 
        </span>
        <span className={`${ARCADE} text-xs text-brutal-red`}>
          TERMINATED
        </span>
        <div className="flex items-center gap-1.5 justify-end">
          <span className={`${ARCADE} text-[10px] text-muted-foreground`}>THIS SESSION</span>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Quest Meters (below top bar)
// ---------------------------------------------------------------------------

function QuestMeters() {
  const { state } = useSierraGame();

  return (
    <AnimatePresence>
      {state.questVisible && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="overflow-hidden"
        >
          <div className="flex gap-4 px-4 py-2 bg-foreground/90 backdrop-blur-sm border-b-4 border-primary">
            {/* HALE meter */}
            <div className="flex-1">
              <div className="flex justify-between mb-1">
                <span
                  className={`${ARCADE} text-[10px] text-brutal-cyan uppercase`}
                >
                  HALE
                </span>
                <span
                  className={`${ARCADE} text-[10px] text-muted-foreground`}
                >
                  63.3 → 69.8 yrs
                </span>
              </div>
              <div className="h-3 bg-muted border-2 border-primary">
                <motion.div
                  className="h-full bg-brutal-cyan"
                  initial={{ width: 0 }}
                  animate={{
                    width: `${state.haleProgress * 100}%`,
                  }}
                  transition={{ duration: 0.8 }}
                />
              </div>
            </div>
            {/* Income meter */}
            <div className="flex-1">
              <div className="flex justify-between mb-1">
                <span
                  className={`${ARCADE} text-[10px] text-brutal-yellow uppercase`}
                >
                  INCOME
                </span>
                <span
                  className={`${ARCADE} text-[10px] text-muted-foreground`}
                >
                  $18.7K → $149K
                </span>
              </div>
              <div className="h-3 bg-muted border-2 border-primary">
                <motion.div
                  className="h-full bg-brutal-yellow"
                  initial={{ width: 0 }}
                  animate={{
                    width: `${state.incomeProgress * 100}%`,
                  }}
                  transition={{ duration: 0.8 }}
                />
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ---------------------------------------------------------------------------
// Narrator Box (bottom)
// ---------------------------------------------------------------------------

function NarratorBox() {
  const { state } = useSierraGame();
  const [displayedText, setDisplayedText] = useState("");
  const charIndexRef = useRef(0);

  useEffect(() => {
    // Reset on new narration
    setDisplayedText("");
    charIndexRef.current = 0;

    if (!state.narrationText) return;

    // If audio is playing, show full text immediately
    if (state.isNarrating) {
      setDisplayedText(state.narrationText);
      return;
    }

    // Otherwise, typewriter effect
    const interval = setInterval(() => {
      charIndexRef.current += 1;
      const text = state.narrationText;
      if (charIndexRef.current >= text.length) {
        setDisplayedText(text);
        clearInterval(interval);
      } else {
        setDisplayedText(text.slice(0, charIndexRef.current));
      }
    }, 1000 / TYPEWRITER_SPEED);

    return () => clearInterval(interval);
  }, [state.narrationText, state.isNarrating]);

  if (!state.narrationText) return null;

  return (
    <div className="bg-foreground border-t-4 border-brutal-cyan px-4 py-3 flex gap-3 items-start">
      {/* Wishonia portrait */}
      <div className="w-12 h-12 sm:w-16 sm:h-16 shrink-0 border-2 border-primary bg-brutal-cyan flex items-center justify-center">
        <span className="text-2xl sm:text-3xl">🛸</span>
      </div>
      {/* Narration text */}
      <div className="flex-1 min-w-0">
        <p
          className={`${ARCADE} text-[10px] sm:text-xs text-background leading-relaxed`}
        >
          {displayedText}
          {displayedText.length < state.narrationText.length && (
            <span className="animate-pulse">▌</span>
          )}
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Verb Bar (bottom-left)
// ---------------------------------------------------------------------------

const VERBS = [
  { mode: "look" as const, icon: "👁", label: "LOOK" },
  { mode: "use" as const, icon: "✋", label: "USE" },
  { mode: "walk" as const, icon: "🚶", label: "WALK" },
  { mode: "talk" as const, icon: "💬", label: "TALK" },
];

function VerbBar() {
  const { state, dispatch } = useSierraGame();

  return (
    <div className="flex gap-1">
      {VERBS.map((v) => (
        <button
          key={v.mode}
          onClick={() => dispatch({ type: "SET_CURSOR", mode: v.mode })}
          className={`${ARCADE} text-[10px] sm:text-[10px] px-2 py-1 border-2 border-primary transition-colors ${
            state.cursorMode === v.mode
              ? "bg-brutal-pink text-brutal-pink-foreground"
              : "bg-foreground text-muted-foreground hover:bg-muted"
          }`}
        >
          <span className="mr-0.5">{v.icon}</span>
          <span className="hidden sm:inline">{v.label}</span>
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Inventory Bar (bottom-right)
// ---------------------------------------------------------------------------

function InventoryBar() {
  const { state } = useSierraGame();
  const [newItemId, setNewItemId] = useState<string | null>(null);
  const prevLengthRef = useRef(state.inventory.length);

  useEffect(() => {
    if (state.inventory.length > prevLengthRef.current) {
      const latest = state.inventory[state.inventory.length - 1];
      if (latest) {
        setNewItemId(latest.id);
        void playCoinSound();
        const timeout = setTimeout(() => setNewItemId(null), 2000);
        return () => clearTimeout(timeout);
      }
    }
    prevLengthRef.current = state.inventory.length;
  }, [state.inventory]);

  // Hide inventory bar when empty
  if (state.inventory.length === 0) return null;

  return (
    <div className="flex gap-1">
      {Array.from({ length: 8 }, (_, i) => {
        const item = state.inventory[i];
        const isNew = item?.id === newItemId;
        return (
          <div
            key={i}
            className={`w-8 h-8 sm:w-10 sm:h-10 border-2 border-primary flex items-center justify-center text-sm sm:text-lg transition-all ${
              item
                ? isNew
                  ? "bg-brutal-cyan ring-2 ring-brutal-cyan animate-pulse"
                  : "bg-foreground"
                : "bg-muted/30"
            }`}
            title={item?.name}
          >
            {item?.icon ?? ""}
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sierra Chrome (the wrapper)
// ---------------------------------------------------------------------------

interface SierraChromeProps {
  children: React.ReactNode;
}

export function SierraChrome({ children }: SierraChromeProps) {
  const { state } = useSierraGame();

  if (!state.enabled) return <>{children}</>;

  return (
    <div className="relative flex flex-col h-full overflow-hidden">
      {/* Top bar: Score + Death ticker */}
      <div className="absolute top-0 left-0 right-0 z-30 flex justify-between items-start p-2 pointer-events-none">
        <div className="pointer-events-auto">
          <QuestMetrics />
        </div>
        <div className="pointer-events-auto">
          <DeathTicker />
        </div>
      </div>


{/* Slide content area */}
      <div className="flex-1 pt-14 overflow-hidden">{children}</div>

    </div>
  );
}
