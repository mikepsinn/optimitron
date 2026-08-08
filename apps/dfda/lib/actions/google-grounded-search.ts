'use server';

import { GoogleGenAI, HarmCategory, HarmBlockThreshold, Tool, type Part } from '@google/genai';
import { logger } from '@/lib/logger';
import { z } from 'zod';
import { GOOGLE_AI_MODEL } from '../ai/google';
import { env } from '@/lib/env';

const LOG_PREFIX = '[google-grounded-search]';

// Define a Zod schema for the citation structure we expect/need
const GroundedSearchCitationSchema = z.object({
  title: z.string().optional().nullable(),
  url: z.string().min(1, { message: "Citation URL cannot be empty" }),
});

export type GroundedSearchCitationType = z.infer<typeof GroundedSearchCitationSchema>;

// Define the structure for the response we want
export interface GroundedSearchResult {
  answer: string;
  citations: GroundedSearchCitationType[];
  searchQueries?: string[];
  renderedContent?: string;
}

// Define a custom type for attribution based on observed usage
interface CustomGroundingAttribution {
  web?: {
    uri: string;
    title?: string;
  };
  retrievedContext?: {
    uri: string;
    title?: string;
  };
  // Other potential fields like `source_id`, `confidenceScore` could be added if needed
}

// Use the GOOGLE_GENERATIVE_AI_API_KEY from environment
const API_KEY = env.GOOGLE_GENERATIVE_AI_API_KEY;
// Model compatible with the genai SDK and grounding tool
const MODEL_ID = GOOGLE_AI_MODEL;

// Instantiate the Google AI client
if (!API_KEY) {
  const errorMsg = `${LOG_PREFIX} GOOGLE_GENERATIVE_AI_API_KEY is not configured. Please set it in your .env file.`;
  logger.error(errorMsg);
  throw new Error(errorMsg);
}
const genAI = new GoogleGenAI({ apiKey: API_KEY }); // Pass API key in options object

// Define the grounding tool configuration using Google Search
// IMPORTANT: Use 'googleSearch' not 'googleSearchRetrieval' for @google/genai
const tools: Tool[] = [
  { googleSearch: {} }, 
];

// Safety settings (optional, adjust as needed)
const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

/**
 * Generates a grounded answer using the Google AI SDK (@google/genai) with Google Search as a tool.
 * @param query The question/topic to search for (e.g., the treatment name).
 * @returns A promise resolving to the answer and citations, or null on error.
 */
export async function getGroundedAnswerAction(query: string): Promise<GroundedSearchResult | null> {
  logger.info(`${LOG_PREFIX} Getting grounded answer for query via @google/genai:`, { query });

  // --- Start Debug Logging ---
  logger.debug(`${LOG_PREFIX} Using Model ID:`, { modelId: MODEL_ID });
  logger.debug(`${LOG_PREFIX} GOOGLE_GENERATIVE_AI_API_KEY is set:`, { isSet: !!API_KEY });
  // --- End Debug Logging ---

  if (!API_KEY) {
    logger.error(`${LOG_PREFIX} GOOGLE_GENERATIVE_AI_API_KEY is not configured.`);
    return null;
  }
  if (!query) {
    logger.warn(`${LOG_PREFIX} Query is empty.`);
    return null;
  }

  try {
    // Generate content with grounding tool using the correct SDK pattern
    const result = await genAI.models.generateContent({
      model: MODEL_ID,
      contents: query,
      config: {
        tools, // Pass the grounding tool config here
        safetySettings,
      },
    });

    logger.info(`${LOG_PREFIX} Received response from @google/genai API.`);

    // The result object IS the response (contains candidates directly)
    const response = result;

    if (!response || !response.candidates?.length || !response.candidates[0].content?.parts?.length) {
      logger.warn(`${LOG_PREFIX} No valid candidates or content found in @google/genai response.`);
      return null;
    }

    const candidate = response.candidates[0];
    if (!candidate.content?.parts) {
      logger.warn(`${LOG_PREFIX} No content parts found in candidate`);
      return null;
    }
    
    const answer = candidate.content.parts.map((part: Part) => part.text).join('\n') || 'No answer generated.'; // Join parts if multiple

    const groundingMetadata = candidate.groundingMetadata;
    // Ensure the citations array is typed correctly at initialization
    const citations: GroundedSearchCitationType[] = [];

    // Citation processing from groundingChunks
    const groundingChunks: CustomGroundingAttribution[] = (groundingMetadata?.groundingChunks ?? []).map((chunk: any) => {
      // Transform GroundingChunk to CustomGroundingAttribution
      return {
        ...chunk,
        web: chunk.web?.uri ? {
          uri: chunk.web.uri,
          title: chunk.web.title
        } : undefined
      };
    });
    groundingChunks.forEach((chunk: CustomGroundingAttribution) => {
      let rawCitation: { url?: string; title?: string } = {};

      if (chunk.web?.uri) {
        rawCitation = {
              url: chunk.web.uri,
              title: chunk.web.title || undefined
        };
      } else if (chunk.retrievedContext?.uri) {
        rawCitation = {
              url: chunk.retrievedContext.uri,
              title: chunk.retrievedContext.title || undefined
        };
      }

      if (rawCitation.url) { // Only attempt to parse if we have a URL
        const parsedCitation = GroundedSearchCitationSchema.safeParse(rawCitation);
        if (parsedCitation.success) {
          citations.push(parsedCitation.data);
        } else {
          logger.warn(
            `${LOG_PREFIX} Failed to validate citation from API. Skipping.`,
            {
              error: parsedCitation.error.flatten(),
              citationData: rawCitation
            }
          );
        }
      }
    });

    const searchQueries = groundingMetadata?.webSearchQueries;
    // Get rendered content for Search Suggestions display
    const renderedContent = groundingMetadata?.searchEntryPoint?.renderedContent;

    logger.info(`${LOG_PREFIX} Successfully processed grounded answer and ${citations.length} citations.`, { searchQueries });
    return { answer, citations, searchQueries, renderedContent };

  } catch (err: any) { 
    const logDetails: Record<string, any> = {};
    let errorMessage = "Error calling Google AI (@google/genai) API.";

    // Error structure might be simpler with this SDK
    logDetails.message = err.message;
    logDetails.stack = err.stack?.split('\n').map((line: string) => line.trim());
    errorMessage = `${errorMessage} Message: ${err.message}`;

    // Include response details if available (often attached to the error object)
    if (err.response) {
        logDetails.responseStatus = err.response.status;
        logDetails.responseData = err.response.data; 
    }

    logger.error(`${LOG_PREFIX} ${errorMessage}`, logDetails);
    return null;
  }
} 