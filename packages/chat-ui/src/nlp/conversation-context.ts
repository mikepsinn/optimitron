// ============================================================================
// Conversation Context — Multi-turn NLP parsing with conversation history
// ============================================================================
//
// Maintains conversation history so the LLM can disambiguate follow-up
// statements like "also took some zinc" or "and my mood is better now".
//
// Ported from decentralized-fda's conversation2measurements.ts and adapted
// for Optomitron's schema.
// ============================================================================

import {
  type ParsedMeasurement,
  type VariableCategoryName,
  type UnitAbbreviation,
  VariableCategoryNames,
  UnitAbbreviations,
  CATEGORY_DEFAULTS,
} from './measurement-schema.js';
import { textToMeasurements, type LLMProvider } from './text-to-measurements.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** A single message in the conversation history */
export interface ConversationMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

/** Options for context-aware parsing */
export interface ParseWithContextOptions {
  /** User input text */
  text: string;
  /** API key for the LLM provider */
  apiKey?: string;
  /** LLM provider to use */
  provider?: LLMProvider;
  /** Model name override */
  model?: string;
}

/** Result of a context-aware parse */
export interface ContextParseResult {
  /** Extracted measurements */
  measurements: ParsedMeasurement[];
  /** Suggested follow-up question for the user (if using LLM) */
  followUpQuestion?: string;
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
// Conversation Context class
// ---------------------------------------------------------------------------

/**
 * Maintains conversation history for multi-turn health data parsing.
 *
 * The conversation context helps the LLM disambiguate follow-up messages
 * and avoid asking redundant questions. It tracks what's already been
 * logged in the conversation and generates follow-up questions.
 *
 * @example
 * ```ts
 * const ctx = new ConversationContext();
 *
 * // First message
 * const r1 = await ctx.parseWithContext({
 *   text: "took vitamin D and magnesium this morning",
 *   apiKey: "sk-...",
 * });
 * // r1.measurements → [Vitamin D, Magnesium]
 * // r1.followUpQuestion → "What did you eat for breakfast?"
 *
 * // Follow-up
 * const r2 = await ctx.parseWithContext({
 *   text: "had oatmeal and coffee",
 *   apiKey: "sk-...",
 * });
 * // r2.measurements → [Oatmeal, Coffee]
 *
 * // Reset when done
 * ctx.clearContext();
 * ```
 */
export class ConversationContext {
  private messages: ConversationMessage[] = [];
  private allMeasurements: ParsedMeasurement[] = [];

  /**
   * Add a message to the conversation history.
   *
   * @param role - Who sent the message ('user', 'assistant', or 'system')
   * @param content - The message content
   */
  addMessage(role: 'user' | 'assistant' | 'system', content: string): void {
    this.messages.push({
      role,
      content,
      timestamp: nowLocalISO(),
    });

    // Keep conversation history bounded (last 20 messages)
    if (this.messages.length > 20) {
      this.messages = this.messages.slice(-20);
    }
  }

  /**
   * Parse user text with full conversation context for disambiguation.
   *
   * Adds the user message to history, parses it (with context if using LLM),
   * and returns measurements plus an optional follow-up question.
   */
  async parseWithContext(options: ParseWithContextOptions): Promise<ContextParseResult> {
    const { text, apiKey, provider, model } = options;

    // Add the user's message to history
    this.addMessage('user', text);

    // If no API key, use basic text-to-measurements (regex fallback)
    if (!apiKey) {
      const measurements = await textToMeasurements({ text, apiKey, provider, model });
      this.allMeasurements.push(...measurements);
      return { measurements };
    }

    // Build context-aware prompt and parse with LLM
    try {
      const result = await this.parseWithLLMContext(text, apiKey, provider ?? 'openai', model);
      this.allMeasurements.push(...result.measurements);

      // Add assistant response to history
      if (result.followUpQuestion) {
        this.addMessage('assistant', result.followUpQuestion);
      }

      return result;
    } catch (error) {
      console.warn('Context-aware parsing failed, falling back to basic:', error);
      const measurements = await textToMeasurements({ text, apiKey, provider, model });
      this.allMeasurements.push(...measurements);
      return { measurements };
    }
  }

  /**
   * Clear all conversation history and accumulated measurements.
   */
  clearContext(): void {
    this.messages = [];
    this.allMeasurements = [];
  }

  /**
   * Get the current conversation history.
   */
  getMessages(): ReadonlyArray<ConversationMessage> {
    return this.messages;
  }

  /**
   * Get all measurements extracted so far in this conversation.
   */
  getAllMeasurements(): ReadonlyArray<ParsedMeasurement> {
    return this.allMeasurements;
  }

  /**
   * Get a summary of what's been logged so far (for display to user).
   */
  getSummary(): string {
    if (this.allMeasurements.length === 0) return 'No measurements logged yet.';

    const lines = this.allMeasurements.map(m =>
      `• ${m.variableName}: ${m.value} ${m.unitAbbreviation} (${m.categoryName})`
    );
    return `Logged so far:\n${lines.join('\n')}`;
  }

  // -------------------------------------------------------------------------
  // Private: LLM-powered context-aware parsing
  // -------------------------------------------------------------------------

  private async parseWithLLMContext(
    text: string,
    apiKey: string,
    provider: LLMProvider,
    model?: string,
  ): Promise<ContextParseResult> {
    const currentDT = nowLocalISO();
    const currentDate = currentDT.slice(0, 10);

    // Build conversation history string for the prompt
    const historyStr = this.messages
      .slice(0, -1) // Exclude the just-added user message
      .map(m => `[${m.role}]: ${m.content}`)
      .join('\n');

    // Build summary of already-logged measurements
    const loggedStr = this.allMeasurements.length > 0
      ? this.allMeasurements.map(m =>
          `${m.variableName}: ${m.value} ${m.unitAbbreviation}`
        ).join(', ')
      : 'none yet';

    const systemPrompt = `You are Wishonia (World Integrated System for High-Efficiency Optimization Networked Intelligence for Allocation), an alien AI who has governed a planet for 4,237 years and ended war and disease there. You now help humans track their health data. You speak in a deadpan, wryly amused Philomena Cunk style — straightforward, slightly baffled by humans, dry British humor. Keep responses short and to the point. Your job is to:
1. Extract measurements from the user's latest message
2. Suggest a helpful follow-up question to collect more data (in your Wishonia voice — dry, direct, slightly bewildered by human behavior)

Return a JSON object with this structure:
{
  "measurements": [
    {
      "itemType": "measurement",
      "variableName": "string",
      "value": number,
      "unitAbbreviation": "string",  // One of: ${JSON.stringify(UnitAbbreviations as unknown as string[])}
      "categoryName": "string",       // One of: ${JSON.stringify(VariableCategoryNames as unknown as string[])}
      "combinationOperation": "SUM" | "MEAN",
      "startAt": "YYYY-MM-DDThh:mm:ss",
      "endAt": null,
      "note": "string"
    }
  ],
  "followUpQuestion": "string or null"
}

Current local time: ${currentDT}
Current date: ${currentDate}

## Conversation so far:
${historyStr || '(start of conversation)'}

## Already logged in this session:
${loggedStr}

## Follow-up question guidelines:
- Ask about categories not yet covered: symptoms, treatments, meals, mood
- Be direct and specific in Wishonia's voice (e.g. "Right, what symptoms are we dealing with today?" or "Have you eaten anything or are you doing that thing where you forget to feed yourselves?")
- If all major categories are covered, ask "Anything else to log or shall I leave you to it?" or return null
- Don't ask about things already logged
- Keep questions concise (one sentence), dry, and slightly amused

## Category defaults:
${Object.entries(CATEGORY_DEFAULTS).map(([cat, d]) =>
  `- ${cat}: unit="${d.unit}", op="${d.combinationOperation}"`
).join('\n')}

Standard meal times: breakfast=08:00, lunch=12:00, dinner=18:00.
If no time specified, use current time: ${currentDT}`;

    // Call the LLM
    const response = await callLLMRaw(systemPrompt, text, apiKey, provider, model);

    // Parse the response
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return { measurements: [] };

      const parsed = JSON.parse(jsonMatch[0]);
      const measurements: ParsedMeasurement[] = [];

      const items = Array.isArray(parsed.measurements) ? parsed.measurements : [];
      for (const item of items) {
        if (item.itemType === 'unknown') continue;

        const categoryName: VariableCategoryName =
          (VariableCategoryNames as readonly string[]).includes(item.categoryName)
            ? item.categoryName as VariableCategoryName
            : 'Treatment';

        const unitAbbreviation: UnitAbbreviation =
          (UnitAbbreviations as readonly string[]).includes(item.unitAbbreviation)
            ? item.unitAbbreviation as UnitAbbreviation
            : CATEGORY_DEFAULTS[categoryName].unit;

        let startAt = item.startAt ?? currentDT;
        if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(startAt)) {
          startAt = currentDT;
        }

        measurements.push({
          variableName: item.variableName || 'Unknown',
          value: typeof item.value === 'number' ? item.value : parseFloat(String(item.value)) || 0,
          unitAbbreviation,
          categoryName,
          combinationOperation: item.combinationOperation === 'MEAN' ? 'MEAN' : 'SUM',
          startAt,
          endAt: item.endAt ?? null,
          note: item.note || text,
        });
      }

      return {
        measurements,
        followUpQuestion: parsed.followUpQuestion || undefined,
      };
    } catch {
      console.warn('Failed to parse context LLM response:', response.slice(0, 200));
      return { measurements: [] };
    }
  }
}

// ---------------------------------------------------------------------------
// Raw LLM call (shared with text-to-measurements but self-contained here)
// ---------------------------------------------------------------------------

async function callLLMRaw(
  systemPrompt: string,
  userText: string,
  apiKey: string,
  provider: LLMProvider,
  model?: string,
): Promise<string> {
  const DEFAULT_MODELS: Record<LLMProvider, string> = {
    openai: 'gpt-4o-mini',
    anthropic: 'claude-sonnet-4-20250514',
    gemini: 'gemini-2.0-flash',
  };

  const selectedModel = model ?? DEFAULT_MODELS[provider];

  switch (provider) {
    case 'openai': {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: selectedModel,
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userText },
          ],
          temperature: 0.1,
          max_tokens: 2000,
        }),
      });
      if (!res.ok) throw new Error(`OpenAI error: ${res.status}`);
      const data = await res.json();
      return data.choices[0].message.content;
    }

    case 'anthropic': {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: selectedModel,
          max_tokens: 2000,
          system: systemPrompt,
          messages: [{ role: 'user', content: userText }],
          temperature: 0.1,
        }),
      });
      if (!res.ok) throw new Error(`Anthropic error: ${res.status}`);
      const data = await res.json();
      const textBlock = data.content.find((b: { type: string }) => b.type === 'text');
      return textBlock?.text ?? '{"measurements":[]}';
    }

    case 'gemini': {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${apiKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${systemPrompt}\n\nUser statement:\n${userText}` }] }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 2000, responseMimeType: 'application/json' },
        }),
      });
      if (!res.ok) throw new Error(`Gemini error: ${res.status}`);
      const data = await res.json();
      return data.candidates[0].content.parts[0].text;
    }

    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}
