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

// Types
export type { Expression, MouthShape, BodyPose, AnimatorState } from "./types";
export type { WishoniaCharacterProps } from "./components/WishoniaCharacter";
export type { WishoniaWidgetProps } from "./components/WishoniaWidget";
export type { UseWishoniaAnimatorOptions, UseWishoniaAnimatorReturn } from "./hooks/useWishoniaAnimator";
export type { MoodPreset } from "./core/mood-presets";
