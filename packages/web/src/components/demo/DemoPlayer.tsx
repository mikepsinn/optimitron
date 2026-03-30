"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
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
// Wishonia character with lip-sync support
import { WishoniaCharacter } from "@optimitron/wishonia-widget";

// Preload common sprites on module load to avoid cancelled request churn
const SPRITE_PATH = "/sprites/wishonia/";
const PRELOAD_SPRITES = [
  "neutral-small", "neutral-open", "neutral-closed", "neutral-frown",
  "happy-small", "happy-open", "happy-closed",
  "body-idle", "body-presenting",
  "blink-smile",
];
if (typeof window !== "undefined") {
  PRELOAD_SPRITES.forEach((name) => {
    const img = new Image();
    img.src = `${SPRITE_PATH}${name}.png`;
  });
}

function WishoniaPresenter({ analyserNode }: { analyserNode: AnalyserNode | null }) {
  return (
    <WishoniaCharacter
      size={140}
      spritePath={SPRITE_PATH}
      spriteFormat="png"
      analyserNode={analyserNode}
    />
  );
}

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
  const slides = getPlaylistSegments(playlistId);

  const [currentIndex, setCurrentIndex] = useState(0);

  // Sync initial slide from URL hash after hydration
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (hash) {
      const idx = slides.findIndex((s) => s.id === hash);
      if (idx >= 0) setCurrentIndex(idx);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only on mount
  }, []);
  const [isPlaying, setIsPlaying] = useState(sierraMode);
  const [isMuted, setIsMuted] = useState(false);
  const [forceLive, setForceLive] = useState(false);
  const forceLiveRef = useRef(forceLive);
  useEffect(() => { forceLiveRef.current = forceLive; }, [forceLive]);

  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordChunksRef = useRef<Blob[]>([]);
  const displayStreamRef = useRef<MediaStream | null>(null);
  const [subtitle, setSubtitle] = useState(
    () => slides[0]?.narration ?? "",
  );
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [analyserNode, setAnalyserNode] = useState<AnalyserNode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Refs to read current values inside stable callbacks without adding deps
  const isPlayingRef = useRef(isPlaying);
  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);
  const isMutedRef = useRef(isMuted);
  useEffect(() => { isMutedRef.current = isMuted; }, [isMuted]);

  const slide = slides[currentIndex]!;

  // Sync narration to Sierra chrome
  useNarrationSync(slide, isPlaying);

  // Generation counter — increments on every slide/play change to cancel stale async work
  const generationRef = useRef(0);

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
  }, []);

  // Stable callback — only recreated when slides change (playlist switch)
  const playSlideAudio = useCallback(
    async (index: number, generation: number) => {
      const s = slides[index]!;
      setSubtitle(s.narration);

      if (isMutedRef.current) return;

      setIsLoadingAudio(true);
      try {
        const result = await getDemoAudio(s.id, s.narration, forceLiveRef.current);
        // Bail if user navigated away while we were loading
        if (generationRef.current !== generation) return;
        if (result) {
          const { audio, analyser } = result;
          audioRef.current = audio;
          setAnalyserNode(analyser);
          audio.onended = () => {
            if (isPlayingRef.current && index < slides.length - 1) {
              setCurrentIndex(index + 1);
            } else {
              setIsPlaying(false);
              // Auto-stop recording on last slide
              if (mediaRecorderRef.current) {
                mediaRecorderRef.current.stop();
                mediaRecorderRef.current = null;
                setIsRecording(false);
                document.exitFullscreen?.().catch(() => {});
              }
            }
          };
          // Final check before playing
          if (generationRef.current !== generation) {
            audio.pause();
            return;
          }
          await audio.play();
        } else {
          // No audio — auto-advance after estimated duration
          const words = s.narration.split(/\s+/).length;
          const ms = (words / 150) * 60 * 1000;
          if (isPlayingRef.current && index < slides.length - 1) {
            setTimeout(() => {
              if (generationRef.current === generation) {
                setCurrentIndex(index + 1);
              }
            }, ms);
          }
        }
      } catch {
        // TTS failed — subtitle-only mode
      } finally {
        setIsLoadingAudio(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- isMuted/isPlaying read via refs
    [slides],
  );

  useEffect(() => {
    const gen = ++generationRef.current;
    stopAudio();
    if (isPlaying) {
      void playSlideAudio(currentIndex, gen);
    } else {
      setSubtitle(slides[currentIndex]!.narration);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- playSlideAudio is stable via refs
  }, [currentIndex, isPlaying]);

  // Sync slide ID to URL hash for sharing
  useEffect(() => {
    const id = slides[currentIndex]?.id;
    if (id && typeof window !== "undefined") {
      const newHash = `#${id}`;
      if (window.location.hash !== newHash) {
        // Pass existing history.state to avoid Next.js App Router re-render
        window.history.replaceState(window.history.state, "", newHash);
      }
    }
  }, [currentIndex, slides]);

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

  // ── Recording via getDisplayMedia ──────────────────────────────────────
  async function startRecording() {
    try {
      // Rewind to first slide and wait for it to render
      stopAudio();
      setCurrentIndex(0);
      setIsMuted(false);
      setIsPlaying(false);
      await new Promise((r) => setTimeout(r, 1000));

      // Request fullscreen for consistent 16:9 capture
      await containerRef.current?.requestFullscreen?.().catch(() => {});
      await new Promise((r) => setTimeout(r, 500));

      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 30 },
        },
        audio: true,
        // @ts-expect-error -- preferCurrentTab is Chrome 94+ only
        preferCurrentTab: true,
      });

      const recorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
          ? "video/webm;codecs=vp9,opus"
          : "video/webm",
      });

      recordChunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordChunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(recordChunksRef.current, { type: "video/webm" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `optimitron-demo-${new Date().toISOString().slice(0, 10)}.webm`;
        a.click();
        URL.revokeObjectURL(url);
        displayStreamRef.current?.getTracks().forEach((t) => t.stop());
        displayStreamRef.current = null;
      };

      // If user stops sharing, stop recording
      stream.getVideoTracks()[0]?.addEventListener("ended", () => {
        if (mediaRecorderRef.current?.state === "recording") {
          mediaRecorderRef.current.stop();
          mediaRecorderRef.current = null;
          setIsRecording(false);
          setIsPlaying(false);
        }
      });

      displayStreamRef.current = stream;
      mediaRecorderRef.current = recorder;
      recorder.start(1000);
      setIsRecording(true);

      // Start playback
      setIsPlaying(true);
    } catch {
      // User cancelled the share dialog
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current = null;
    setIsRecording(false);
    setIsPlaying(false);
    document.exitFullscreen?.().catch(() => {});
  }

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
    <div className="absolute inset-0 bg-foreground">
      <AnimatePresence mode="wait">
        <motion.div
          key={slide.id}
          variants={reduced ? undefined : transitionVariants}
          initial={reduced ? false : "initial"}
          animate={reduced ? { opacity: 1 } : "animate"}
          exit={reduced ? { opacity: 1 } : "exit"}
          className={`absolute inset-0 overflow-y-auto ${bgClass}`}
        >
          <Suspense fallback={<div className={`absolute inset-0 ${bgClass}`} />}>
            <SlideComponent />
          </Suspense>
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

      {/* Wishonia character — bottom right, click to play */}
      {sierraMode && (
        <div
          className="absolute -bottom-4 right-4 z-20 cursor-pointer"
          onClick={() => {
            if (!isPlaying) {
              setIsPlaying(true);
            }
          }}
        >
          <WishoniaPresenter analyserNode={analyserNode} />
        </div>
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
          forceLive={forceLive}
          isRecording={isRecording}
          onPrev={() => goTo(Math.max(0, currentIndex - 1))}
          onNext={() => goTo(Math.min(slides.length - 1, currentIndex + 1))}
          onTogglePlay={() => setIsPlaying((p) => !p)}
          onToggleMute={() => setIsMuted((m) => !m)}
          onToggleForceLive={() => setForceLive((f) => !f)}
          onToggleRecord={() => isRecording ? stopRecording() : startRecording()}
          onGoTo={goTo}
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

const SIERRA_PLAYLISTS = new Set(["hackathon", "protocol-labs"]);

export function DemoPlayer({
  playlistId = DEFAULT_PLAYLIST_ID,
}: DemoPlayerProps) {
  const [sierraMode, setSierraMode] = useState(
    SIERRA_PLAYLISTS.has(playlistId),
  );

  // Check query param after hydration to avoid server/client mismatch
  useEffect(() => {
    if (
      !SIERRA_PLAYLISTS.has(playlistId) &&
      new URLSearchParams(window.location.search).get("sierra") === "true"
    ) {
      setSierraMode(true);
    }
  }, [playlistId]);

  return (
    <SierraGameProvider enabled={sierraMode}>
      <DemoPlayerInner playlistId={playlistId} sierraMode={sierraMode} />
    </SierraGameProvider>
  );
}
