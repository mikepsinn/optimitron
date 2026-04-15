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

const stepperMarkdownComponents = {
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
    const linkClass =
      "font-black text-white/70 underline decoration-white/30 decoration-1 underline-offset-4 transition-colors hover:text-white hover:decoration-white/60";
    if (target.startsWith("http")) {
      return (
        <a href={target} target="_blank" rel="noreferrer" className={linkClass}>
          {children}
        </a>
      );
    }
    return (
      <Link href={target} className={linkClass}>
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

const readerMarkdownComponents = {
  h1: ({ children }: { children?: ReactNode }) => (
    <h1 className="text-center text-4xl font-black uppercase tracking-[0.08em] text-[#23180d] [font-family:var(--v0-font-libre-baskerville)] sm:text-5xl md:text-6xl">
      {children}
    </h1>
  ),
  h2: ({ children }: { children?: ReactNode }) => (
    <h2 className="text-center text-3xl font-black uppercase tracking-[0.08em] text-[#23180d] [font-family:var(--v0-font-libre-baskerville)] sm:text-4xl">
      {children}
    </h2>
  ),
  h3: ({ children }: { children?: ReactNode }) => (
    <h3 className="text-center text-2xl font-black uppercase tracking-[0.08em] text-[#23180d] [font-family:var(--v0-font-libre-baskerville)] sm:text-3xl">
      {children}
    </h3>
  ),
  p: ({ children }: { children?: ReactNode }) => (
    <p className="text-left text-lg leading-9 text-[#2f2417] [font-family:var(--v0-font-libre-baskerville)] sm:text-[1.35rem]">
      {children}
    </p>
  ),
  a: ({ href, children }: { href?: string; children?: ReactNode }) => {
    const target = href ?? "#";
    const linkClass =
      "font-black text-[#5e2e1f] underline decoration-[#8e6b48]/60 decoration-2 underline-offset-4 transition-colors hover:text-[#2f2417] hover:decoration-[#2f2417]";
    if (target.startsWith("http")) {
      return (
        <a href={target} target="_blank" rel="noreferrer" className={linkClass}>
          {children}
        </a>
      );
    }
    return (
      <Link href={target} className={linkClass}>
        {children}
      </Link>
    );
  },
  blockquote: ({ children }: { children?: ReactNode }) => (
    <blockquote className="border-l-4 border-[#8e6b48] bg-[#efe4cf]/70 px-5 py-4 text-left text-base font-bold text-[#3a2a19] shadow-[6px_6px_0_rgba(58,42,25,0.08)]">
      {children}
    </blockquote>
  ),
  ul: ({ children }: { children?: ReactNode }) => (
    <ul className="list-disc space-y-3 pl-6 text-left text-base font-bold text-[#3a2a19] sm:text-lg">
      {children}
    </ul>
  ),
  ol: ({ children }: { children?: ReactNode }) => (
    <ol className="list-decimal space-y-3 pl-6 text-left text-base font-bold text-[#3a2a19] sm:text-lg">
      {children}
    </ol>
  ),
  li: ({ children }: { children?: ReactNode }) => <li>{children}</li>,
  hr: () => <hr className="border-t-2 border-[#8e6b48]/40" />,
};

export interface ReferendumStepperProps {
  /** First slide — plain text intro. */
  introText: string;
  /** Markdown slides, one per fade step. */
  slides: string[];
  /** Rendered on the final "signature" slide and in reader mode. */
  signatureSlot: (variant: "stepper" | "reader") => ReactNode;
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

  const [mode, setMode] = useState<"stepper" | "reader">("reader");
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
      return;
    }
    if (mode === "reader") {
      setMode("stepper");
      setCurrentIndex(0);
      setVisible(true);
      void playSlide(0);
      return;
    }
    void playSlide(currentIndex);
  }, [isPlaying, mode, currentIndex, playSlide]);

  useEffect(() => {
    if (mode === "reader") return;
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
  }, [goNext, goPrev, mode]);

  const scrollCooldown = useRef(false);
  useEffect(() => {
    if (mode === "reader") return;
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
  }, [goNext, goPrev, mode]);

  const touchStartY = useRef(0);
  useEffect(() => {
    if (mode === "reader") return;
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
  }, [goNext, goPrev, mode]);

  useEffect(() => {
    return () => stopAudio();
  }, [stopAudio]);

  useEffect(() => {
    if (mode === "reader") {
      stopAudio();
    }
  }, [mode, stopAudio]);

  useEffect(() => {
    const { body, documentElement } = document;
    const previousBodyOverflow = body.style.overflow;
    const previousHtmlOverflow = documentElement.style.overflow;

    body.style.overflow = "hidden";
    documentElement.style.overflow = "hidden";

    return () => {
      body.style.overflow = previousBodyOverflow;
      documentElement.style.overflow = previousHtmlOverflow;
    };
  }, []);

  const isStepperMode = mode === "stepper";
  const bgImageIndex = bgImages.length > 0 ? currentIndex % bgImages.length : 0;
  const hasBgImages = bgImages.length > 0;
  const toggleClass =
    "absolute left-4 top-4 z-30 cursor-pointer text-xs font-bold text-white/30 transition-colors hover:text-white/70";
  const narratorClass = isStepperMode
    ? "absolute bottom-0 right-0 z-20 cursor-pointer"
    : "fixed bottom-5 right-5 z-30 flex h-14 w-14 cursor-pointer items-center justify-center rounded-full border border-[#3a2a19]/20 bg-[#f7f1e4]/90 text-[#3a2a19] shadow-[6px_6px_0_rgba(35,24,13,0.15)] backdrop-blur-sm transition-colors hover:bg-[#fff9ef]";
  const imageToggleClass = isStepperMode
    ? "absolute bottom-4 left-4 z-30 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border-2 border-white/20 bg-white/10 text-white/40 transition-colors hover:bg-white/20 hover:text-white/70"
    : "fixed bottom-4 left-4 z-30 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-[#3a2a19]/20 bg-[#f7f1e4]/85 text-[#3a2a19]/70 shadow-[4px_4px_0_rgba(35,24,13,0.12)] backdrop-blur-sm transition-colors hover:bg-[#fff9ef] hover:text-[#3a2a19]";
  const documentComponents = isStepperMode
    ? stepperMarkdownComponents
    : readerMarkdownComponents;
  const signatureContent = signatureSlot(isStepperMode ? "stepper" : "reader");

  const renderSlideContent = () => {
    if (currentIndex === 0) {
      return (
        <p
          className={
            isStepperMode
              ? "text-center text-2xl leading-relaxed text-white [font-family:var(--v0-font-libre-baskerville)] sm:text-3xl"
              : "text-center text-2xl leading-relaxed text-[#2f2417] [font-family:var(--v0-font-libre-baskerville)] sm:text-3xl"
          }
        >
          {introText}
        </p>
      );
    }

    if (currentIndex === signatureIndex) {
      return signatureContent;
    }

    const contentIndex = currentIndex - 1;
    const slide = slides[contentIndex];
    if (!slide) return null;

    return (
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={documentComponents}
      >
        {slide}
      </ReactMarkdown>
    );
  };

  return (
    <div
      className={
        isStepperMode
          ? "fixed inset-0 z-[100] flex flex-col overflow-hidden bg-black"
          : "fixed inset-0 z-[100] overflow-y-auto overflow-x-hidden bg-[#ece2d0]"
      }
    >
      {!isStepperMode && (
        <>
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,252,245,0.94)_0%,rgba(245,237,222,0.94)_38%,rgba(231,219,197,0.96)_100%)]" />
          <div
            className="absolute inset-0 opacity-60"
            style={{
              backgroundImage: [
                "radial-gradient(circle at 18% 12%, rgba(255,255,255,0.95) 0, rgba(255,255,255,0) 28%)",
                "radial-gradient(circle at 82% 18%, rgba(255,255,255,0.7) 0, rgba(255,255,255,0) 24%)",
                "radial-gradient(circle at 70% 72%, rgba(255,255,255,0.42) 0, rgba(255,255,255,0) 26%)",
                "linear-gradient(115deg, rgba(142,107,72,0.08) 0%, rgba(142,107,72,0) 22%, rgba(142,107,72,0.09) 44%, rgba(142,107,72,0) 66%, rgba(142,107,72,0.08) 100%)",
              ].join(", "),
            }}
          />
        </>
      )}

      {mode === "stepper" && (
        <div className="sr-only" aria-hidden="false">
          <p>{introText}</p>
          {slides.map((slide, i) => (
            <ReactMarkdown key={i} remarkPlugins={[remarkGfm]}>
              {slide}
            </ReactMarkdown>
          ))}
        </div>
      )}

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

      {mode === "stepper" && (
        <button
          onClick={() => {
            stopAudio();
            setMode("reader");
          }}
          className={toggleClass}
        >
          Read as document
        </button>
      )}

      {mode === "stepper" && (
        <button
          onClick={() => {
            stopAudio();
            goToSlide(currentIndex === signatureIndex ? 0 : signatureIndex);
          }}
          className="absolute right-4 top-4 z-30 cursor-pointer text-xs font-bold text-white/30 transition-colors hover:text-white/70"
        >
          {currentIndex === signatureIndex ? "Go back" : "Skip to sign"}
        </button>
      )}

      {mode === "stepper" ? (
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
      ) : (
        <div className="relative min-h-full px-6 pb-40 pt-24 sm:px-8">
          <div className="mx-auto w-full max-w-4xl">
            <div className="mx-auto mb-10 h-px w-24 bg-[#8e6b48]/40" />
            <div className="mx-auto w-full max-w-2xl space-y-10">
              <p className="text-center text-2xl leading-relaxed text-[#2f2417] [font-family:var(--v0-font-libre-baskerville)] sm:text-3xl">
                {introText}
              </p>
              {slides.map((slide, i) => (
                <ReactMarkdown
                  key={i}
                  remarkPlugins={[remarkGfm]}
                  components={documentComponents}
                >
                  {slide}
                </ReactMarkdown>
              ))}
              <div className="border-t border-[#8e6b48]/30 pt-12">
                {signatureContent}
              </div>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={togglePlayback}
        className={narratorClass}
        aria-label={isPlaying ? "Pause narration" : "Play narration"}
      >
        {isStepperMode ? (
          <>
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
          </>
        ) : isPlaying ? (
          <Pause className="h-5 w-5" />
        ) : (
          <Play className="ml-0.5 h-5 w-5" />
        )}
      </button>

      {hasBgImages && (
        <button
          onClick={() => setShowImages((v) => !v)}
          className={imageToggleClass}
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

      {mode === "stepper" && currentIndex < totalSlides - 1 && (
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
