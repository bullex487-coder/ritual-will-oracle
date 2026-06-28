// types/index.ts
// Central type definitions for the Ritual Will Oracle dApp

// ─── Prediction Outcome ───────────────────────────────────────────────────────
export type PredictionOutcome = "YES" | "NO" | "UNCERTAIN";

// ─── Market Categories ────────────────────────────────────────────────────────
export type MarketCategory =
  | "Crypto"
  | "Politics"
  | "Tech"
  | "Sports"
  | "General";

// ─── Oracle Analysis Result (returned by AI) ─────────────────────────────────
export interface OracleAnalysis {
  outcome: PredictionOutcome;
  confidence: number; // 0–100
  timeHorizon: string; // e.g. "Short-term (< 3 months)"
  riskFactors: string[]; // list of key risk factors
  reasoning: string; // AI summary paragraph
  category: MarketCategory;
  question: string;
  timestamp: number; // Unix ms
}

// ─── On-chain stored prediction ───────────────────────────────────────────────
export interface OnChainPrediction {
  id: number;
  question: string;
  outcome: PredictionOutcome;
  confidence: number;
  reasoning: string;
  category: MarketCategory;
  analyst: string; // wallet address
  timestamp: number;
  txHash: string;
}

// ─── Full prediction record (local state) ────────────────────────────────────
export interface PredictionRecord {
  id: string; // local UUID
  analysis: OracleAnalysis;
  txHash?: string; // set once stored on-chain
  chainId?: number;
  blockNumber?: number;
  onChainId?: number; // smart contract ID
  status: "pending" | "storing" | "confirmed" | "failed";
  createdAt: number;
}

// ─── Wallet State ─────────────────────────────────────────────────────────────
export interface WalletState {
  address: string | null;
  chainId: number | null;
  isConnected: boolean;
  isCorrectNetwork: boolean;
  balance: string | null;
}

// ─── Market Ticker Item ───────────────────────────────────────────────────────
export interface TickerItem {
  label: string;
  value: string;
  change: "up" | "down" | "neutral";
}

// ─── API Request/Response ─────────────────────────────────────────────────────
export interface PredictRequest {
  question: string;
  category: MarketCategory;
}

export interface PredictResponse {
  success: boolean;
  analysis?: OracleAnalysis;
  error?: string;
}

// ─── Contract interaction result ─────────────────────────────────────────────
export interface StoreResult {
  success: boolean;
  txHash?: string;
  blockNumber?: number;
  onChainId?: number;
  error?: string;
}
