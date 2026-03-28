/**
 * Wishonia voice configuration — single source of truth.
 *
 * Used by:
 * - WishoniaNarrator (default speakingInstructions)
 * - Gemini TTS batch generation scripts
 * - Any consumer that needs Wishonia's voice settings
 */

/** Default voice name for Gemini TTS / Live API */
export const WISHONIA_VOICE = "Kore";

/** Speaking instructions that define Wishonia's vocal personality */
export const WISHONIA_SPEAKING_INSTRUCTIONS =
  "Generate a patient, warm voice explaining something counterintuitive to someone smart. " +
  "Not condescending. Respects the listener's intelligence. Slightly quick.";

/** Gemini model for batch TTS generation */
export const WISHONIA_TTS_MODEL = "gemini-2.5-flash-preview-tts";

/** Gemini model for Live API streaming */
export const WISHONIA_LIVE_MODEL = "gemini-3.1-flash-live-preview";

/** Iconic Wishonia quotes — useful for demos, placeholders, and embed previews */
export const WISHONIA_EXAMPLE_QUOTES = [
  "Your species named your planet... dirt.",
  "On Wishonia, governance takes about four minutes a week.",
  "I looked up the last person on your planet who went around suggesting universal love and peace. You nailed him to a piece of wood.",
  "The data existed. Nobody looked at it. The data did not have a lobbying firm.",
  "It is like arguing about whether the patient is improving without taking the patient's pulse.",
  "This is not incompetence. It is architecture.",
];
