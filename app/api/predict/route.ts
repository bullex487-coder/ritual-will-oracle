// app/api/predict/route.ts
// Next.js App Router API route.
// Receives a user question, sends it to Groq (llama-3.3-70b-versatile),
// and returns a structured OracleAnalysis object.

import { NextRequest, NextResponse } from "next/server";
import type { OracleAnalysis, MarketCategory, PredictRequest } from "@/types";

// ─── Groq API call ────────────────────────────────────────────────────────────

async function callGroq(prompt: string): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY environment variable not set.");
  }

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `You are the Ritual Will Oracle — a precise, data-driven AI prediction engine 
built on the Ritual decentralized AI network. You analyze future scenarios with 
rigorous probabilistic reasoning. You always respond ONLY with valid JSON, no 
markdown, no preamble, no explanation outside the JSON structure.`,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.3, // Low temperature for more deterministic predictions
      max_tokens: 800,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Groq API error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

// ─── Prompt Builder ───────────────────────────────────────────────────────────

function buildPrompt(question: string, category: MarketCategory): string {
  return `Analyze this prediction question and return ONLY a JSON object with NO markdown:

Question: "${question}"
Category: ${category}

Return exactly this JSON structure:
{
  "outcome": "YES" | "NO" | "UNCERTAIN",
  "confidence": <integer 0-100>,
  "timeHorizon": "<one of: Short-term (< 3 months) | Medium-term (3–12 months) | Long-term (1–3 years) | Very Long-term (> 3 years)>",
  "riskFactors": ["<factor 1>", "<factor 2>", "<factor 3>"],
  "reasoning": "<2-3 sentence analytical summary citing key evidence and assumptions>",
  "category": "${category}"
}

Rules:
- outcome must be exactly "YES", "NO", or "UNCERTAIN"
- confidence reflects your certainty: 80-100=high, 60-79=moderate, 40-59=low, 0-39=very uncertain
- riskFactors must be an array of 2-4 concise strings
- reasoning must be analytical, not opinion-based
- Return ONLY the JSON object, nothing else`;
}

// ─── Route Handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = (await req.json()) as PredictRequest;
    const { question, category } = body;

    // Basic input validation
    if (!question || typeof question !== "string" || question.trim().length < 5) {
      return NextResponse.json(
        { success: false, error: "Question is too short or missing." },
        { status: 400 }
      );
    }

    const validCategories: MarketCategory[] = [
      "Crypto",
      "Politics",
      "Tech",
      "Sports",
      "General",
    ];
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { success: false, error: "Invalid category." },
        { status: 400 }
      );
    }

    // Call Groq
    const prompt = buildPrompt(question.trim(), category);
    const rawResponse = await callGroq(prompt);

    // Parse JSON from AI response
    let parsed: Partial<OracleAnalysis>;
    try {
      // Strip any accidental markdown code fences
      const cleaned = rawResponse
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();
      parsed = JSON.parse(cleaned);
    } catch {
      console.error("Failed to parse Groq response:", rawResponse);
      return NextResponse.json(
        { success: false, error: "AI returned an unparseable response." },
        { status: 500 }
      );
    }

    // Validate required fields
    if (
      !parsed.outcome ||
      typeof parsed.confidence !== "number" ||
      !parsed.reasoning ||
      !Array.isArray(parsed.riskFactors)
    ) {
      return NextResponse.json(
        { success: false, error: "AI response missing required fields." },
        { status: 500 }
      );
    }

    // Build final analysis object
    const analysis: OracleAnalysis = {
      question: question.trim(),
      outcome: parsed.outcome as "YES" | "NO" | "UNCERTAIN",
      confidence: Math.min(100, Math.max(0, Math.round(parsed.confidence))),
      timeHorizon: parsed.timeHorizon ?? "Medium-term (3–12 months)",
      riskFactors: parsed.riskFactors.slice(0, 4),
      reasoning: parsed.reasoning,
      category,
      timestamp: Date.now(),
    };

    return NextResponse.json({ success: true, analysis });
  } catch (err: unknown) {
    const error = err as { message?: string };
    console.error("[/api/predict] Error:", error.message);
    return NextResponse.json(
      { success: false, error: error.message ?? "Internal server error" },
      { status: 500 }
    );
  }
}
