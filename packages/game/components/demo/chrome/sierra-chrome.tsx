"use client";

import { useDemoStore } from "@/lib/demo/store";
import { cn } from "@/lib/utils";
import { SierraHUD } from "./sierra-hud";
import { NarratorBox } from "./narrator-box";
import { VerbBar, type VerbType } from "./verb-bar";
import { Inventory, InventoryCompact } from "./inventory";

interface SierraChromeProps {
  narrationText: string;
  slideId?: string;
  onNarrationComplete?: () => void;
  onVerbSelect?: (verb: VerbType) => void;
  activeVerb?: VerbType;
  showVerbBar?: boolean;
  children: React.ReactNode;
}

/**
 * Sierra Chrome - Complete UI wrapper for the demo
 * Includes: HUD (top), Scene (center), Narrator (bottom), Verb Bar, Inventory
 */
export function SierraChrome({
  narrationText,
  slideId,
  onNarrationComplete,
  onVerbSelect,
  activeVerb,
  showVerbBar = true,
  children,
}: SierraChromeProps) {
  const { palette, isRecordingMode } = useDemoStore();

  return (
    <div className={cn(
      "relative w-full h-screen overflow-hidden",
      "crt-container crt-scanlines",
      `palette-${palette}`,
      "bg-[var(--sierra-bg)]"
    )}>
      {/* Top HUD - Score, Death Ticker, Quest Meters */}
      <SierraHUD />

      {/* Main Scene Area */}
      <main className={cn(
        "absolute inset-0",
        "pt-16 md:pt-20", // Space for HUD
        "pb-32 md:pb-40", // Space for narrator + verb bar
        "flex items-center justify-center",
        "overflow-hidden"
      )}>
        <div className="w-full h-full max-w-[1600px] mx-auto px-4">
          {children}
        </div>
      </main>

      {/* Bottom Section - Narrator, Verb Bar, Inventory */}
      <div className={cn(
        "fixed bottom-0 left-0 right-0 z-30",
        `palette-${palette}`
      )}>
        {/* Narrator Box */}
        <NarratorBox
          text={narrationText}
          slideId={slideId}
          onComplete={onNarrationComplete}
        />

        {/* Verb Bar + Inventory */}
        {showVerbBar && !isRecordingMode && (
          <div className={cn(
            "flex items-center justify-between",
            "px-2 pb-2 md:px-4 md:pb-4"
          )}>
            <VerbBar 
              onVerbSelect={onVerbSelect}
              activeVerb={activeVerb}
            />
            
            {/* Desktop Inventory */}
            <div className="hidden md:block">
              <Inventory />
            </div>
            
            {/* Mobile Inventory */}
            <div className="md:hidden">
              <InventoryCompact />
            </div>
          </div>
        )}
      </div>

      {/* CRT Glow Effect */}
      <div className={cn(
        "absolute inset-0 pointer-events-none",
        "crt-glow"
      )} />
    </div>
  );
}

export default SierraChrome;
