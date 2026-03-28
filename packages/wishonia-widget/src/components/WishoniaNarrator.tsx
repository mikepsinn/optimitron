/**
 * WishoniaNarrator — Drop-in talking character component.
 *
 * Combines WishoniaWidget + Gemini Live API audio streaming.
 * When `text` prop changes, she narrates it with lip-sync.
 * Falls back to text-driven lip-sync if Gemini Live is unavailable.
 *
 * Usage:
 * ```tsx
 * <WishoniaNarrator
 *   tokenEndpoint="/api/gemini-live-token"
 *   text="Your species named your planet... dirt."
 *   expression="eyeroll"
 *   bodyPose="shrug"
 *   onNarrationEnd={() => advanceSlide()}
 * />
 * ```
 */

import { useEffect, useRef, type CSSProperties } from "react";
import type { Expression, BodyPose } from "../types";
import { WishoniaWidget } from "./WishoniaWidget";
import { useWishoniaAnimator } from "../hooks/useWishoniaAnimator";
import { useGeminiLive } from "../hooks/useGeminiLive";

export interface WishoniaNarratorProps {
  // --- Gemini Live config ---
  /** URL to fetch ephemeral token (GET → { token: string }) */
  tokenEndpoint: string;
  /** Voice name (default "Kore") */
  voice?: string;
  /** System instruction for speaking style */
  speakingInstructions?: string;
  /** Model ID (default "gemini-3.1-flash-live-preview") */
  model?: string;

  // --- What to say ---
  /** Text to narrate. When this changes, she speaks it. */
  text?: string;

  // --- Character appearance ---
  expression?: Expression;
  bodyPose?: BodyPose;
  size?: number;

  // --- Positioning ---
  position?: "bottom-right" | "bottom-left" | "custom";
  style?: CSSProperties;
  hidden?: boolean;

  // --- Volume ---
  /** Volume 0–1 (default 0.8) */
  volume?: number;
  /** Mute audio (character still animates) */
  muted?: boolean;

  // --- Callbacks ---
  onNarrationStart?: () => void;
  onNarrationEnd?: () => void;
  onConnectionChange?: (connected: boolean) => void;

  // --- Sprite config ---
  spritePath?: string;
  spriteFormat?: "webp" | "png";
}

export function WishoniaNarrator({
  tokenEndpoint,
  voice,
  speakingInstructions,
  model,
  text,
  expression,
  bodyPose,
  size = 140,
  position = "bottom-right",
  style,
  hidden = false,
  volume = 0.8,
  muted = false,
  onNarrationStart,
  onNarrationEnd,
  onConnectionChange,
  spritePath,
  spriteFormat,
}: WishoniaNarratorProps) {
  const prevTextRef = useRef<string | undefined>(undefined);
  const onNarrationEndRef = useRef(onNarrationEnd);
  const onNarrationStartRef = useRef(onNarrationStart);
  const onConnectionChangeRef = useRef(onConnectionChange);
  onNarrationEndRef.current = onNarrationEnd;
  onNarrationStartRef.current = onNarrationStart;
  onConnectionChangeRef.current = onConnectionChange;

  // Gemini Live hook — handles audio streaming + AnalyserNode
  const live = useGeminiLive({
    tokenEndpoint,
    voice,
    speakingInstructions,
    model,
    volume: muted ? 0 : volume,
  });

  // Text-driven lip-sync fallback (for when Gemini Live is unavailable)
  const animator = useWishoniaAnimator({
    expression,
    bodyPose: bodyPose ?? "idle",
    spritePath,
    spriteFormat,
    // Only use analyserNode when connected — otherwise text-driven
    analyserNode: live.isConnected ? live.analyserNode : null,
  });

  // Propagate connection state
  useEffect(() => {
    onConnectionChangeRef.current?.(live.isConnected);
  }, [live.isConnected]);

  // Update volume when props change
  useEffect(() => {
    live.setVolume(muted ? 0 : volume);
  }, [volume, muted, live]);

  // Set up playback end callback on the audio queue
  useEffect(() => {
    // The AudioBufferQueue's onPlaybackEnd fires when all audio drains
    // We wire it through the live hook's isGenerating state
    if (!live.isGenerating && prevTextRef.current !== undefined) {
      // Only fire onNarrationEnd when we transition from generating → not generating
      // (not on initial mount)
    }
  }, [live.isGenerating]);

  // Speak when text changes
  useEffect(() => {
    if (text === undefined || text === prevTextRef.current) return;
    prevTextRef.current = text;

    if (!text) return;

    onNarrationStartRef.current?.();

    if (live.isConnected) {
      // Use Gemini Live for audio narration
      live.speak(text);
    } else {
      // Fallback: text-driven lip-sync (visual only, no audio)
      animator.speakText(text, expression);
      // Estimate narration duration: ~15 chars/second
      const estimatedMs = Math.max(2000, (text.length / 15) * 1000);
      setTimeout(() => {
        onNarrationEndRef.current?.();
      }, estimatedMs);
    }
  }, [text, live.isConnected]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fire onNarrationEnd when Gemini Live finishes generating
  useEffect(() => {
    if (!live.isGenerating && prevTextRef.current) {
      // Small delay to let remaining audio drain from the buffer
      const timer = setTimeout(() => {
        onNarrationEndRef.current?.();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [live.isGenerating]);

  if (hidden) return null;

  return (
    <WishoniaWidget
      position={position}
      style={style}
      analyserNode={live.isConnected ? live.analyserNode : null}
      expression={expression}
      bodyPose={bodyPose}
      size={size}
      spritePath={spritePath}
      spriteFormat={spriteFormat}
    />
  );
}
