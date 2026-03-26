"use client";

import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import type { InventoryItem } from "./parameters";
import { SCORE_PROGRESSION, INVENTORY_ITEMS } from "./parameters";
import type { PaletteMode } from "./palette";
import { SLIDES } from "./demo-config";

// Demo playback state
export interface DemoState {
  // Slide navigation
  currentSlide: number;
  totalSlides: number;
  isPlaying: boolean;
  playbackSpeed: number; // 1 = normal, 0.5 = half, 2 = double

  // Game state
  score: number;
  targetScore: number;
  inventory: InventoryItem[];
  palette: PaletteMode;

  // Quest meters (hidden in Act I, visible after The Turn)
  questMetersVisible: boolean;
  haleProgress: number; // 0 to 1
  incomeProgress: number; // 0 to 1

  // UI state
  showHelp: boolean;
  showChapterNav: boolean;
  isRecordingMode: boolean;
  isFullscreen: boolean;
  isMuted: boolean;

  // Audio
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
  voiceVolume: number;

  // Achievements
  achievements: string[];

  // Typewriter state
  isTyping: boolean;
  typewriterComplete: boolean;
}

export interface DemoActions {
  // Navigation
  nextSlide: () => void;
  prevSlide: () => void;
  goToSlide: (index: number) => void;
  goToChapter: (chapter: "act1" | "turn" | "act2" | "act3") => void;

  // Playback
  play: () => void;
  pause: () => void;
  togglePlayPause: () => void;
  setPlaybackSpeed: (speed: number) => void;

  // Game state
  setScore: (score: number) => void;
  animateScoreTo: (target: number) => void;
  addInventoryItem: (item: InventoryItem) => void;
  setPalette: (palette: PaletteMode) => void;

  // Quest meters
  showQuestMeters: () => void;
  hideQuestMeters: () => void;
  setHaleProgress: (progress: number) => void;
  setIncomeProgress: (progress: number) => void;

  // UI
  toggleHelp: () => void;
  setShowHelp: (show: boolean) => void;
  toggleChapterNav: () => void;
  setRecordingMode: (enabled: boolean) => void;
  toggleFullscreen: () => void;
  toggleMute: () => void;
  setVolume: (type: "master" | "music" | "sfx" | "voice", value: number) => void;

  // Achievements
  unlockAchievement: (id: string) => void;

  // Typewriter
  setTyping: (isTyping: boolean) => void;
  setTypewriterComplete: (complete: boolean) => void;

  // Reset
  reset: () => void;
}

const CHAPTER_STARTS = {
  act1: 0,
  turn: 9, // Moronia + Wishonia
  act2: 11,
  act3: 27, // Approximate
};

const initialState: DemoState = {
  currentSlide: 0,
  totalSlides: SLIDES.length,
  isPlaying: false,
  playbackSpeed: 1,
  score: 0,
  targetScore: 0,
  inventory: [],
  palette: "ega",
  questMetersVisible: false,
  haleProgress: 0,
  incomeProgress: 0,
  showHelp: false,
  showChapterNav: false,
  isRecordingMode: false,
  isFullscreen: false,
  isMuted: false,
  masterVolume: 0.8,
  musicVolume: 0.6,
  sfxVolume: 0.8,
  voiceVolume: 1,
  achievements: [],
  isTyping: false,
  typewriterComplete: false,
};

export const useDemoStore = create<DemoState & DemoActions>()(
  subscribeWithSelector((set, get) => ({
    ...initialState,

    // Navigation
    nextSlide: () => {
      const { currentSlide, totalSlides } = get();
      if (currentSlide < totalSlides - 1) {
        set({ currentSlide: currentSlide + 1, typewriterComplete: false });
      }
    },

    prevSlide: () => {
      const { currentSlide } = get();
      if (currentSlide > 0) {
        set({ currentSlide: currentSlide - 1, typewriterComplete: false });
      }
    },

    goToSlide: (index: number) => {
      const { totalSlides } = get();
      if (index >= 0 && index < totalSlides) {
        set({ currentSlide: index, typewriterComplete: false });
      }
    },

    goToChapter: (chapter) => {
      const slideIndex = CHAPTER_STARTS[chapter];
      set({ currentSlide: slideIndex, typewriterComplete: false });
    },

    // Playback
    play: () => set({ isPlaying: true }),
    pause: () => set({ isPlaying: false }),
    togglePlayPause: () => set((state) => ({ isPlaying: !state.isPlaying })),
    setPlaybackSpeed: (speed) => set({ playbackSpeed: speed }),

    // Game state
    setScore: (score) => set({ score }),
    animateScoreTo: (target) => set({ targetScore: target }),

    addInventoryItem: (item) => {
      const { inventory } = get();
      if (!inventory.find((i) => i.slot === item.slot)) {
        set({ inventory: [...inventory, item].sort((a, b) => a.slot - b.slot) });
      }
    },

    setPalette: (palette) => set({ palette }),

    // Quest meters
    showQuestMeters: () => set({ questMetersVisible: true }),
    hideQuestMeters: () => set({ questMetersVisible: false }),
    setHaleProgress: (progress) => set({ haleProgress: Math.min(1, Math.max(0, progress)) }),
    setIncomeProgress: (progress) => set({ incomeProgress: Math.min(1, Math.max(0, progress)) }),

    // UI
    toggleHelp: () => set((state) => ({ showHelp: !state.showHelp })),
    setShowHelp: (show: boolean) => set({ showHelp: show }),
    toggleChapterNav: () => set((state) => ({ showChapterNav: !state.showChapterNav })),
    setRecordingMode: (enabled) =>
      set({
        isRecordingMode: enabled,
        showHelp: false,
        showChapterNav: false,
        isPlaying: enabled ? true : get().isPlaying,
      }),
    toggleFullscreen: () => {
      const { isFullscreen } = get();
      if (!isFullscreen) {
        document.documentElement.requestFullscreen?.();
      } else {
        document.exitFullscreen?.();
      }
      set({ isFullscreen: !isFullscreen });
    },
    toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),
    setVolume: (type, value) => {
      const volumeKey = `${type}Volume` as keyof DemoState;
      set({ [volumeKey]: Math.min(1, Math.max(0, value)) } as Partial<DemoState>);
    },

    // Achievements
    unlockAchievement: (id) => {
      const { achievements } = get();
      if (!achievements.includes(id)) {
        set({ achievements: [...achievements, id] });
      }
    },

    // Typewriter
    setTyping: (isTyping) => set({ isTyping }),
    setTypewriterComplete: (complete) => set({ typewriterComplete: complete }),

    // Reset
    reset: () => set(initialState),
  }))
);

// Helper to get score for a specific slide key
export function getScoreForSlide(slideKey: string): number {
  return SCORE_PROGRESSION[slideKey as keyof typeof SCORE_PROGRESSION] ?? 0;
}

// Helper to get inventory item for a specific slide key
export function getInventoryForSlide(slideKey: string): InventoryItem | undefined {
  return INVENTORY_ITEMS.find((item) => item.acquiredAt === slideKey);
}

// Expose store for Playwright testing
if (typeof window !== "undefined") {
  (window as any).__demoStore = useDemoStore;
}
