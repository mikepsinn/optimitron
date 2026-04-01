"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Pause, Play, Settings2, Volume2, VolumeX, Save, Circle } from "lucide-react";
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
import { Drawer } from "@/components/retroui/Drawer";
// Simple fast crossfade — replaces per-act transition variants
const crossfadeVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.15 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};
// Wishonia character with lip-sync support
import {
  WishoniaCharacter,
  preloadTier0,
} from "@optimitron/wishonia-widget";

// Warm the lip-sync sprites before the Sierra demo starts auto-playing.
const SPRITE_PATH = "/sprites/wishonia/";
const SPRITE_FORMAT = "png" as const;
if (typeof window !== "undefined") {
  void preloadTier0(SPRITE_PATH, SPRITE_FORMAT);
}

function WishoniaPresenter({ analyserNode }: { analyserNode: AnalyserNode | null }) {
  return (
    <WishoniaCharacter
      size={140}
      spritePath={SPRITE_PATH}
      spriteFormat={SPRITE_FORMAT}
      analyserNode={analyserNode}
    />
  );
}

interface MobileSettingsDrawerProps {
  currentIndex: number;
  totalSlides: number;
  isPlaying: boolean;
  isMuted: boolean;
  isCaptionsVisible: boolean;
  forceLive: boolean;
  isRecording: boolean;
  onTogglePlay: () => void;
  onToggleMute: () => void;
  onToggleCaptions: () => void;
  onToggleForceLive: () => void;
  onToggleRecord: () => void;
}

function MobileSettingsDrawer({
  currentIndex,
  totalSlides,
  isPlaying,
  isMuted,
  isCaptionsVisible,
  forceLive,
  isRecording,
  onTogglePlay,
  onToggleMute,
  onToggleCaptions,
  onToggleForceLive,
  onToggleRecord,
}: MobileSettingsDrawerProps) {
  const actionButtonClassName =
    "flex w-full items-center justify-between rounded-lg border border-white/10 bg-black/50 px-4 py-3 font-pixel text-xs uppercase tracking-[0.2em] text-zinc-100 transition hover:bg-black/70";

  return (
    <Drawer direction="bottom">
      <Drawer.Trigger asChild>
        <button
          type="button"
          className="absolute bottom-5 left-4 z-40 flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-black/65 text-zinc-100 shadow-[0_8px_24px_rgba(0,0,0,0.45)] backdrop-blur-sm md:hidden"
          aria-label="Open demo settings"
        >
          <Settings2 className="h-5 w-5" />
        </button>
      </Drawer.Trigger>

      <Drawer.Content className="border-white/10 bg-zinc-950/98 text-zinc-100">
        <Drawer.Header className="border-b border-white/10 pb-3 text-left">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Drawer.Title className="font-pixel text-sm uppercase tracking-[0.3em] text-zinc-100">
                Demo Settings
              </Drawer.Title>
              <Drawer.Description className="mt-2 font-terminal text-sm text-zinc-400">
                Swipe left or right to move between slides. {currentIndex + 1} / {totalSlides}
              </Drawer.Description>
            </div>
            <Drawer.Close asChild>
              <button
                type="button"
                className="rounded border border-white/10 px-2 py-1 font-pixel text-[10px] uppercase tracking-[0.2em] text-zinc-300"
              >
                X
              </button>
            </Drawer.Close>
          </div>
        </Drawer.Header>

        <div className="grid gap-3 px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-2">
          <button type="button" className={actionButtonClassName} onClick={onTogglePlay}>
            <span>{isPlaying ? "Pause" : "Play"}</span>
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </button>

          <button type="button" className={actionButtonClassName} onClick={onToggleMute}>
            <span>{isMuted ? "Unmute" : "Mute"}</span>
            {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>

          <button type="button" className={actionButtonClassName} onClick={onToggleCaptions}>
            <span>{isCaptionsVisible ? "Hide Captions" : "Show Captions"}</span>
            <span className="text-[10px] tracking-[0.3em] text-zinc-400">CC</span>
          </button>

          <button type="button" className={actionButtonClassName} onClick={onToggleForceLive}>
            <span>{forceLive ? "Use Local Audio" : "Use Live TTS"}</span>
            {forceLive ? <Circle className="h-4 w-4 fill-current text-red-400" /> : <Save className="h-4 w-4" />}
          </button>

          <button type="button" className={actionButtonClassName} onClick={onToggleRecord}>
            <span>{isRecording ? "Stop Capture" : "Capture Demo"}</span>
            <Circle className={`h-4 w-4 ${isRecording ? "fill-current text-red-400" : ""}`} />
          </button>
        </div>
      </Drawer.Content>
    </Drawer>
  );
}

// ---------------------------------------------------------------------------
// Sierra-aware narration sync
// ---------------------------------------------------------------------------

function useNarrationSync(
  slide: DemoSegment,
  isPlaying: boolean,
) {
  const { dispatch } = useSierraGame();

  useEffect(() => {
    dispatch({
      type: "SET_NARRATION",
      text: slide.narration,
      isNarrating: isPlaying,
    });
  }, [slide.id, isPlaying, dispatch, slide.narration]);

  // Sync Sierra metadata from segment (act, score, inventory)
  useEffect(() => {
    if (slide.act) dispatch({ type: "SET_ACT", act: slide.act });
    if (slide.scoreAdd) dispatch({ type: "ADD_SCORE", amount: slide.scoreAdd });
    if (slide.inventoryAdd)
      dispatch({ type: "ADD_INVENTORY", item: slide.inventoryAdd });
  }, [slide.id, dispatch, slide.act, slide.scoreAdd, slide.inventoryAdd]);
}

// ---------------------------------------------------------------------------
// Inner player (consumes Sierra context)
// ---------------------------------------------------------------------------

function DemoPlayerInner({
  playlistId,
}: {
  playlistId: string;
}) {
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
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isCaptionsVisible, setIsCaptionsVisible] = useState(false);
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
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

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

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.changedTouches[0];
    if (!touch) return;
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    const start = touchStartRef.current;
    const touch = e.changedTouches[0];
    touchStartRef.current = null;

    if (!start || !touch) return;

    const deltaX = touch.clientX - start.x;
    const deltaY = touch.clientY - start.y;

    if (Math.abs(deltaX) < 56) return;
    if (Math.abs(deltaX) < Math.abs(deltaY) * 1.25) return;

    if (deltaX < 0 && currentIndex < slides.length - 1) {
      stopAudio();
      setCurrentIndex((index) => index + 1);
    } else if (deltaX > 0 && currentIndex > 0) {
      stopAudio();
      setCurrentIndex((index) => index - 1);
    }
  };

  // Resolve slide component
  const SlideComponent = getSlideComponent(slide.slideId);

  // Build slide content
  const slideContent = (
    <div className="absolute inset-0 bg-black">
      <AnimatePresence mode="sync">
        <motion.div
          key={slide.id}
          variants={crossfadeVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="absolute inset-0 overflow-y-auto bg-black"
        >
          <Suspense fallback={<div className="absolute inset-0 bg-black" />}>
            <SlideComponent segment={slide} />
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
    <div
      ref={containerRef}
      className="relative h-full group touch-pan-y"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <SierraChrome>{slideContent}</SierraChrome>

      {/* Wishonia character — bottom right, click to play */}
      <div
        className="absolute -bottom-4 -right-2 z-20 cursor-pointer"
        onClick={() => {
          if (!isPlaying) {
            setIsPlaying(true);
          }
        }}
      >
        <WishoniaPresenter analyserNode={analyserNode} />
      </div>

      <MobileSettingsDrawer
        currentIndex={currentIndex}
        totalSlides={slides.length}
        isPlaying={isPlaying}
        isMuted={isMuted}
        isCaptionsVisible={isCaptionsVisible}
        forceLive={forceLive}
        isRecording={isRecording}
        onTogglePlay={() => setIsPlaying((playing) => !playing)}
        onToggleMute={() => setIsMuted((muted) => !muted)}
        onToggleCaptions={() => setIsCaptionsVisible((visible) => !visible)}
        onToggleForceLive={() => setForceLive((live) => !live)}
        onToggleRecord={() => isRecording ? stopRecording() : startRecording()}
      />

      {/* Overlay controls — visible on hover/tap */}
      <div className="absolute bottom-0 left-0 right-0 z-40 hidden md:block opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-300">
        {isCaptionsVisible && (
          <div className="border-t border-white/10 bg-black/70 backdrop-blur-sm px-3 sm:px-6 py-2 sm:py-3">
            <p className="font-terminal text-xs sm:text-sm text-zinc-100 leading-relaxed line-clamp-2">
              {subtitle}
            </p>
          </div>
        )}

        <DemoControls
          current={currentIndex}
          total={slides.length}
          isPlaying={isPlaying}
          isMuted={isMuted}
          isCaptionsVisible={isCaptionsVisible}
          forceLive={forceLive}
          isRecording={isRecording}
          onPrev={() => goTo(Math.max(0, currentIndex - 1))}
          onNext={() => goTo(Math.min(slides.length - 1, currentIndex + 1))}
          onTogglePlay={() => setIsPlaying((p) => !p)}
          onToggleMute={() => setIsMuted((m) => !m)}
          onToggleCaptions={() => setIsCaptionsVisible((visible) => !visible)}
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
// Public component
// ---------------------------------------------------------------------------

interface DemoPlayerProps {
  playlistId?: string;
}

export function DemoPlayer({
  playlistId = DEFAULT_PLAYLIST_ID,
}: DemoPlayerProps) {
  return (
    <SierraGameProvider>
      <DemoPlayerInner playlistId={playlistId} />
    </SierraGameProvider>
  );
}
