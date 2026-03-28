// Narration entry point — requires @google/genai as a peer dependency.
// Import from "@optimitron/wishonia-widget/narration" for talking character features.

export { WishoniaNarrator } from "./components/WishoniaNarrator";
export { useGeminiLive } from "./hooks/useGeminiLive";
export { AudioBufferQueue } from "./audio/audio-buffer-queue";

export type {
  WishoniaNarratorProps,
} from "./components/WishoniaNarrator";
export type {
  UseGeminiLiveOptions,
  UseGeminiLiveReturn,
} from "./hooks/useGeminiLive";
