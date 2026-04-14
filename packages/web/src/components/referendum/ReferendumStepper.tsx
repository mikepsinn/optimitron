"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Link from "next/link";
import { ChevronDown, Play, Pause, Image, ImageOff } from "lucide-react";
import {
  WishoniaCharacter,
  preloadTier0,
} from "@optimitron/wishonia-widget";

const SPRITE_PATH = "/sprites/wishonia/";
const SPRITE_FORMAT = "png" as const;
if (typeof window !== "undefined") {
  void preloadTier0(SPRITE_PATH, SPRITE_FORMAT);
}

export function splitIntoSlides(markdown: string): string[] {
  return markdown
    .split(/\n\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function stripMarkdownForHash(md: string): string {
  return md
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/#{1,6}\s+/g, "")
    .replace(/[*_`~]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

async function hashText(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 16);
}

interface ManifestEntry {
  file: string;
}
type Manifest = Record<string, ManifestEntry>;

const manifestCache = new Map<string, Manifest | null>();

async function getManifest(path: string | undefined): Promise<Manifest | null> {
  if (!path) return null;
  if (manifestCache.has(path)) return manifestCache.get(path)!;
  try {
    const resp = await fetch(path, { cache: "no-store" });
    const manifest = resp.ok ? ((await resp.json()) as Manifest) : null;
    manifestCache.set(path, manifest);
    return manifest;
  } catch {
    manifestCache.set(path, null);
    return null;
  }
}

let sharedAudioCtx: AudioContext | null = null;
function getAudioContext(): AudioContext {
  if (!sharedAudioCtx) sharedAudioCtx = new AudioContext();
  if (sharedAudioCtx.state === "suspended") {
    sharedAudioCtx.resume().catch(() => {});
  }
  return sharedAudioCtx;
}

function wireAnalyser(audio: HTMLAudioElement): AnalyserNode {
  const ctx = getAudioContext();
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  const source = ctx.createMediaElementSource(audio);
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 256;
  source.connect(analyser);
  analyser.connect(ctx.destination);
  return analyser;
}

function loadAudio(url: string): Promise<HTMLAudioElement | null> {
  return new Promise((resolve) => {
    const audio = new Audio(url);
    audio.crossOrigin = "anonymous";
    audio.addEventListener("canplaythrough", () => resolve(audio), {
      once: true,
    });
    audio.addEventListener("error", () => resolve(null), { once: true });
  });
}

interface AudioResult {
  audio: HTMLAudioElement;
  analyser: AnalyserNode;
}

const audioCache = new Map<string, AudioResult>();

async function getSlideAudio(
  text: string,
  audioBasePath: string | undefined,
  manifestPath: string | undefined,
): Promise<AudioResult | null> {
  const plainText = stripMarkdownForHash(text);
  const hash = await hashText(plainText);

  if (audioCache.has(hash)) {
    const cached = audioCache.get(hash)!;
    cached.audio.currentTime = 0;
    return cached;
  }

  const manifest = await getManifest(manifestPath);
  if (manifest?.[hash] && audioBasePath) {
    const entry = manifest[hash];
    const audio = await loadAudio(`${audioBasePath}/${entry.file}`);
    if (audio) {
      const analyser = wireAnalyser(audio);
      const result = { audio, analyser };
      audioCache.set(hash, result);
      return result;
    }
  }

  try {
    const resp = await fetch("/api/demo/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: plainText }),
    });
    if (!resp.ok) return null;
    const blob = await resp.blob();
    const url = URL.createObjectURL(blob);
    const audio = await loadAudio(url);
    if (audio) {
      const analyser = wireAnalyser(audio);
      const result = { audio, analyser };
      audioCache.set(hash, result);
      return result;
    }
  } catch {
    // TTS unavailable — graceful degradation
  }

  return null;
}

const markdownComponents = {
  h1: ({ children }: { children?: ReactNode }) => (
    <h1 className="text-center text-4xl font-black uppercase tracking-tight text-white [font-family:var(--v0-font-libre-baskerville)] sm:text-5xl md:text-6xl">
      {children}
    </h1>
  ),
  h2: ({ children }: { children?: ReactNode }) => (
    <h2 className="text-center text-3xl font-black uppercase tracking-tight text-white [font-family:var(--v0-font-libre-baskerville)] sm:text-4xl">
      {children}
    </h2>
  ),
  h3: ({ children }: { children?: ReactNode }) => (
    <h3 className="text-center text-2xl font-black uppercase tracking-tight text-white [font-family:var(--v0-font-libre-baskerville)] sm:text-3xl md:text-4xl">
      {children}
    </h3>
  ),
  p: ({ children }: { children?: ReactNode }) => (
    <p className="text-center text-xl leading-relaxed text-white drop-cap [font-family:var(--v0-font-libre-baskerville)] [overflow-wrap:break-word] sm:text-2xl">
      {children}
    </p>
  ),
  a: ({ href, children }: { href?: string; children?: ReactNode }) => {
    const target = href ?? "#";
    if (target.startsWith("http")) {
      return (
        <a
          href={target}
          target="_blank"
          rel="noreferrer"
          className="font-black text-white/70"
        >
          {children}
        </a>
      );
    }
    return (
      <Link href={target} className="font-black text-white/70">
        {children}
      </Link>
    );
  },
  blockquote: ({ children }: { children?: ReactNode }) => (
    <blockquote className="border-l-4 border-brutal-pink bg-white/10 px-4 py-3 text-sm font-bold text-white">
      {children}
    </blockquote>
  ),
  ul: ({ children }: { children?: ReactNode }) => (
    <ul className="list-disc space-y-2 pl-6 text-left text-base font-bold text-white/80">
      {children}
    </ul>
  ),
  ol: ({ children }: { children?: ReactNode }) => (
    <ol className="list-decimal space-y-2 pl-6 text-left text-base font-bold text-white/80">
      {children}
    </ol>
  ),
  li: ({ children }: { children?: ReactNode }) => <li>{children}</li>,
  hr: () => <hr className="border-t-4 border-white/30" />,
};

export interface ReferendumStepperProps {
  /** First slide — plain text intro. */
  introText: string;
  /** Markdown slides, one per fade step. */
  slides: string[];
  /** React node rendered on the final "signature" slide. */
  signatureSlot: ReactNode;
  /** Optional background photo URLs cycled on each slide. */
  backgroundImages?: string[];
  /**
   * Optional URL of a JSON manifest mapping content-hash → { file }. When
   * present, `audioBasePath` is used to resolve each file. Without these, the
   * stepper falls back to live Gemini TTS.
   */
  audioManifestPath?: string;
  /** Base path for pre-generated audio files referenced by the manifest. */
  audioBasePath?: string;
}

export function ReferendumStepper({
  introText,
  slides,
  signatureSlot,
  backgroundImages,
  audioManifestPath,
  audioBasePath,
}: ReferendumStepperProps) {
  const totalSlides = 1 + slides.length + 1;
  const signatureIndex = totalSlides - 1;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const [showImages, setShowImages] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [analyserNode, setAnalyserNode] = useState<AnalyserNode | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const playingIndexRef = useRef<number>(-1);

  const bgImages = useMemo(() => backgroundImages ?? [], [backgroundImages]);

  const stopAudio = useCallback(() => {
    const audio = currentAudioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
      audio.onended = null;
    }
    currentAudioRef.current = null;
    playingIndexRef.current = -1;
    setIsPlaying(false);
    setAnalyserNode(null);
  }, []);

  const goToSlide = useCallback(
    (index: number) => {
      if (index < 0 || index >= totalSlides || index === currentIndex) return;
      setVisible(false);
      setTimeout(() => {
        setCurrentIndex(index);
        setVisible(true);
      }, 600);
    },
    [currentIndex, totalSlides],
  );

  const goNext = useCallback(() => {
    if (currentIndex >= totalSlides - 1) return;
    stopAudio();
    goToSlide(currentIndex + 1);
  }, [currentIndex, goToSlide, stopAudio, totalSlides]);

  const goPrev = useCallback(() => {
    if (currentIndex <= 0) return;
    stopAudio();
    goToSlide(currentIndex - 1);
  }, [currentIndex, goToSlide, stopAudio]);

  const getSlideText = useCallback(
    (slideIndex: number): string | null => {
      if (slideIndex === 0) return introText;
      const contentIndex = slideIndex - 1;
      if (contentIndex < slides.length) return slides[contentIndex]!;
      return null;
    },
    [introText, slides],
  );

  const preloadSlideAudio = useCallback(
    (slideIndex: number) => {
      const text = getSlideText(slideIndex);
      if (text) void getSlideAudio(text, audioBasePath, audioManifestPath);
    },
    [getSlideText, audioBasePath, audioManifestPath],
  );

  const playRequestId = useRef(0);

  const playSlide = useCallback(
    async (slideIndex: number) => {
      stopAudio();
      const requestId = ++playRequestId.current;
      const text = getSlideText(slideIndex);
      if (!text) return;

      preloadSlideAudio(slideIndex + 1);

      const result = await getSlideAudio(text, audioBasePath, audioManifestPath);
      if (requestId !== playRequestId.current) return;

      if (!result) {
        setIsPlaying(true);
        playingIndexRef.current = slideIndex;
        const wordCount = text.split(/\s+/).length;
        const readTime = Math.max(3000, wordCount * 250);
        setTimeout(() => {
          if (playingIndexRef.current !== slideIndex) return;
          if (slideIndex < totalSlides - 1) {
            goToSlide(slideIndex + 1);
            setTimeout(() => void playSlide(slideIndex + 1), 700);
          } else {
            stopAudio();
          }
        }, readTime);
        return;
      }

      currentAudioRef.current = result.audio;
      playingIndexRef.current = slideIndex;
      setAnalyserNode(result.analyser);
      setIsPlaying(true);

      result.audio.onended = () => {
        if (playingIndexRef.current !== slideIndex) return;
        if (slideIndex < totalSlides - 1) {
          goToSlide(slideIndex + 1);
          setTimeout(() => void playSlide(slideIndex + 1), 700);
        } else {
          stopAudio();
        }
      };

      try {
        await result.audio.play();
      } catch {
        stopAudio();
      }
    },
    [
      stopAudio,
      goToSlide,
      getSlideText,
      preloadSlideAudio,
      audioBasePath,
      audioManifestPath,
      totalSlides,
    ],
  );

  const togglePlayback = useCallback(() => {
    if (isPlaying) {
      const audio = currentAudioRef.current;
      if (audio) {
        audio.pause();
        audio.onended = null;
      }
      playingIndexRef.current = -1;
      setIsPlaying(false);
      setAnalyserNode(null);
    } else {
      void playSlide(currentIndex);
    }
  }, [isPlaying, currentIndex, playSlide]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === "ArrowDown" || e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        goNext();
      } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
        e.preventDefault();
        goPrev();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [goNext, goPrev]);

  const scrollCooldown = useRef(false);
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (scrollCooldown.current) return;
      scrollCooldown.current = true;
      if (e.deltaY > 0) goNext();
      else if (e.deltaY < 0) goPrev();
      setTimeout(() => {
        scrollCooldown.current = false;
      }, 800);
    };
    window.addEventListener("wheel", handleWheel, { passive: false });
    return () => window.removeEventListener("wheel", handleWheel);
  }, [goNext, goPrev]);

  const touchStartY = useRef(0);
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      touchStartY.current = e.touches[0]?.clientY ?? 0;
    };
    const handleTouchEnd = (e: TouchEvent) => {
      const endY = e.changedTouches[0]?.clientY ?? 0;
      const diff = touchStartY.current - endY;
      if (Math.abs(diff) < 50) return;
      if (diff > 0) goNext();
      else goPrev();
    };
    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });
    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [goNext, goPrev]);

  useEffect(() => {
    return () => stopAudio();
  }, [stopAudio]);

  const bgImageIndex = bgImages.length > 0 ? currentIndex % bgImages.length : 0;
  const hasBgImages = bgImages.length > 0;

  const renderSlideContent = () => {
    if (currentIndex === 0) {
      return (
        <p className="text-center text-2xl leading-relaxed text-white [font-family:var(--v0-font-libre-baskerville)] sm:text-3xl">
          {introText}
        </p>
      );
    }

    if (currentIndex === signatureIndex) {
      return signatureSlot;
    }

    const contentIndex = currentIndex - 1;
    const slide = slides[contentIndex];
    if (!slide) return null;

    return (
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={markdownComponents}
      >
        {slide}
      </ReactMarkdown>
    );
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-black">
      {showImages && hasBgImages && (
        <>
          <div className="absolute inset-0">
            <img
              key={bgImageIndex}
              src={bgImages[bgImageIndex]}
              alt=""
              className="h-full w-full object-cover"
              style={{ animation: "ken-burns 12s ease-in-out forwards" }}
              draggable={false}
            />
          </div>
          <div className="absolute inset-0 bg-black/70" />
        </>
      )}

      <button
        onClick={() => {
          stopAudio();
          goToSlide(currentIndex === signatureIndex ? 0 : signatureIndex);
        }}
        className="absolute right-4 top-4 z-30 cursor-pointer text-xs font-bold text-white/30 transition-colors hover:text-white/70"
      >
        {currentIndex === signatureIndex ? "Go back" : "Skip to sign"}
      </button>

      <div className="relative flex flex-1 items-center justify-center px-6 sm:px-8">
        <div
          className="w-full max-w-2xl"
          style={{
            opacity: visible ? 1 : 0,
            transition: "opacity 0.6s ease-in-out",
          }}
        >
          {renderSlideContent()}
        </div>
      </div>

      <button
        onClick={togglePlayback}
        className="absolute bottom-0 right-0 z-20 cursor-pointer"
        aria-label={isPlaying ? "Pause narration" : "Play narration"}
      >
        {currentIndex === 0 && !isPlaying && (
          <span className="pointer-events-none absolute bottom-full right-6 mb-1 whitespace-nowrap text-xs font-bold text-white/60 [font-family:var(--v0-font-libre-baskerville)] sm:text-sm">
            Tap to hear me ↓
          </span>
        )}
        <div className="sm:hidden">
          <WishoniaCharacter
            size={110}
            spritePath={SPRITE_PATH}
            spriteFormat={SPRITE_FORMAT}
            analyserNode={analyserNode}
          />
        </div>
        <div className="hidden sm:block">
          <WishoniaCharacter
            size={140}
            spritePath={SPRITE_PATH}
            spriteFormat={SPRITE_FORMAT}
            analyserNode={analyserNode}
          />
        </div>
        <div className="absolute bottom-3 right-3 z-10 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white/30 bg-black/50">
          {isPlaying ? (
            <Pause className="h-3 w-3 text-white" />
          ) : (
            <Play className="ml-0.5 h-3 w-3 text-white" />
          )}
        </div>
      </button>

      {hasBgImages && (
        <button
          onClick={() => setShowImages((v) => !v)}
          className="absolute bottom-4 left-4 z-30 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border-2 border-white/20 bg-white/10 text-white/40 transition-colors hover:bg-white/20 hover:text-white/70"
          aria-label={
            showImages ? "Hide background images" : "Show background images"
          }
        >
          {showImages ? (
            <ImageOff className="h-3 w-3" />
          ) : (
            <Image className="h-3 w-3" />
          )}
        </button>
      )}

      {currentIndex < totalSlides - 1 && (
        <button
          onClick={goNext}
          className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2 animate-bounce cursor-pointer text-white/60 transition-opacity hover:text-white"
          aria-label="Next paragraph"
        >
          <ChevronDown className="h-10 w-10" />
        </button>
      )}
    </div>
  );
}
