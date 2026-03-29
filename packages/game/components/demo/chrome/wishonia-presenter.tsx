"use client";

import { useEffect, useState } from "react";
import { useDemoStore } from "@/lib/demo/store";
import { useNarrationAudio } from "@/hooks/use-narration-audio";
import { cn } from "@/lib/utils";
import {
  WishoniaCharacter,
  useWishoniaAnimator,
  preloadTier0,
} from "@optimitron/wishonia-widget";
import type { Expression } from "@optimitron/wishonia-widget";

interface WishoniaPresenterProps {
  text: string;
  slideId?: string;
  expression?: string;
  bodyPose?: string;
}

function usePresenterSize() {
  const [size, setSize] = useState(110);

  useEffect(() => {
    function update() {
      const w = window.innerWidth;
      if (w < 480) setSize(70);
      else if (w < 768) setSize(100);
      else if (w < 1024) setSize(130);
      else setSize(160);
    }
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return size;
}

/**
 * Picture-in-picture Wishonia character in the lower-right corner.
 * Tries MP3 narration first (with audio-driven lip-sync via AnalyserNode).
 * Falls back to Gemini Live TTS when no MP3 exists.
 */
export function WishoniaPresenter({
  text,
  slideId,
  expression,
  bodyPose,
}: WishoniaPresenterProps) {
  const size = usePresenterSize();
  const safeText = text ?? "";

  // Try MP3 first — returns hasMp3 status + AnalyserNode for lip-sync
  const { hasMp3, analyserNode } = useNarrationAudio(slideId, true);

  // When hasMp3 === false (no MP3 for this slide), use live TTS
  const needsLiveTts = hasMp3 === false && safeText.length > 0;

  return (
    <div
      className={cn(
        "fixed z-[38] pointer-events-none",
        "transition-all duration-500 ease-out"
      )}
      style={{ bottom: -16, right: 16 }}
    >
      <div className="pointer-events-auto">
        {needsLiveTts ? (
          <LiveTtsPresenter
            text={safeText}
            expression={expression}
            bodyPose={bodyPose}
            size={size}
          />
        ) : (
          <AudioSyncPresenter
            analyserNode={analyserNode}
            expression={expression}
            bodyPose={bodyPose}
            size={size}
          />
        )}
      </div>
    </div>
  );
}

/**
 * Live TTS mode — lazy-loads WishoniaNarrator only when needed.
 * Used when no pre-generated MP3 exists for the current slide.
 */
function LiveTtsPresenter({
  text,
  expression,
  bodyPose,
  size,
}: {
  text: string;
  expression?: string;
  bodyPose?: string;
  size: number;
}) {
  const [Narrator, setNarrator] = useState<
    typeof import("@optimitron/wishonia-widget/narration").WishoniaNarrator | null
  >(null);
  const { isMuted, masterVolume, voiceVolume } = useDemoStore();

  useEffect(() => {
    import("@optimitron/wishonia-widget/narration").then((mod) => {
      setNarrator(() => mod.WishoniaNarrator);
    });
  }, []);

  if (!Narrator) {
    return (
      <WishoniaCharacter
        size={size}
        expression={expression as Expression}
        bodyPose={bodyPose}
      />
    );
  }

  return (
    <Narrator
      tokenEndpoint="/api/gemini-live-token"
      text={text}
      expression={expression as Parameters<typeof Narrator>[0]["expression"]}
      bodyPose={bodyPose as Parameters<typeof Narrator>[0]["bodyPose"]}
      size={size}
      position="custom"
      style={{ position: "relative" }}
      volume={masterVolume * voiceVolume}
      muted={isMuted}
      onNarrationEnd={() => {
        useDemoStore.getState().setNarrationEnded(true);
      }}
    />
  );
}

/**
 * MP3 mode — uses AnalyserNode from the audio element for real-time
 * amplitude-driven lip-sync. Mouth opens/closes based on actual audio
 * amplitude, not text timing.
 */
function AudioSyncPresenter({
  analyserNode,
  expression,
  bodyPose,
  size,
}: {
  analyserNode: AnalyserNode | null;
  expression?: string;
  bodyPose?: string;
  size: number;
}) {
  const { headSrc, bodySrc } = useWishoniaAnimator({
    analyserNode,
    expression: expression as Expression,
    bodyPose: bodyPose ?? "idle",
  });

  // Preload sprites on mount
  useEffect(() => {
    preloadTier0("/sprites/wishonia/", "png");
  }, []);

  const bodyHeight = Math.round(size * 0.57);

  return (
    <div style={{ position: "relative", width: size, height: size * 1.57 }}>
      {/* Head — bobs gently */}
      <div
        style={{
          position: "relative",
          zIndex: 2,
          width: "95%",
          margin: "0 auto",
          animation: "wishonia-bob 7s ease-in-out alternate infinite",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={headSrc}
          alt=""
          style={{ display: "block", width: "100%" }}
          draggable={false}
        />
      </div>
      {/* Body */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          marginTop: -12,
          maxHeight: bodyHeight,
          overflow: "hidden",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={bodySrc}
          alt=""
          style={{ display: "block", width: "100%" }}
          draggable={false}
        />
      </div>
    </div>
  );
}
