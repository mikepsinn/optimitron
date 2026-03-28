// Components
export { WishoniaCharacter } from "./components/WishoniaCharacter";
export { WishoniaWidget } from "./components/WishoniaWidget";

// Hooks
export { useWishoniaAnimator } from "./hooks/useWishoniaAnimator";
export { useAmplitudeAnalyser } from "./hooks/useAmplitudeAnalyser";

// Core utilities
export { preloadTier0, preloadTier1, preloadSprites, getSpriteUrl } from "./core/sprite-loader";
export { getHeadName, getIdleHead, amplitudeToViseme, CHAR_TO_VISEME, EXPRESSION_MOUTHS } from "./core/viseme-map";
export { MOOD_PRESETS, getMoodPreset } from "./core/mood-presets";
export { WISHONIA_VOICE, WISHONIA_SPEAKING_INSTRUCTIONS, WISHONIA_TTS_MODEL, WISHONIA_LIVE_MODEL } from "./core/voice-config";

// Types
export type { Expression, MouthShape, BodyPose, AnimatorState } from "./types";
export type { WishoniaCharacterProps } from "./components/WishoniaCharacter";
export type { WishoniaWidgetProps } from "./components/WishoniaWidget";
export type { UseWishoniaAnimatorOptions, UseWishoniaAnimatorReturn } from "./hooks/useWishoniaAnimator";
export type { MoodPreset } from "./core/mood-presets";
