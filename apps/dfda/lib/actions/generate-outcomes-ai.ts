'use server';

import { GoogleGenAI, Type, HarmCategory, HarmBlockThreshold } from '@google/genai';
import { logger } from '@/lib/logger';
import { GOOGLE_AI_MODEL } from '../ai/google';
import type { OutcomeMeasure } from '@/types/treatment';
import { env } from '@/lib/env';

const LOG_PREFIX = '[generate-outcomes-ai]';

// Use the GOOGLE_GENERATIVE_AI_API_KEY from environment
const API_KEY = env.GOOGLE_GENERATIVE_AI_API_KEY;
const MODEL_ID = GOOGLE_AI_MODEL;

if (!API_KEY) {
  const errorMsg = `${LOG_PREFIX} GOOGLE_GENERATIVE_AI_API_KEY is not configured. Please set it in your .env file.`;
  logger.error(errorMsg);
  throw new Error(errorMsg);
}

const genAI = new GoogleGenAI({ apiKey: API_KEY });

// Safety settings
const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

// Schema for outcome measure
const OutcomeMeasureSchema = {
  type: Type.OBJECT,
  properties: {
    name: {
      type: Type.STRING,
      description: 'The outcome measure name (e.g., "LDL Cholesterol", "Blood Pressure")',
    },
    baseline: {
      type: Type.STRING,
      description: 'Typical baseline value with units (e.g., "160 mg/dL", "140/90 mmHg")',
    },
    percentageChange: {
      type: Type.NUMBER,
      description: 'Percentage change from baseline (negative for reductions, positive for increases)',
    },
    absoluteChange: {
      type: Type.STRING,
      description: 'Absolute change with units (e.g., "-69 mg/dL", "-20/10 mmHg")',
    },
    isPositive: {
      type: Type.BOOLEAN,
      description: 'Whether this change is clinically beneficial (true for improvements, false for worsening)',
    },
  },
  required: ['name', 'baseline', 'percentageChange', 'absoluteChange', 'isPositive'],
};

// Schema for the complete response
const OutcomesResponseSchema = {
  type: Type.OBJECT,
  properties: {
    primaryOutcomes: {
      type: Type.ARRAY,
      items: OutcomeMeasureSchema,
      description: 'Primary efficacy outcomes (3-5 key measures)',
    },
    secondaryOutcomes: {
      type: Type.ARRAY,
      items: OutcomeMeasureSchema,
      description: 'Secondary benefits (2-4 additional measures)',
    },
  },
  required: ['primaryOutcomes', 'secondaryOutcomes'],
};

/**
 * Generate plausible outcome measures using AI when trial data is unavailable
 * @param treatmentName The treatment name
 * @param conditionName The condition being treated
 * @returns Promise with structured outcome measures
 */
export async function generateOutcomesFromAI(
  treatmentName: string,
  conditionName: string
): Promise<{ primaryOutcomes: OutcomeMeasure[]; secondaryOutcomes: OutcomeMeasure[] } | null> {
  logger.info(`${LOG_PREFIX} Generating AI-estimated outcomes for ${treatmentName} treating ${conditionName}`);

  if (!API_KEY) {
    logger.error(`${LOG_PREFIX} GOOGLE_GENERATIVE_AI_API_KEY is not configured.`);
    return null;
  }

  try {
    const prompt = `Generate clinically accurate outcome measures for ${treatmentName} when used to treat ${conditionName}.

Based on medical literature and clinical evidence, provide:

PRIMARY OUTCOMES (3-5 key efficacy measures):
- Main therapeutic outcomes (e.g., symptom reduction, biomarker changes)
- Include realistic baseline values and typical changes seen in clinical trials
- Use proper medical units (mg/dL, mmHg, points on clinical scales, etc.)

SECONDARY OUTCOMES (2-4 additional benefits):
- Quality of life improvements, functional outcomes, or related biomarker changes
- Include realistic baseline values and typical changes

Guidelines:
- Percentage changes should be negative for reductions (e.g., -43% for cholesterol reduction)
- Percentage changes should be positive for improvements/increases (e.g., +15% for quality of life)
- Use clinically meaningful absolute changes with proper units
- Mark isPositive=true for beneficial changes, false for harmful ones
- Be medically accurate based on known clinical trial results
- For symptom scales, include scale name and range in baseline (e.g., "HAM-D score: 22/52")

Example for Atorvastatin treating High Cholesterol:
Primary: LDL Cholesterol (baseline: "160 mg/dL", -43%, "-69 mg/dL", isPositive: true)
Secondary: HDL Cholesterol (baseline: "45 mg/dL", +5%, "+2.3 mg/dL", isPositive: true)

Now generate accurate outcomes for ${treatmentName} treating ${conditionName}.`;

    const response = await genAI.models.generateContent({
      model: MODEL_ID,
      contents: prompt,
      config: {
        safetySettings,
        responseMimeType: 'application/json',
        responseSchema: OutcomesResponseSchema,
      },
    });

    logger.info(`${LOG_PREFIX} Received response from Google Gen AI`);

    const responseText = response.text;
    if (!responseText) {
      logger.warn(`${LOG_PREFIX} Empty response from Gen AI`);
      return null;
    }

    const parsed = JSON.parse(responseText);

    // Mark all outcomes as AI-estimated
    const primaryOutcomes: OutcomeMeasure[] = parsed.primaryOutcomes.map((o: any) => ({
      ...o,
      dataSource: 'ai-estimated' as const,
    }));

    const secondaryOutcomes: OutcomeMeasure[] = parsed.secondaryOutcomes.map((o: any) => ({
      ...o,
      dataSource: 'ai-estimated' as const,
    }));

    logger.info(`${LOG_PREFIX} Successfully generated ${primaryOutcomes.length} primary + ${secondaryOutcomes.length} secondary outcomes`);

    return {
      primaryOutcomes,
      secondaryOutcomes,
    };
  } catch (error: any) {
    logger.error(`${LOG_PREFIX} Error generating outcomes from AI:`, {
      error: error.message,
      stack: error.stack,
    });
    return null;
  }
}
