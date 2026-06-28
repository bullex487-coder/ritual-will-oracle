// components/RitualVault.tsx
// UI component for the on-chain storage flow.
// Shows wallet status, prompts to connect/switch network, and handles
// the transaction lifecycle for storing a prediction.

"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wifi, WifiOff, AlertCircle, CheckCircle, Hexagon } from "lucide-react";
import { useRitualVault } from "@/hooks/useRitualVault";
import type { PredictionRecord } from "@/types";
import { shortHash, shortAddress } from "@/lib/helpers";
import { RITUAL_CHAIN } from "@/lib/ritual";

interface RitualVaultProps {
  prediction: PredictionRecord | null;
  onStored: (txHash: string, blockNumber: number, onChainId?: number) => void;
}

export default function RitualVault({ prediction, onStored }: RitualVaultProps) {
  const { wallet, isLoading, error, connect, switchNetwork, storePrediction } =
    useRitualVault();

  const [txStatus, setTxStatus] = useState<
    "idle" | "sending" | "success" | "failed"
  >("idle");
  const [txHash, setTxHash] = useState<string | null>(null);

  const handleStore = async () => {
    if (!prediction) return;
    if (!wallet.isConnected) {
      await connect();
      return;
    }
    if (!wallet.isCorrectNetwork) {
      await switchNetwork();
      return;
    }

    setTxStatus("sending");
    const result = await storePrediction({
      question: prediction.analysis.question,
      outcome: prediction.analysis.outcome,
      confidence: prediction.analysis.confidence,
      reasoning: prediction.analysis.reasoning,
      category: prediction.analysis.category,
    });

    if (result.success && result.txHash) {
      setTxStatus("success");
      setTxHash(result.txHash);
      onStored(result.txHash, result.blockNumber ?? 0, result.onChainId);
    } else {
      setTxStatus("failed");
    }
  };

  // Determine CTA based on wallet state
  const getCtaText = () => {
    if (txStatus === "sending") return "Broadcasting to Ritual...";
    if (txStatus === "success") return "Sealed ✓";
    if (!wallet.isConnected) return "Connect Wallet to Seal";
    if (!wallet.isCorrectNetwork) return "Switch to Ritual Network";
    return "Seal to Ritual Testnet";
  };

  return (
    <div className="w-full space-y-4">
      {/* Vault header */}
      <div className="flex items-center gap-2">
        <Hexagon size={14} className="text-purple-500" strokeWidth={1.5} />
        <p className="text-[10px] font-mono text-gray-500 tracking-widest uppercase">
          Ritual Vault — On-Chain Storage
        </p>
      </div>

      {/* Network info card */}
      <div className="p-3 bg-[#080810] border border-purple-900/30 rounded-lg space-y-2">
        {/* Chain info */}
        <div className="flex justify-between items-center">
          <span className="text-[10px] font-mono text-gray-600">NETWORK</span>
          <span className="text-[10px] font-mono text-purple-400">
            {RITUAL_CHAIN.chainName} · ID {RITUAL_CHAIN.chainId}
          </span>
        </div>

        {/* Wallet status */}
        <div className="flex justify-between items-center">
          <span className="text-[10px] font-mono text-gray-600">WALLET</span>
          {wallet.isConnected ? (
            <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
              <Wifi size={9} />
              {shortAddress(wallet.address!)}
            </span>
          ) : (
            <span className="text-[10px] font-mono text-gray-600 flex items-center gap-1">
              <WifiOff size={9} />
              Not connected
            </span>
          )}
        </div>

        {/* Balance */}
        {wallet.isConnected && (
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-mono text-gray-600">BALANCE</span>
            <span className="text-[10px] font-mono text-amber-400">
              {wallet.balance} {RITUAL_CHAIN.symbol}
            </span>
          </div>
        )}

        {/* Network warning */}
        {wallet.isConnected && !wallet.isCorrectNetwork && (
          <div className="flex items-center gap-2 mt-1 pt-2 border-t border-amber-900/30">
            <AlertCircle size={10} className="text-amber-400" />
            <p className="text-[10px] font-mono text-amber-400">
              Wrong network — switch to Ritual Testnet
            </p>
          </div>
        )}
      </div>

      {/* Error display */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-start gap-2 p-2.5 bg-red-900/10 border border-red-900/30 rounded"
          >
            <AlertCircle size={11} className="text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-[10px] font-mono text-red-400 leading-relaxed">
              {error}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success state */}
      <AnimatePresence>
        {txStatus === "success" && txHash && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-3 bg-emerald-900/10 border border-emerald-500/20 rounded-lg space-y-2"
          >
            <div className="flex items-center gap-2">
              <CheckCircle size={13} className="text-emerald-400" />
              <p className="text-xs font-mono text-emerald-400">
                Prediction sealed on-chain!
              </p>
            </div>
            <a
              href={`${RITUAL_CHAIN.explorerUrl}/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] font-mono text-purple-400 hover:text-purple-300 underline break-all block"
            >
              {txHash}
            </a>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CTA button */}
      {txStatus !== "success" && (
        <button
          onClick={handleStore}
          disabled={isLoading || txStatus === "sending" || !prediction}
          className="w-full py-2.5 flex items-center justify-center gap-2 bg-purple-700/20 hover:bg-purple-700/30 disabled:bg-gray-800/30 border border-purple-600/30 disabled:border-gray-700/20 rounded text-xs font-mono text-purple-300 disabled:text-gray-600 tracking-widest uppercase transition-all"
        >
          {txStatus === "sending" && (
            <span className="w-2 h-2 rounded-full border border-purple-400 border-t-transparent animate-spin" />
          )}
          {getCtaText()}
        </button>
      )}
    </div>
  );
}
