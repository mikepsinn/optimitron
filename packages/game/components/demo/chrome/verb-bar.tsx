"use client";

import { useState } from "react";
import { useDemoStore } from "@/lib/demo/store";
import { SFX } from "@/lib/demo/audio";
import { cn } from "@/lib/utils";
import { Eye, Hand, Footprints, MessageCircle, Package } from "lucide-react";

export type VerbType = "look" | "use" | "walk" | "talk" | "inventory";

interface VerbBarProps {
  onVerbSelect?: (verb: VerbType) => void;
  activeVerb?: VerbType;
  disabled?: boolean;
}

const VERBS: { id: VerbType; icon: React.ReactNode; label: string; emoji: string }[] = [
  { id: "look", icon: <Eye className="w-3 h-3 md:w-4 md:h-4" />, label: "LOOK", emoji: "👁" },
  { id: "use", icon: <Hand className="w-3 h-3 md:w-4 md:h-4" />, label: "USE", emoji: "✋" },
  { id: "walk", icon: <Footprints className="w-3 h-3 md:w-4 md:h-4" />, label: "WALK", emoji: "🚶" },
  { id: "talk", icon: <MessageCircle className="w-3 h-3 md:w-4 md:h-4" />, label: "TALK", emoji: "💬" },
  { id: "inventory", icon: <Package className="w-3 h-3 md:w-4 md:h-4" />, label: "INV", emoji: "📦" },
];

/**
 * Sierra-style Verb Bar
 * Decorative in auto-play mode, can be interactive
 */
export function VerbBar({ onVerbSelect, activeVerb, disabled }: VerbBarProps) {
  const { palette, isRecordingMode, isMuted } = useDemoStore();
  const [hoveredVerb, setHoveredVerb] = useState<VerbType | null>(null);

  // Hide in recording mode
  if (isRecordingMode) return null;

  const handleClick = (verb: VerbType) => {
    if (disabled) return;
    
    if (!isMuted) {
      SFX.click();
    }
    
    onVerbSelect?.(verb);
  };

  const handleHover = (verb: VerbType | null) => {
    setHoveredVerb(verb);
    if (verb && !isMuted) {
      SFX.hover();
    }
  };

  return (
    <div className={cn(
      "verb-bar",
      `palette-${palette}`,
      disabled && "opacity-50 pointer-events-none"
    )}>
      {VERBS.map((verb) => (
        <button
          key={verb.id}
          className={cn(
            "verb-button",
            activeVerb === verb.id && "active",
            hoveredVerb === verb.id && "bg-[var(--sierra-primary)]/20"
          )}
          onClick={() => handleClick(verb.id)}
          onMouseEnter={() => handleHover(verb.id)}
          onMouseLeave={() => handleHover(null)}
          disabled={disabled}
          aria-label={verb.label}
        >
          <span className="hidden md:inline">{verb.icon}</span>
          <span className="md:hidden">{verb.emoji}</span>
          <span className="hidden sm:inline">{verb.label}</span>
        </button>
      ))}
    </div>
  );
}

export default VerbBar;
