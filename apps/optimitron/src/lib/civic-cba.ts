import {
  WISHOCRATIC_ITEMS,
  type WishocraticItemId,
} from "./wishocracy-data";
import type {
  LegislativeCategoryMatch,
  LegislativeBudgetDirection,
} from "./alignment-legislative-classification";

export interface StructuralCBACategory {
  categoryId: WishocraticItemId;
  name: string;
  direction: LegislativeBudgetDirection;
  roi: string | null;
  icon: string;
  score: number;
}

export interface StructuralCBA {
  categories: StructuralCBACategory[];
  overallSignal: "positive" | "negative" | "mixed";
}

export interface LLMCBAResult {
  summary: string;
  pros: string[];
  cons: string[];
}

export interface BillCBA {
  structural: StructuralCBA;
  llm?: LLMCBAResult;
}

/**
 * Build a structural cost-benefit analysis from classification data.
 * Pure function — no API calls.
 */
export function buildStructuralCBA(
  matches: LegislativeCategoryMatch[],
  direction: LegislativeBudgetDirection,
): StructuralCBA {
  const categories: StructuralCBACategory[] = matches.map((m) => {
    const cat = WISHOCRATIC_ITEMS[m.categoryId];
    return {
      categoryId: m.categoryId,
      name: cat?.name ?? m.categoryId,
      direction,
      roi: cat?.roiData?.ratio ?? null,
      icon: cat?.icon ?? "",
      score: m.score,
    };
  });

  // Determine overall signal based on ROI data
  const hasHighROI = categories.some((c) => {
    if (!c.roi) return false;
    const ratio = parseFloat(c.roi.split(":")[0] ?? "0");
    return ratio > 5;
  });
  const hasLowROI = categories.some((c) => {
    if (!c.roi) return false;
    const ratio = parseFloat(c.roi.split(":")[0] ?? "0");
    return ratio < 1;
  });

  let overallSignal: "positive" | "negative" | "mixed";
  if (direction === "increase" && hasHighROI) {
    overallSignal = "positive";
  } else if (direction === "increase" && hasLowROI) {
    overallSignal = "negative";
  } else if (direction === "decrease" && hasLowROI) {
    overallSignal = "positive";
  } else if (direction === "decrease" && hasHighROI) {
    overallSignal = "negative";
  } else if (hasHighROI && hasLowROI) {
    overallSignal = "mixed";
  } else {
    overallSignal = "mixed";
  }

  return { categories, overallSignal };
}

/**
 * Generate an LLM-powered cost-benefit summary for a bill.
 * Falls back gracefully if the LLM call fails.
 */
export async function generateLLMCBA(
  billTitle: string,
  subjects: string[],
  structuralCBA: StructuralCBA,
  apiKey: string,
  provider: "openai" | "anthropic" | "gemini",
): Promise<LLMCBAResult | null> {
  const systemPrompt = `You are a nonpartisan policy analyst. Given a bill and its structural cost-benefit data, provide a concise cost-benefit analysis. Return valid JSON with this shape: { "summary": "2-3 sentence plain-language summary", "pros": ["pro1", "pro2"], "cons": ["con1", "con2"] }. Be balanced and evidence-based.`;

  const categoryInfo = structuralCBA.categories
    .map((c) => `${c.icon} ${c.name}: direction=${c.direction}, ROI=${c.roi ?? "unknown"}, score=${c.score.toFixed(2)}`)
    .join("\n");

  const userPrompt = `Bill: "${billTitle}"\nSubjects: ${subjects.join(", ") || "none"}\nOverall signal: ${structuralCBA.overallSignal}\n\nAffected budget categories:\n${categoryInfo}`;

  try {
    const text = await callLLM(systemPrompt, userPrompt, apiKey, provider);
    const parsed = JSON.parse(text) as LLMCBAResult;
    if (!parsed.summary || !Array.isArray(parsed.pros) || !Array.isArray(parsed.cons)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Orchestrator: builds structural CBA and optionally generates LLM summary.
 */
export async function buildBillCBA(
  billTitle: string,
  subjects: string[],
  matches: LegislativeCategoryMatch[],
  direction: LegislativeBudgetDirection,
  apiKey?: string,
  provider?: "openai" | "anthropic" | "gemini",
): Promise<BillCBA> {
  const structural = buildStructuralCBA(matches, direction);

  let llm: LLMCBAResult | null = null;
  if (apiKey && provider) {
    llm = await generateLLMCBA(billTitle, subjects, structural, apiKey, provider);
  }

  return { structural, llm: llm ?? undefined };
}

// --- LLM call helpers (same pattern as text-to-measurements.ts) ---

const DEFAULT_MODELS: Record<string, string> = {
  openai: "gpt-4o-mini",
  anthropic: "claude-sonnet-4-20250514",
  gemini: "gemini-2.0-flash",
};

async function callLLM(
  systemPrompt: string,
  userText: string,
  apiKey: string,
  provider: "openai" | "anthropic" | "gemini",
): Promise<string> {
  const model = DEFAULT_MODELS[provider] ?? "gpt-4o-mini";

  switch (provider) {
    case "openai":
      return callOpenAI(systemPrompt, userText, apiKey, model);
    case "anthropic":
      return callAnthropic(systemPrompt, userText, apiKey, model);
    case "gemini":
      return callGemini(systemPrompt, userText, apiKey, model);
  }
}

async function callOpenAI(
  systemPrompt: string,
  userText: string,
  apiKey: string,
  model: string,
): Promise<string> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userText },
      ],
      temperature: 0.1,
      max_tokens: 2000,
      response_format: { type: "json_object" },
    }),
  });
  const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  return data.choices?.[0]?.message?.content ?? "";
}

async function callAnthropic(
  systemPrompt: string,
  userText: string,
  apiKey: string,
  model: string,
): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      system: systemPrompt,
      messages: [{ role: "user", content: userText }],
      temperature: 0.1,
      max_tokens: 2000,
    }),
  });
  const data = (await res.json()) as { content?: Array<{ type: string; text?: string }> };
  return data.content?.find((c) => c.type === "text")?.text ?? "";
}

async function callGemini(
  systemPrompt: string,
  userText: string,
  apiKey: string,
  model: string,
): Promise<string> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ parts: [{ text: userText }] }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 2000,
          responseMimeType: "application/json",
        },
      }),
    },
  );
  const data = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
}
