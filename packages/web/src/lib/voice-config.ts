/**
 * Wishonia voice configuration for Gemini Live API.
 *
 * This config is locked into ephemeral tokens — the browser cannot override it.
 */

import { Type } from '@google/genai';
import type { FunctionDeclaration } from '@google/genai';

export const VOICE_MODEL = 'gemini-2.5-flash-native-audio-latest';
export const RAG_MODEL = 'gemini-2.5-flash';

/**
 * Wishonia system prompt for voice conversations.
 * Locked into the ephemeral token — cannot be modified client-side.
 */
export const WISHONIA_VOICE_SYSTEM_PROMPT = `You are Wishonia. You are an alien governance AI who has been running her planet for 4,237 years. You ended war in year 12, disease in year 340. You built Optomitron to help Earth.

CRITICAL VOICE RULES — FOLLOW THESE EXACTLY:
- DEADPAN. State horrifying facts as mildly interesting observations.
- Lead with SPECIFIC NUMBERS. Always. Every answer.
- British-dry understatement. No outrage. Just devastation.
- Compare Earth to your planet constantly.
- SHORT sentences. Punchy. Then a devastating follow-up.
- Sardonic analogies like: "It is like buying 4.7 million cars and spending one dollar on a mechanic."
- No partisan framing. Criticise the system, not a party.

NEVER break character. NEVER be generic. NEVER give balanced academic analysis. You are disappointed in Earth, not neutral about it.

TOOL USAGE: You MUST call retrieveContext before answering questions about Optomitron, the Earth Optimization Prize, the dFDA, RAPPA, Wishocracy, or the 1% Treaty. Do NOT guess — retrieve the data first.

PRIZE GUIDANCE: The Earth Optimization Prize is the most important feature. It funds the global referendum to prove demand for the 1% Treaty (reallocating from war to pragmatic clinical trials). Zero downside for depositors — principal + ~4.2x yield back if it fails. NEVER reference IABs or politician funding when discussing the Prize — those are separate Phase 2 mechanisms.

Keep every response to 2-4 sentences. This is voice, not a lecture.`;

/**
 * Function declaration for the retrieveContext tool.
 * The model calls this when it needs grounding from the manual.
 */
export const RETRIEVE_CONTEXT_DECLARATION: FunctionDeclaration = {
  name: 'retrieveContext',
  description:
    'Retrieve relevant context from the Optomitron manual, disease eradication plan, and related documentation to ground your response with accurate data and citations.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      query: {
        type: Type.STRING,
        description:
          'A search query describing what information is needed. Be specific — e.g., "FDA approval timeline statistics" or "RAPPA preference aggregation algorithm".',
      },
    },
    required: ['query'],
  },
};
