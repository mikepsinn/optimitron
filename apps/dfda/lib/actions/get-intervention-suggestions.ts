"use server";

// import { z } from "zod"; // Removed unused import
import { logger } from "@/lib/logger";
import {
  InterventionSuggestionSchema,
  type InterventionSuggestion,
} from "@/lib/schemas/clinical-trial-suggestion.schema";

interface ActionError {
  error: string;
}

export async function getInterventionSuggestionsAction(
  inputText: string,
): Promise<InterventionSuggestion | ActionError> {
  if (typeof inputText !== "string") {
    return { error: "Invalid input: inputText must be a string." };
  }

  // The API can handle empty input, returning general suggestions
  const trimmedInput = inputText.trim();

  try {
    const response = await fetch(
      `https://clinicaltrials.gov/api/int/suggest?input=${encodeURIComponent(trimmedInput)}&dictionary=InterventionName`, // Removed api_key
      {
        method: "GET",
        headers: {
          "Accept": "application/json",
        },
        next: { revalidate: 3600 }, // Cache for 1 hour
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      logger.error(
        `API error fetching intervention suggestions for "${trimmedInput}": ${response.status} ${response.statusText} - ${errorText}`,
      );
      return {
        error: `Failed to fetch intervention suggestions. API returned ${response.status}`,
      };
    }

    const data = await response.json();
    const validationResult = InterventionSuggestionSchema.safeParse(data);

    if (!validationResult.success) {
      logger.error(
        `Invalid API response structure for intervention suggestions "${trimmedInput}": ${validationResult.error.flatten()}`,
      );
      return { error: "Invalid API response structure." };
    }
    return validationResult.data;
  } catch (err) {
    if (err instanceof Error) {
      logger.error(
        `Error fetching intervention suggestions for "${trimmedInput}": ${err.message}`,
        err,
      );
    } else {
      logger.error(
        `Unknown error fetching intervention suggestions for "${trimmedInput}"`,
        err,
      );
    }
    return { error: "An unexpected error occurred while fetching suggestions." };
  }
} 