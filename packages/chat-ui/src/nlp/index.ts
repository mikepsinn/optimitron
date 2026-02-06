// ============================================================================
// NLP Pipeline — Public API
// ============================================================================
//
// Text-to-measurements NLP pipeline for converting natural language health
// statements into structured ParsedMeasurement objects.
//
// Ported from decentralized-fda and adapted for Optomitron's schema.
// ============================================================================

// --- Schema types & constants ---
export {
  VariableCategoryNames,
  UnitAbbreviations,
  CATEGORY_DEFAULTS,
  DFDA_CATEGORY_MAP,
  DFDA_UNIT_MAP,
} from './measurement-schema.js';

export type {
  VariableCategoryName,
  UnitAbbreviation,
  CombinationOperation,
  ParsedMeasurement,
  LLMMeasurementItem,
  LLMUnknownItem,
  LLMParseResponse,
} from './measurement-schema.js';

// --- Text-to-measurements (LLM + regex fallback) ---
export { textToMeasurements } from './text-to-measurements.js';
export type {
  LLMProvider,
  TextToMeasurementsOptions,
} from './text-to-measurements.js';

// --- Regex-only parser ---
export { parseWithRegex } from './regex-parser.js';

// --- Conversation context (multi-turn parsing) ---
export { ConversationContext } from './conversation-context.js';
export type {
  ConversationMessage,
  ParseWithContextOptions,
  ContextParseResult,
} from './conversation-context.js';
