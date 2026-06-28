// services/api.ts
// Client-side service for calling the Next.js API routes.
// Keeps fetch logic out of components.

import type { PredictRequest, PredictResponse, MarketCategory } from "@/types";

const BASE = "/api";

/**
 * Send a question to the AI Oracle for analysis.
 * Calls POST /api/predict
 */
export async function analyzeQuestion(
  question: string,
  category: MarketCategory
): Promise<PredictResponse> {
  const body: PredictRequest = { question, category };

  const res = await fetch(`${BASE}/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    return {
      success: false,
      error: `API error ${res.status}: ${text}`,
    };
  }

  return res.json() as Promise<PredictResponse>;
}
