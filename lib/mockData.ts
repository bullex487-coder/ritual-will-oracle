// lib/mockData.ts
// Demo/seed data shown when no real predictions exist yet.
// Also used as fallback if the API is unavailable.

import type { PredictionRecord, TickerItem } from "@/types";

export const MOCK_PREDICTIONS: PredictionRecord[] = [
  {
    id: "pred_demo_001",
    analysis: {
      question: "Will Bitcoin reach $200k by end of 2030?",
      outcome: "YES",
      confidence: 72,
      timeHorizon: "Short-term (< 6 months)",
      riskFactors: [
        "Fed interest rate decisions",
        "ETF inflow sustainability",
        "Regulatory uncertainty in key markets",
      ],
      reasoning:
        "Historical halving cycles consistently produced new ATHs within 18 months. Current institutional demand via spot ETFs provides structural support. Macroeconomic tailwinds favor risk assets. However, geopolitical shocks remain a wildcard.",
      category: "Crypto",
      timestamp: Date.now() - 1000 * 60 * 60 * 24 * 3,
    },
    txHash:
      "0xabc123def456abc123def456abc123def456abc123def456abc123def456abc1",
    chainId: 1979,
    blockNumber: 48201,
    onChainId: 1,
    status: "confirmed",
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 3,
  },
  {
    id: "pred_demo_002",
    analysis: {
      question: "Will AI replace 50% of software engineering jobs by 2030?",
      outcome: "UNCERTAIN",
      confidence: 45,
      timeHorizon: "Long-term (> 2 years)",
      riskFactors: [
        "Pace of model capability improvements",
        "Corporate adoption speed",
        "Regulatory constraints on AI systems",
        "Human oversight requirements",
      ],
      reasoning:
        "AI tools are augmenting engineers rather than replacing them in the near term. 2030 is aggressive given current limitations in reasoning, debugging, and system architecture. Role transformation is more likely than elimination.",
      category: "Tech",
      timestamp: Date.now() - 1000 * 60 * 60 * 24 * 1,
    },
    txHash:
      "0xdef789abc012def789abc012def789abc012def789abc012def789abc012def7",
    chainId: 1979,
    blockNumber: 48305,
    onChainId: 2,
    status: "confirmed",
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 1,
  },
  {
    id: "pred_demo_003",
    analysis: {
      question: "Will Ethereum's price exceed Bitcoin's price in 2026?",
      outcome: "NO",
      confidence: 81,
      timeHorizon: "Medium-term (6–24 months)",
      riskFactors: [
        "ETH/BTC ratio historical ceiling",
        "Bitcoin's brand dominance",
        "Institutional preference for BTC",
      ],
      reasoning:
        "ETH has never flipped BTC by market cap despite multiple favorable cycles. Bitcoin's first-mover brand advantage and regulatory clarity make a 'flippening' highly unlikely in this window.",
      category: "Crypto",
      timestamp: Date.now() - 1000 * 60 * 60 * 5,
    },
    status: "pending", // not yet stored on-chain
    createdAt: Date.now() - 1000 * 60 * 60 * 5,
  },
];

// ─── Market Ticker Data ───────────────────────────────────────────────────────

export const MOCK_TICKER: TickerItem[] = [
  { label: "RITUAL/USD", value: "$2.847", change: "up" },
  { label: "BTC/USD", value: "$97,420", change: "up" },
  { label: "ETH/USD", value: "$3,812", change: "down" },
  { label: "ORACLE NODES", value: "1,247", change: "up" },
  { label: "PREDICTIONS TODAY", value: "8,931", change: "up" },
  { label: "AVG CONFIDENCE", value: "67.3%", change: "neutral" },
  { label: "CHAIN ID", value: "1979", change: "neutral" },
  { label: "TOTAL SEALED", value: "142,889", change: "up" },
];

// ─── Category Descriptions ────────────────────────────────────────────────────

export const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  Crypto: "Digital assets, DeFi protocols, blockchain ecosystems",
  Politics: "Elections, policy changes, geopolitical events",
  Tech: "AI, software, hardware, company milestones",
  Sports: "Tournaments, championships, athlete performance",
  General: "Economics, culture, science, society",
};

// ─── Example Questions by Category ───────────────────────────────────────────

export const EXAMPLE_QUESTIONS: Record<string, string[]> = {
  Crypto: [
    "Will Bitcoin reach $200k by end of 2026?",
    "Will Ethereum flip Bitcoin by market cap in 2026?",
    "Will a CBDC launch in the US before 2027?",
  ],
  Politics: [
    "Will the US-China trade war escalate in 2026?",
    "Will the EU introduce a unified AI regulation by 2026?",
  ],
  Tech: [
    "Will GPT-5 achieve AGI-level reasoning by 2026?",
    "Will Apple launch an AR headset successor in 2026?",
  ],
  Sports: [
    "Will the Golden State Warriors win the NBA championship in 2026?",
    "Will a new Formula 1 world champion emerge in 2026?",
  ],
  General: [
    "Will global inflation return below 2% by end of 2026?",
    "Will humans land on Mars before 2035?",
  ],
};
