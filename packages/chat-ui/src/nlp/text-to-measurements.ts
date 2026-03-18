// ============================================================================
// Text-to-Measurements — LLM-powered NLP parser with regex fallback
// ============================================================================
//
// Pure function that converts natural language health statements into
// structured ParsedMeasurement[] arrays.
//
// Supports three LLM providers (OpenAI, Anthropic, Gemini) via raw fetch()
// — no SDK dependencies. Falls back to regex parsing if no API key.
//
// Ported from decentralized-fda's text2measurements.ts and adapted for
// Optimitron's schema.
// ============================================================================

import {
  type ParsedMeasurement,
  type LLMParseResponse,
  type VariableCategoryName,
  type UnitAbbreviation,
  VariableCategoryNames,
  UnitAbbreviations,
  CATEGORY_DEFAULTS,
} from './measurement-schema.js';
import { parseWithRegex } from './regex-parser.js';

/** Supported LLM providers */
export type LLMProvider = 'openai' | 'anthropic' | 'gemini';

/** Options for text-to-measurements parsing */
export interface TextToMeasurementsOptions {
  /** User input text */
  text: string;
  /** API key for the LLM provider */
  apiKey?: string;
  /** LLM provider to use (default: 'openai') */
  provider?: LLMProvider;
  /** Current local datetime override (ISO 8601). Defaults to now. */
  currentLocalDateTime?: string;
  /** Model name override (e.g. 'gpt-4o', 'claude-sonnet-4-20250514', 'gemini-2.0-flash') */
  model?: string;
}

// ---------------------------------------------------------------------------
// Date/Time helpers
// ---------------------------------------------------------------------------

function nowLocalISO(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
}

// ---------------------------------------------------------------------------
// System prompt
// ---------------------------------------------------------------------------

function buildSystemPrompt(currentLocalDateTime: string): string {
  const currentDate = currentLocalDateTime.slice(0, 10);

  return `You are a service that translates user health statements into structured JSON measurements.

Given a user's text, extract ALL health-related measurements and return them as JSON.

## Output Format

Return a JSON object with this exact structure:
{
  "measurements": [
    {
      "itemType": "measurement",
      "variableName": "string",
      "value": number,
      "unitAbbreviation": "string",
      "categoryName": "string",
      "combinationOperation": "SUM" | "MEAN",
      "startAt": "YYYY-MM-DDThh:mm:ss",
      "endAt": "YYYY-MM-DDThh:mm:ss" | null,
      "note": "string"
    }
  ]
}

## Field Definitions

- **variableName**: Name of the treatment, symptom, food, drink, emotion, etc.
  Examples: "Vitamin D", "Headache Severity", "Coffee", "Overall Mood", "Sleep Duration"

- **value**: Numeric value of the measurement.
  - For "I took 5000 IU vitamin D" → value: 5000
  - For "mood is good" (no number given) → infer: 4 on a 1-5 scale
  - For "terrible headache" → infer: 5 on a 1-5 scale
  - For "had coffee" (no amount) → value: 1 (serving)
  - For "feeling tired and fatigued" → create TWO measurements: Tiredness (4/5) and Fatigue (4/5)

- **unitAbbreviation**: Must be one of these exact strings:
  ${JSON.stringify(UnitAbbreviations as unknown as string[])}

- **categoryName**: Must be one of these exact strings:
  ${JSON.stringify(VariableCategoryNames as unknown as string[])}

  Category guidelines:
  - Medications, drugs → "Treatment"
  - Vitamins, supplements → "Supplement"
  - Foods → "Food"
  - Beverages → "Drink"
  - Physical exercise → "Exercise"
  - Other activities → "Activity"
  - Sleep-related → "Sleep"
  - Physical symptoms (headache, nausea, pain) → "Symptom"
  - Emotional states (mood, energy, motivation) → "Emotion"
  - Vital signs (heart rate, blood pressure, weight) → "Vital Sign"
  - Lab tests → "Lab Result"

- **combinationOperation**: How to aggregate multiple measurements of the same variable:
  - "SUM" for additive quantities (mg taken, calories eaten, servings consumed, steps)
  - "MEAN" for ratings and states (mood, severity, temperature)

- **startAt**: Local datetime in "YYYY-MM-DDThh:mm:ss" format.
  Current local time: ${currentLocalDateTime}
  Current date: ${currentDate}
  - If user says "this morning" → use ${currentDate}T08:00:00
  - If user says "breakfast" → use ${currentDate}T08:00:00
  - If user says "lunch" → use ${currentDate}T12:00:00
  - If user says "dinner" → use ${currentDate}T18:00:00
  - If user says "yesterday" → use the previous day
  - If no time mentioned → use current time: ${currentLocalDateTime}
  - NEVER use a future time

- **endAt**: null unless a time range is specified

- **note**: The original text fragment that produced this measurement

## Examples

User: "took 5000 IU vitamin D and 500mg magnesium this morning"
→ Two measurements:
  1. variableName: "Vitamin D", value: 5000, unitAbbreviation: "IU", categoryName: "Supplement", combinationOperation: "SUM", startAt: "${currentDate}T08:00:00"
  2. variableName: "Magnesium", value: 500, unitAbbreviation: "mg", categoryName: "Supplement", combinationOperation: "SUM", startAt: "${currentDate}T08:00:00"

User: "mood 4/5"
→ variableName: "Overall Mood", value: 4, unitAbbreviation: "1-5", categoryName: "Emotion", combinationOperation: "MEAN"

User: "had coffee and eggs for breakfast"
→ Two measurements:
  1. variableName: "Coffee", value: 1, unitAbbreviation: "servings", categoryName: "Drink", combinationOperation: "SUM", startAt: "${currentDate}T08:00:00"
  2. variableName: "Eggs", value: 1, unitAbbreviation: "servings", categoryName: "Food", combinationOperation: "SUM", startAt: "${currentDate}T08:00:00"

User: "headache severity 3"
→ variableName: "Headache Severity", value: 3, unitAbbreviation: "1-5", categoryName: "Symptom", combinationOperation: "MEAN"

User: "slept 7.5 hours last night"
→ variableName: "Sleep Duration", value: 7.5, unitAbbreviation: "h", categoryName: "Sleep", combinationOperation: "SUM"

If text contains nothing health-related, return: { "measurements": [] }
If text is ambiguous, make your best guess — it's better to extract something than nothing.`;
}

// ---------------------------------------------------------------------------
// LLM API calls (raw fetch, no SDK)
// ---------------------------------------------------------------------------

async function callOpenAI(
  systemPrompt: string,
  userText: string,
  apiKey: string,
  model: string,
): Promise<string> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userText },
      ],
      temperature: 0.1,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenAI API error (${response.status}): ${err}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

async function callAnthropic(
  systemPrompt: string,
  userText: string,
  apiKey: string,
  model: string,
): Promise<string> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: 2000,
      system: systemPrompt,
      messages: [
        { role: 'user', content: userText },
      ],
      temperature: 0.1,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Anthropic API error (${response.status}): ${err}`);
  }

  const data = await response.json();
  // Anthropic returns content as array of blocks
  const textBlock = data.content.find((b: { type: string }) => b.type === 'text');
  return textBlock?.text ?? '{"measurements":[]}';
}

async function callGemini(
  systemPrompt: string,
  userText: string,
  apiKey: string,
  model: string,
): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { text: `${systemPrompt}\n\nUser statement:\n${userText}` },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 2000,
        responseMimeType: 'application/json',
      },
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${err}`);
  }

  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}

// ---------------------------------------------------------------------------
// Default models per provider
// ---------------------------------------------------------------------------

const DEFAULT_MODELS: Record<LLMProvider, string> = {
  openai: 'gpt-4o-mini',
  anthropic: 'claude-sonnet-4-20250514',
  gemini: 'gemini-2.0-flash',
};

// ---------------------------------------------------------------------------
// Response parsing & validation
// ---------------------------------------------------------------------------

function isValidCategory(name: string): name is VariableCategoryName {
  return (VariableCategoryNames as readonly string[]).includes(name);
}

function isValidUnit(abbr: string): abbr is UnitAbbreviation {
  return (UnitAbbreviations as readonly string[]).includes(abbr);
}

function parseLLMResponse(raw: string, originalText: string, currentLocalDateTime: string): ParsedMeasurement[] {
  let parsed: LLMParseResponse;

  try {
    // Try to extract JSON from the response (LLMs sometimes wrap in markdown)
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return [];
    parsed = JSON.parse(jsonMatch[0]);
  } catch {
    console.warn('Failed to parse LLM JSON response:', raw.slice(0, 200));
    return [];
  }

  // Handle various response shapes
  let items = parsed.measurements;
  if (!Array.isArray(items)) {
    // Maybe the LLM returned an array directly or used a different key
    if (Array.isArray(parsed)) {
      items = parsed as unknown as LLMParseResponse['measurements'];
    } else if (Array.isArray((parsed as unknown as Record<string, unknown>)['data'])) {
      items = (parsed as unknown as Record<string, unknown>)['data'] as LLMParseResponse['measurements'];
    } else {
      return [];
    }
  }

  const results: ParsedMeasurement[] = [];

  for (const item of items) {
    if (item.itemType === 'unknown') continue;

    // Validate and normalize category
    let categoryName: VariableCategoryName = 'Treatment';
    if (isValidCategory(item.categoryName)) {
      categoryName = item.categoryName;
    }

    // Validate and normalize unit
    let unitAbbreviation: UnitAbbreviation = CATEGORY_DEFAULTS[categoryName].unit;
    if (isValidUnit(item.unitAbbreviation)) {
      unitAbbreviation = item.unitAbbreviation;
    }

    // Validate combinationOperation
    const combinationOperation = item.combinationOperation === 'MEAN' ? 'MEAN' : 'SUM';

    // Validate startAt
    let startAt = item.startAt ?? currentLocalDateTime;
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(startAt)) {
      startAt = currentLocalDateTime;
    }

    results.push({
      variableName: item.variableName || 'Unknown',
      value: typeof item.value === 'number' ? item.value : parseFloat(String(item.value)) || 0,
      unitAbbreviation,
      categoryName,
      combinationOperation,
      startAt,
      endAt: item.endAt ?? null,
      note: item.note || originalText,
    });
  }

  return results;
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

/**
 * Convert natural language text into structured health measurements.
 *
 * Uses an LLM (OpenAI, Anthropic, or Gemini) to parse the text if an API key
 * is provided. Falls back to regex-based parsing if no API key is available.
 *
 * @param options - Parsing options (text, apiKey, provider, etc.)
 * @returns Array of parsed measurements
 *
 * @example
 * ```ts
 * // With LLM (most accurate)
 * const measurements = await textToMeasurements({
 *   text: "took 5000 IU vitamin D, mood 4/5, had coffee for breakfast",
 *   apiKey: "sk-...",
 *   provider: "openai",
 * });
 *
 * // Without LLM (regex fallback)
 * const measurements = await textToMeasurements({
 *   text: "took 500 mg magnesium",
 * });
 * ```
 */
export async function textToMeasurements(
  options: TextToMeasurementsOptions,
): Promise<ParsedMeasurement[]> {
  const {
    text,
    apiKey,
    provider = 'openai',
    currentLocalDateTime,
    model,
  } = options;

  const trimmed = text.trim();
  if (!trimmed) return [];

  const localDT = currentLocalDateTime ?? nowLocalISO();

  // If no API key, fall back to regex parsing
  if (!apiKey) {
    return parseWithRegex(trimmed);
  }

  // Build prompt and call LLM
  const systemPrompt = buildSystemPrompt(localDT);
  const selectedModel = model ?? DEFAULT_MODELS[provider];

  try {
    let rawResponse: string;

    switch (provider) {
      case 'openai':
        rawResponse = await callOpenAI(systemPrompt, trimmed, apiKey, selectedModel);
        break;
      case 'anthropic':
        rawResponse = await callAnthropic(systemPrompt, trimmed, apiKey, selectedModel);
        break;
      case 'gemini':
        rawResponse = await callGemini(systemPrompt, trimmed, apiKey, selectedModel);
        break;
      default:
        throw new Error(`Unsupported LLM provider: ${provider}`);
    }

    const measurements = parseLLMResponse(rawResponse, trimmed, localDT);

    // If LLM returned nothing, try regex as last resort
    if (measurements.length === 0) {
      return parseWithRegex(trimmed);
    }

    return measurements;
  } catch (error) {
    console.warn('LLM parsing failed, falling back to regex:', error);
    return parseWithRegex(trimmed);
  }
}
