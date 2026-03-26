"use client";

import { useDemoStore } from "@/lib/demo/store";
import { SLIDES, getChapterForSlide } from "@/lib/demo/demo-config";
import { cn } from "@/lib/utils";

export function ProgressBar() {
  const { currentSlide, goToSlide, isRecordingMode } = useDemoStore();

  if (isRecordingMode) return null;

  const totalSlides = SLIDES.length;
  const progress = ((currentSlide + 1) / totalSlides) * 100;

  // Calculate chapter positions
  const chapters = [
    { name: "Act I", position: 0, slideIndex: 0 },
    { 
      name: "The Turn", 
      position: (SLIDES.findIndex((s) => s.act === "turn") / totalSlides) * 100,
      slideIndex: SLIDES.findIndex((s) => s.act === "turn"),
    },
    { 
      name: "Act II", 
      position: (SLIDES.findIndex((s) => s.act === "act2") / totalSlides) * 100,
      slideIndex: SLIDES.findIndex((s) => s.act === "act2"),
    },
    { 
      name: "Act III", 
      position: (SLIDES.findIndex((s) => s.act === "act3") / totalSlides) * 100,
      slideIndex: SLIDES.findIndex((s) => s.act === "act3"),
    },
  ].filter((c) => c.slideIndex >= 0);

  const currentChapter = getChapterForSlide(currentSlide);

  return (
    <div className="w-full px-4 py-2">
      {/* Chapter label */}
      <div className="flex justify-between items-center mb-1">
        <span className="text-[10px] font-pixel text-current/60">
          {currentChapter}
        </span>
        <span className="text-[10px] font-pixel text-current/60">
          {currentSlide + 1} / {totalSlides}
        </span>
      </div>

      {/* Progress track */}
      <div className="relative h-2 bg-black/50 border border-current/30 rounded-sm">
        {/* Progress fill */}
        <div
          className="absolute inset-y-0 left-0 bg-current/60 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />

        {/* Chapter markers */}
        {chapters.map((chapter) => (
          <button
            key={chapter.name}
            className={cn(
              "absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full border border-current/60 transition-all",
              chapter.slideIndex <= currentSlide
                ? "bg-current"
                : "bg-black/50 hover:bg-current/50"
            )}
            style={{ left: `${chapter.position}%` }}
            onClick={() => goToSlide(chapter.slideIndex)}
            title={`Jump to ${chapter.name}`}
          />
        ))}

        {/* Current position indicator */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-current rounded-full border-2 border-black shadow-lg animate-pulse"
          style={{ left: `${progress}%`, transform: "translate(-50%, -50%)" }}
        />
      </div>

      {/* Chapter labels below */}
      <div className="relative h-4 mt-1">
        {chapters.map((chapter) => (
          <button
            key={`label-${chapter.name}`}
            className="absolute text-[8px] font-pixel text-current/40 hover:text-current/80 transition-colors whitespace-nowrap"
            style={{
              left: `${chapter.position}%`,
              transform: "translateX(-50%)",
            }}
            onClick={() => goToSlide(chapter.slideIndex)}
          >
            {chapter.name}
          </button>
        ))}
      </div>
    </div>
  );
}
