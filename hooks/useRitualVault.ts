// hooks/useRitualVault.ts
// Hook for MetaMask wallet connection and Ritual blockchain interaction.
// Handles wallet state, network switching, and on-chain prediction storage.

"use client";

import { useState, useEffect, useCallback } from "react";
import type { WalletState, StoreResult, MarketCategory } from "@/types";
import {
  getWalletState,
  switchToRitual,
  storePredictionOnChain,
} from "@/lib/ritual";

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useRitualVault() {
  const [wallet, setWallet] = useState<WalletState>({
    address: null,
    chainId: null,
    isConnected: false,
    isCorrectNetwork: false,
    balance: null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Read wallet state on mount ────────────────────────────────────────────
  useEffect(() => {
    refreshWalletState();
  }, []);

  // ── Listen for account / chain changes ───────────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined" || !window.ethereum) return;

    const handleAccountsChanged = () => refreshWalletState();
    const handleChainChanged = () => refreshWalletState();

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);

    return () => {
      window.ethereum?.removeListener("accountsChanged", handleAccountsChanged);
      window.ethereum?.removeListener("chainChanged", handleChainChanged);
    };
  }, []);

  // ── Refresh wallet state ──────────────────────────────────────────────────

  const refreshWalletState = useCallback(async () => {
    const state = await getWalletState();
    setWallet(state);
  }, []);

  // ── Connect wallet ────────────────────────────────────────────────────────

  const connect = useCallback(async (): Promise<boolean> => {
    if (typeof window === "undefined" || !window.ethereum) {
      setError("MetaMask not found. Please install the MetaMask extension.");
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Request account access (triggers MetaMask popup)
      await window.ethereum.request({ method: "eth_requestAccounts" });
      await refreshWalletState();
      return true;
    } catch (err: unknown) {
      const error = err as { message?: string };
      setError(error.message ?? "Failed to connect wallet.");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [refreshWalletState]);

  // ── Switch to Ritual network ──────────────────────────────────────────────

  const switchNetwork = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      await switchToRitual();
      await refreshWalletState();
      return true;
    } catch (err: unknown) {
      const error = err as { message?: string };
      setError(error.message ?? "Failed to switch network.");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [refreshWalletState]);

  // ── Store prediction on-chain ─────────────────────────────────────────────

  const storePrediction = useCallback(
    async (params: {
      question: string;
      outcome: string;
      confidence: number;
      reasoning: string;
      category: MarketCategory;
    }): Promise<StoreResult> => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await storePredictionOnChain(params);
        if (!result.success) {
          setError(result.error ?? "Transaction failed.");
        }
        return result;
      } catch (err: unknown) {
        const error = err as { message?: string };
        const msg = error.message ?? "Transaction failed.";
        setError(msg);
        return { success: false, error: msg };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const clearError = useCallback(() => setError(null), []);

  return {
    wallet,
    isLoading,
    error,
    connect,
    switchNetwork,
    storePrediction,
    clearError,
    refreshWalletState,
  };
}
