'use server';

import { logger } from '@/lib/logger';
import {
  ConditionSuggestionSchema,
  type ConditionSuggestion,
} from '@/lib/schemas/clinical-trial-suggestion.schema';

const LOG_PREFIX = '[get-condition-suggestions]';
const SUGGEST_API_BASE_URL = 'https://clinicaltrials.gov/api/int/suggest';

interface GetConditionSuggestionsResult {
  success: boolean;
  data?: ConditionSuggestion;
  error?: string;
}

/**
 * Fetches condition suggestions from ClinicalTrials.gov API.
 * @param inputText The text input by the user. Can be an empty string.
 * @returns A promise resolving to the list of suggestions or an error state.
 */
export async function getConditionSuggestionsAction(
  inputText: string,
): Promise<GetConditionSuggestionsResult> {
  logger.info(`${LOG_PREFIX} Fetching condition suggestions for:`, { inputText });

  const queryParams = new URLSearchParams({
    input: inputText,
    dictionary: 'Condition',
  });

  const requestUrl = `${SUGGEST_API_BASE_URL}?${queryParams.toString()}`;
  logger.info(`${LOG_PREFIX} Requesting URL: ${requestUrl}`);

  try {
    // For this public, non-authenticated endpoint, minimal headers are usually sufficient.
    // The extensive headers from the user's example (cookies, ncbi-phid) are likely session-specific
    // and not required or appropriate for a general server-to-server API call.
    const response = await fetch(requestUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        // 'User-Agent': 'YourAppName/1.0 (yourwebsite.com)' // Good practice to set a User-Agent
      },
      cache: 'no-store', // Suggestions should generally be fresh
    });

    if (!response.ok) {
      const errorBody = await response.text();
      logger.error(`${LOG_PREFIX} Suggestion API request failed with status ${response.status}:`, { 
        url: requestUrl, 
        status: response.status, 
        body: errorBody 
      });
      return { success: false, error: `Suggestion API request failed: ${response.statusText} (Status: ${response.status})` };
    }

    const rawData: unknown = await response.json();
    const parsedResult = ConditionSuggestionSchema.safeParse(rawData);

    if (!parsedResult.success) {
      logger.error(`${LOG_PREFIX} Failed to parse suggestion API response:`, { 
        errors: parsedResult.error.flatten(), 
        rawData 
      });
      return { success: false, error: 'Failed to parse condition suggestions from API.' };
    }
    
    logger.info(`${LOG_PREFIX} Successfully fetched and parsed ${parsedResult.data.length} suggestions.`);
    return {
      success: true,
      data: parsedResult.data,
    };

  } catch (err: any) {
    logger.error(`${LOG_PREFIX} Error fetching or parsing condition suggestions:`, {
      message: err.message,
      stack: err.stack,
      url: requestUrl,
    });
    return { success: false, error: 'An unexpected error occurred while fetching condition suggestions.' };
  }
} 