// hooks/useOracle.ts
// Central state management hook for the Oracle dApp.
// Handles predictions list, AI analysis requests, and local storage sync.

"use client";

import { useState, useEffect, useCallback } from "react";
import type {
  PredictionRecord,
  OracleAnalysis,
  MarketCategory,
} from "@/types";
import { analyzeQuestion } from "@/services/api";
import {
  generateId,
  savePredictions,
  loadPredictions,
  validateQuestion,
} from "@/lib/helpers";

// ─── State Shape ──────────────────────────────────────────────────────────────

interface OracleState {
  predictions: PredictionRecord[];
  activePrediction: PredictionRecord | null;
  isAnalyzing: boolean;
  error: string | null;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useOracle() {
  // Always initialize with empty array (avoids SSR hydration errors)
  const [state, setState] = useState<OracleState>({
    predictions: [],
    activePrediction: null,
    isAnalyzing: false,
    error: null,
  });

  // ── Load from localStorage after mount (client-only) ──────────────────────
  useEffect(() => {
    const saved = loadPredictions();
    if (saved.length > 0) {
      setState((prev) => ({ ...prev, predictions: saved }));
    }
  }, []);

  // ── Persist to localStorage whenever predictions change ───────────────────
  useEffect(() => {
    if (state.predictions.length > 0) {
      savePredictions(state.predictions);
    }
  }, [state.predictions]);

  // ── Submit question for AI analysis ──────────────────────────────────────

  const analyze = useCallback(
    async (question: string, category: MarketCategory) => {
      // Validate input
      const validationError = validateQuestion(question);
      if (validationError) {
        setState((prev) => ({ ...prev, error: validationError }));
        return null;
      }

      setState((prev) => ({ ...prev, isAnalyzing: true, error: null }));

      try {
        const response = await analyzeQuestion(question, category);

        if (!response.success || !response.analysis) {
          setState((prev) => ({
            ...prev,
            isAnalyzing: false,
            error: response.error ?? "Analysis failed.",
          }));
          return null;
        }

        // Create a new local prediction record
        const record: PredictionRecord = {
          id: generateId(),
          analysis: response.analysis,
          status: "pending",
          createdAt: Date.now(),
        };

        setState((prev) => ({
          ...prev,
          isAnalyzing: false,
          activePrediction: record,
          predictions: [record, ...prev.predictions],
          error: null,
        }));

        return record;
      } catch (err: unknown) {
        const error = err as { message?: string };
        setState((prev) => ({
          ...prev,
          isAnalyzing: false,
          error: error.message ?? "Network error.",
        }));
        return null;
      }
    },
    []
  );

  // ── Update a prediction (e.g., after on-chain storage) ───────────────────

  const updatePrediction = useCallback(
    (id: string, updates: Partial<PredictionRecord>) => {
      setState((prev) => ({
        ...prev,
        predictions: prev.predictions.map((p) =>
          p.id === id ? { ...p, ...updates } : p
        ),
        activePrediction:
          prev.activePrediction?.id === id
            ? { ...prev.activePrediction, ...updates }
            : prev.activePrediction,
      }));
    },
    []
  );

  // ── Set the active/focused prediction ────────────────────────────────────

  const setActivePrediction = useCallback((record: PredictionRecord | null) => {
    setState((prev) => ({ ...prev, activePrediction: record }));
  }, []);

  // ── Clear error ───────────────────────────────────────────────────────────

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  // ── Add a demo/mock prediction (for testing without API) ─────────────────

  const addMockPrediction = useCallback((analysis: OracleAnalysis) => {
    const record: PredictionRecord = {
      id: generateId(),
      analysis,
      status: "pending",
      createdAt: Date.now(),
    };
    setState((prev) => ({
      ...prev,
      activePrediction: record,
      predictions: [record, ...prev.predictions],
    }));
    return record;
  }, []);

  return {
    predictions: state.predictions,
    activePrediction: state.activePrediction,
    isAnalyzing: state.isAnalyzing,
    error: state.error,
    analyze,
    updatePrediction,
    setActivePrediction,
    clearError,
    addMockPrediction,
  };
}
