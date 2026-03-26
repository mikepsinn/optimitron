"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  type DemoSegment,
  getPlaylistSegments,
  DEFAULT_PLAYLIST_ID,
} from "@/lib/demo-script";
import { getDemoAudio } from "@/lib/demo-tts";
import { DemoControls } from "./DemoControls";
import { SierraGameProvider, useSierraGame } from "./SierraGameContext";
import { SierraChrome } from "./SierraChrome";
import { getSlideComponent } from "./slides";
import { useSierraTransition } from "./SierraTransition";

// ---------------------------------------------------------------------------
// Background color map
// ---------------------------------------------------------------------------

const bgColorMap: Record<string, string> = {
  background: "bg-background",
  foreground: "bg-foreground text-background",
  pink: "bg-brutal-pink",
  cyan: "bg-brutal-cyan",
  yellow: "bg-brutal-yellow",
};

// ---------------------------------------------------------------------------
// Sierra-aware narration sync
// ---------------------------------------------------------------------------

function useNarrationSync(
  slide: DemoSegment,
  isPlaying: boolean,
) {
  const { dispatch, state } = useSierraGame();

  useEffect(() => {
    if (!state.enabled) return;
    dispatch({
      type: "SET_NARRATION",
      text: slide.narration,
      isNarrating: isPlaying,
    });
  }, [slide.id, isPlaying, state.enabled, dispatch, slide.narration]);

  // Sync Sierra metadata from segment (act, score, inventory)
  useEffect(() => {
    if (!state.enabled) return;
    if (slide.act) dispatch({ type: "SET_ACT", act: slide.act });
    if (slide.scoreAdd) dispatch({ type: "ADD_SCORE", amount: slide.scoreAdd });
    if (slide.inventoryAdd)
      dispatch({ type: "ADD_INVENTORY", item: slide.inventoryAdd });
  }, [slide.id, state.enabled, dispatch, slide.act, slide.scoreAdd, slide.inventoryAdd]);
}

// ---------------------------------------------------------------------------
// Inner player (consumes Sierra context)
// ---------------------------------------------------------------------------

function DemoPlayerInner({
  playlistId,
  sierraMode,
}: {
  playlistId: string;
  sierraMode: boolean;
}) {
  const reduced = useReducedMotion();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [subtitle, setSubtitle] = useState(
    () => slides[0]?.narration ?? "",
  );
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const slides = getPlaylistSegments(playlistId);
  const slide = slides[currentIndex]!;

  // Sync narration to Sierra chrome
  useNarrationSync(slide, isPlaying);

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
  }, []);

  const playSlideAudio = useCallback(
    async (index: number) => {
      const s = slides[index]!;
      setSubtitle(s.narration);

      if (isMuted) return;

      setIsLoadingAudio(true);
      try {
        const audio = await getDemoAudio(s.id, s.narration);
        if (audio) {
          audioRef.current = audio;
          audio.onended = () => {
            if (isPlaying && index < slides.length - 1) {
              setCurrentIndex(index + 1);
            } else {
              setIsPlaying(false);
            }
          };
          await audio.play();
        } else {
          // No audio — auto-advance after estimated duration
          const words = s.narration.split(/\s+/).length;
          const ms = (words / 150) * 60 * 1000;
          if (isPlaying && index < slides.length - 1) {
            setTimeout(() => setCurrentIndex(index + 1), ms);
          }
        }
      } catch {
        // TTS failed — subtitle-only mode
      } finally {
        setIsLoadingAudio(false);
      }
    },
    [isMuted, isPlaying, slides],
  );

  useEffect(() => {
    stopAudio();
    if (isPlaying) {
      void playSlideAudio(currentIndex);
    } else {
      setSubtitle(slides[currentIndex]!.narration);
    }
  }, [currentIndex, isPlaying, stopAudio, playSlideAudio, slides]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        if (currentIndex < slides.length - 1) {
          stopAudio();
          setCurrentIndex((i) => i + 1);
        }
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        if (currentIndex > 0) {
          stopAudio();
          setCurrentIndex((i) => i - 1);
        }
      } else if (e.key === " ") {
        e.preventDefault();
        setIsPlaying((p) => !p);
      } else if (e.key === "m") {
        setIsMuted((m) => !m);
      } else if (e.key === "f") {
        containerRef.current?.requestFullscreen?.();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [currentIndex, stopAudio, slides.length]);

  const goTo = (index: number) => {
    stopAudio();
    setCurrentIndex(index);
  };

  const bgClass =
    bgColorMap[slide.bgColor ?? "background"] ?? "bg-background";

  // Resolve slide component and transition
  const SlideComponent = getSlideComponent(slide.componentId);
  const transitionVariants = useSierraTransition();

  // Build slide content
  const slideContent = (
    <div className={`absolute inset-0 ${bgClass}`}>
      <AnimatePresence mode="wait">
        <motion.div
          key={slide.id}
          variants={reduced ? undefined : transitionVariants}
          initial={reduced ? false : "initial"}
          animate={reduced ? { opacity: 1 } : "animate"}
          exit={reduced ? { opacity: 1 } : "exit"}
          className="absolute inset-0 overflow-y-auto"
        >
          <SlideComponent />
        </motion.div>
      </AnimatePresence>

      {isLoadingAudio && (
        <div className="absolute top-4 right-4 text-xs font-black uppercase text-muted-foreground animate-pulse z-40">
          Loading audio...
        </div>
      )}
    </div>
  );

  return (
    <div ref={containerRef} className="relative h-full group">
      {/* Slide area — wrapped in Sierra chrome when enabled */}
      {sierraMode ? (
        <SierraChrome>{slideContent}</SierraChrome>
      ) : (
        slideContent
      )}

      {/* Overlay controls — visible on hover/tap */}
      <div className="absolute bottom-0 left-0 right-0 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-300 z-40">
        {/* Subtitle (only in non-sierra mode — sierra uses narrator box) */}
        {!sierraMode && (
          <div className="bg-foreground/90 backdrop-blur-sm px-3 sm:px-6 py-2 sm:py-3">
            <p className="text-xs sm:text-sm font-bold text-background leading-relaxed line-clamp-2">
              {subtitle}
            </p>
          </div>
        )}

        <DemoControls
          current={currentIndex}
          total={slides.length}
          isPlaying={isPlaying}
          isMuted={isMuted}
          onPrev={() => goTo(Math.max(0, currentIndex - 1))}
          onNext={() => goTo(Math.min(slides.length - 1, currentIndex + 1))}
          onTogglePlay={() => setIsPlaying((p) => !p)}
          onToggleMute={() => setIsMuted((m) => !m)}
          onGoTo={goTo}
          onFullscreen={() => containerRef.current?.requestFullscreen?.()}
        />
      </div>

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted/30 z-50 pointer-events-none">
        <div
          className="h-full bg-brutal-pink transition-all duration-300"
          style={{
            width: `${((currentIndex + 1) / slides.length) * 100}%`,
          }}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Public component (wraps with Sierra context when needed)
// ---------------------------------------------------------------------------

interface DemoPlayerProps {
  playlistId?: string;
}

const SIERRA_PLAYLISTS = new Set(["hackathon"]);

export function DemoPlayer({
  playlistId = DEFAULT_PLAYLIST_ID,
}: DemoPlayerProps) {
  const sierraMode =
    SIERRA_PLAYLISTS.has(playlistId) ||
    (typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).get("sierra") === "true");

  return (
    <SierraGameProvider enabled={sierraMode}>
      <DemoPlayerInner playlistId={playlistId} sierraMode={sierraMode} />
    </SierraGameProvider>
  );
}
