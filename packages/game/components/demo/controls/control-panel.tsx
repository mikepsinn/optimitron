"use client";

import { useDemoStore } from "@/lib/demo/store";
import { cn } from "@/lib/utils";
import { useState } from "react";

export function ControlPanel() {
  const {
    isPlaying,
    togglePlayPause,
    toggleFullscreen,
    toggleMute,
    isMuted,
    masterVolume,
    musicVolume,
    sfxVolume,
    voiceVolume,
    setVolume,
    isRecordingMode,
  } = useDemoStore();

  const [showVolumeSlider, setShowVolumeSlider] = useState(false);

  if (isRecordingMode) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2">
      {/* Volume control */}
      <div className="relative">
        <button
          className={cn(
            "w-10 h-10 flex items-center justify-center",
            "bg-black/80 border-2 border-current/40 rounded",
            "hover:border-current/80 transition-colors",
            "font-pixel text-lg"
          )}
          onClick={() => setShowVolumeSlider(!showVolumeSlider)}
          title="Volume"
        >
          {isMuted || masterVolume === 0 ? "🔇" : "🔊"}
        </button>

        {showVolumeSlider && (
          <div className="absolute bottom-12 right-0 bg-black/90 border-2 border-current/40 rounded p-3 min-w-[150px]">
            <div className="space-y-3">
              <div>
                <label className="text-[8px] font-pixel text-current/60 block mb-1">
                  Master
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={masterVolume * 100}
                  onChange={(e) =>
                    setVolume("master", Number(e.target.value) / 100)
                  }
                  className="w-full h-1 accent-current"
                />
              </div>
              <div>
                <label className="text-[8px] font-pixel text-current/60 block mb-1">
                  Music
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={musicVolume * 100}
                  onChange={(e) =>
                    setVolume("music", Number(e.target.value) / 100)
                  }
                  className="w-full h-1 accent-current"
                />
              </div>
              <div>
                <label className="text-[8px] font-pixel text-current/60 block mb-1">
                  SFX
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={sfxVolume * 100}
                  onChange={(e) =>
                    setVolume("sfx", Number(e.target.value) / 100)
                  }
                  className="w-full h-1 accent-current"
                />
              </div>
              <div>
                <label className="text-[8px] font-pixel text-current/60 block mb-1">
                  Voice
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={voiceVolume * 100}
                  onChange={(e) =>
                    setVolume("voice", Number(e.target.value) / 100)
                  }
                  className="w-full h-1 accent-current"
                />
              </div>
              <button
                className="w-full text-[8px] font-pixel py-1 border border-current/40 hover:bg-current/20 transition-colors"
                onClick={toggleMute}
              >
                {isMuted ? "Unmute All" : "Mute All"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Fullscreen */}
      <button
        className={cn(
          "w-10 h-10 flex items-center justify-center",
          "bg-black/80 border-2 border-current/40 rounded",
          "hover:border-current/80 transition-colors",
          "font-pixel text-lg"
        )}
        onClick={toggleFullscreen}
        title="Fullscreen (F)"
      >
        ⛶
      </button>

      {/* Play/Pause */}
      <button
        className={cn(
          "w-10 h-10 flex items-center justify-center",
          "bg-black/80 border-2 border-current/40 rounded",
          "hover:border-current/80 transition-colors",
          "font-pixel text-lg"
        )}
        onClick={togglePlayPause}
        title={isPlaying ? "Pause (Space)" : "Play (Space)"}
      >
        {isPlaying ? "⏸" : "▶"}
      </button>

    </div>
  );
}
