"use client";

import { ChevronLeft, ChevronRight, Play, Pause, Volume2, VolumeX, Circle, Save } from "lucide-react";

interface DemoControlsProps {
  current: number;
  total: number;
  isPlaying: boolean;
  isMuted: boolean;
  isCaptionsVisible: boolean;
  forceLive: boolean;
  isRecording: boolean;
  onPrev: () => void;
  onNext: () => void;
  onTogglePlay: () => void;
  onToggleMute: () => void;
  onToggleCaptions: () => void;
  onToggleForceLive: () => void;
  onToggleRecord: () => void;
  onGoTo: (index: number) => void;
}

export function DemoControls({
  current,
  total,
  isPlaying,
  isMuted,
  isCaptionsVisible,
  forceLive,
  isRecording,
  onPrev,
  onNext,
  onTogglePlay,
  onToggleMute,
  onToggleCaptions,
  onToggleForceLive,
  onToggleRecord,
}: DemoControlsProps) {
  return (
    <div className="bg-transparent px-4 py-3">
      {/* Controls row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={onTogglePlay}
            className="p-2 bg-white/10 hover:bg-white/20 rounded transition-all"
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 text-foreground" />
            ) : (
              <Play className="w-5 h-5 text-foreground" />
            )}
          </button>
          <button
            onClick={onToggleMute}
            className="p-2 bg-white/10 hover:bg-white/20 rounded transition-all"
            aria-label={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? (
              <VolumeX className="w-5 h-5 text-foreground" />
            ) : (
              <Volume2 className="w-5 h-5 text-foreground" />
            )}
          </button>
          <button
            onClick={onToggleCaptions}
            className={`px-2 py-2 rounded transition-all font-pixel text-[10px] ${
              isCaptionsVisible
                ? "bg-brutal-cyan text-brutal-cyan-foreground"
                : "bg-white/10 hover:bg-white/20 text-foreground"
            }`}
            aria-label={isCaptionsVisible ? "Hide captions" : "Show captions"}
            title={isCaptionsVisible ? "Hide captions" : "Show captions"}
          >
            CC
          </button>
          <button
            onClick={onToggleForceLive}
            className={`p-2 rounded transition-all flex items-center gap-1.5 ${
              forceLive ? "bg-brutal-red text-brutal-red-foreground" : "bg-white/10 hover:bg-white/20"
            }`}
            aria-label={forceLive ? "Switch to cached audio" : "Switch to live TTS"}
            title={forceLive ? "LIVE TTS (Gemini)" : "Cached audio"}
          >
            {forceLive ? (
              <Circle className="w-4 h-4 fill-current animate-pulse" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span className="font-pixel text-[10px]">
              {forceLive ? "LIVE" : "SAVED"}
            </span>
          </button>
          <button
            onClick={onToggleRecord}
            className={`p-2 rounded transition-all flex items-center gap-1.5 ${
              isRecording ? "bg-brutal-red text-brutal-red-foreground" : "bg-white/10 hover:bg-white/20"
            }`}
            aria-label={isRecording ? "Stop recording" : "Start recording"}
            title={isRecording ? "Stop recording" : "Record demo"}
          >
            <Circle className={`w-4 h-4 ${isRecording ? "fill-current animate-pulse" : ""}`} />
            <span className="font-pixel text-[10px]">
              {isRecording ? "STOP" : "REC"}
            </span>
          </button>
        </div>

        <span className="text-xs font-pixel text-white/50">
          {current + 1} / {total}
        </span>

        <div className="flex items-center gap-2">
          <button
            onClick={onPrev}
            disabled={current === 0}
            className="p-2 bg-white/10 hover:bg-white/20 rounded transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>
          <button
            onClick={onNext}
            disabled={current === total - 1}
            className="p-2 bg-white/10 hover:bg-white/20 rounded transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Next slide"
          >
            <ChevronRight className="w-5 h-5 text-foreground" />
          </button>
        </div>
      </div>
    </div>
  );
}
