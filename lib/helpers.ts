// lib/helpers.ts
// Utility / helper functions used across the app.

import type { MarketCategory, PredictionOutcome, PredictionRecord } from "@/types";

// ─── ID Generation ────────────────────────────────────────────────────────────

/** Generate a random unique ID for local prediction records. */
export function generateId(): string {
  return `pred_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

// ─── Formatting ───────────────────────────────────────────────────────────────

/** Shorten a wallet address for display: 0x1234...abcd */
export function shortAddress(address: string): string {
  if (!address || address.length < 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/** Shorten a tx hash for display */
export function shortHash(hash: string): string {
  if (!hash || hash.length < 10) return hash;
  return `${hash.slice(0, 10)}...${hash.slice(-6)}`;
}

/** Format a Unix ms timestamp to a readable date string */
export function formatDate(ts: number): string {
  return new Date(ts).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Format confidence score as a label */
export function confidenceLabel(score: number): string {
  if (score >= 80) return "High Confidence";
  if (score >= 60) return "Moderate Confidence";
  if (score >= 40) return "Low Confidence";
  return "Very Uncertain";
}

// ─── Color Helpers ────────────────────────────────────────────────────────────

/** Get Tailwind color class for an outcome */
export function outcomeColor(outcome: PredictionOutcome): string {
  switch (outcome) {
    case "YES":
      return "text-emerald-400";
    case "NO":
      return "text-red-400";
    case "UNCERTAIN":
      return "text-amber-400";
    default:
      return "text-gray-400";
  }
}

/** Get background color class for an outcome badge */
export function outcomeBg(outcome: PredictionOutcome): string {
  switch (outcome) {
    case "YES":
      return "bg-emerald-400/10 border-emerald-400/30 text-emerald-400";
    case "NO":
      return "bg-red-400/10 border-red-400/30 text-red-400";
    case "UNCERTAIN":
      return "bg-amber-400/10 border-amber-400/30 text-amber-400";
    default:
      return "bg-gray-400/10 border-gray-400/30 text-gray-400";
  }
}

/** Get color for confidence score bar */
export function confidenceColor(score: number): string {
  if (score >= 80) return "#10b981"; // emerald
  if (score >= 60) return "#f59e0b"; // amber
  if (score >= 40) return "#f97316"; // orange
  return "#ef4444"; // red
}

/** Get category icon emoji */
export function categoryIcon(category: MarketCategory): string {
  switch (category) {
    case "Crypto":
      return "₿";
    case "Politics":
      return "⚖";
    case "Tech":
      return "⚡";
    case "Sports":
      return "🏆";
    case "General":
      return "◈";
    default:
      return "◈";
  }
}

// ─── LocalStorage Helpers ─────────────────────────────────────────────────────
// These MUST only be called inside useEffect (never during SSR)

const STORAGE_KEY = "ritual_oracle_predictions";

/** Save predictions array to localStorage */
export function savePredictions(predictions: PredictionRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(predictions));
  } catch {
    // Silently fail if storage is unavailable
  }
}

/** Load predictions array from localStorage */
export function loadPredictions(): PredictionRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as PredictionRecord[];
  } catch {
    return [];
  }
}

// ─── Validation ───────────────────────────────────────────────────────────────

/** Validate that a question is non-empty and looks like a question */
export function validateQuestion(q: string): string | null {
  const trimmed = q.trim();
  if (!trimmed) return "Please enter a question.";
  if (trimmed.length < 10) return "Question is too short (min 10 chars).";
  if (trimmed.length > 500) return "Question is too long (max 500 chars).";
  return null;
}
