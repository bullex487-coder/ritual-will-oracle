// components/VerifyPrediction.tsx
// Allows anyone to verify a stored prediction by entering the tx hash or on-chain ID.
// Reads directly from the Ritual blockchain — no wallet required.

"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, CheckCircle, XCircle, Loader } from "lucide-react";
import { fetchPredictionById } from "@/lib/ritual";
import type { OnChainPrediction } from "@/types";
import {
  outcomeBg,
  confidenceColor,
  categoryIcon,
  formatDate,
} from "@/lib/helpers";
import { RITUAL_CHAIN } from "@/lib/ritual";

export default function VerifyPrediction() {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<OnChainPrediction | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async () => {
    const trimmed = input.trim();
    if (!trimmed) {
      setError("Enter a prediction ID or tx hash.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      // Check if it's a numeric ID
      const numericId = parseInt(trimmed, 10);
      if (!isNaN(numericId) && numericId > 0) {
        const prediction = await fetchPredictionById(numericId);
        if (prediction) {
          setResult(prediction);
        } else {
          setError(`No prediction found with ID #${numericId}.`);
        }
      } else if (trimmed.startsWith("0x")) {
        // It's a tx hash — inform user we need the ID
        setError(
          "Tx hash lookup requires the on-chain explorer. " +
            "Enter the numeric prediction ID instead (shown on-chain as #N)."
        );
      } else {
        setError("Enter a valid prediction ID (number) or tx hash (0x...).");
      }
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e.message ?? "Failed to fetch from Ritual chain.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Title */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-white">
          Verify{" "}
          <span className="bg-gradient-to-r from-purple-400 to-amber-400 bg-clip-text text-transparent">
            On-Chain Oracle
          </span>
        </h2>
        <p className="text-xs text-gray-500 font-mono">
          Anyone can verify any sealed prediction directly from Ritual Testnet.
          No wallet required.
        </p>
      </div>

      {/* Input */}
      <div className="space-y-3">
        <div className="flex gap-2">
          <div className="flex-1 flex items-center bg-[#080810] border border-purple-900/40 focus-within:border-purple-500/60 rounded-lg px-3 gap-2 transition-all">
            <Search size={13} className="text-gray-600 flex-shrink-0" />
            <input
              type="text"
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                setError(null);
              }}
              onKeyDown={(e) => e.key === "Enter" && handleVerify()}
              placeholder="Enter prediction ID (e.g. 42) or tx hash (0x...)"
              className="flex-1 bg-transparent py-3 text-sm font-mono text-white placeholder-gray-700 focus:outline-none"
            />
          </div>
          <button
            onClick={handleVerify}
            disabled={isLoading || !input.trim()}
            className="px-4 py-3 bg-purple-700/20 hover:bg-purple-700/30 disabled:bg-gray-800/30 border border-purple-600/30 disabled:border-gray-700/20 rounded-lg text-xs font-mono text-purple-300 disabled:text-gray-600 tracking-widest uppercase transition-all flex items-center gap-2"
          >
            {isLoading ? (
              <Loader size={13} className="animate-spin" />
            ) : (
              <Search size={13} />
            )}
            Verify
          </button>
        </div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-start gap-2 p-3 bg-red-900/10 border border-red-900/30 rounded-lg"
            >
              <XCircle size={13} className="text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs font-mono text-red-400">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Result */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Verified badge */}
            <div className="flex items-center gap-2 p-3 bg-emerald-900/10 border border-emerald-500/20 rounded-lg">
              <CheckCircle size={14} className="text-emerald-400" />
              <p className="text-xs font-mono text-emerald-400">
                Verified on Ritual Testnet — Prediction #{result.id}
              </p>
            </div>

            {/* Prediction details */}
            <div className="p-4 bg-[#080810] border border-purple-900/30 rounded-lg space-y-4">
              {/* Question */}
              <div>
                <p className="text-[10px] font-mono text-gray-600 mb-1">QUERY</p>
                <p className="text-white font-medium">{result.question}</p>
              </div>

              {/* Core metrics */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <p className="text-[10px] font-mono text-gray-600 mb-1">VERDICT</p>
                  <span
                    className={`text-sm font-bold font-mono px-2 py-0.5 rounded border ${outcomeBg(
                      result.outcome
                    )}`}
                  >
                    {result.outcome}
                  </span>
                </div>
                <div>
                  <p className="text-[10px] font-mono text-gray-600 mb-1">
                    CONFIDENCE
                  </p>
                  <p
                    className="text-xl font-bold font-mono"
                    style={{ color: confidenceColor(result.confidence) }}
                  >
                    {result.confidence}%
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-mono text-gray-600 mb-1">CATEGORY</p>
                  <p className="text-sm font-mono text-white flex items-center gap-1">
                    {categoryIcon(result.category)} {result.category}
                  </p>
                </div>
              </div>

              {/* Reasoning */}
              {result.reasoning && (
                <div>
                  <p className="text-[10px] font-mono text-gray-600 mb-1">REASONING</p>
                  <p className="text-xs text-gray-400 font-mono leading-relaxed">
                    {result.reasoning}
                  </p>
                </div>
              )}

              {/* Chain metadata */}
              <div className="pt-3 border-t border-purple-900/20 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-[10px] font-mono text-gray-600">ANALYST</span>
                  <a
                    href={`${RITUAL_CHAIN.explorerUrl}/address/${result.analyst}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] font-mono text-purple-400 hover:text-purple-300 underline"
                  >
                    {result.analyst}
                  </a>
                </div>
                <div className="flex justify-between">
                  <span className="text-[10px] font-mono text-gray-600">SEALED AT</span>
                  <span className="text-[10px] font-mono text-gray-400">
                    {formatDate(result.timestamp)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[10px] font-mono text-gray-600">CHAIN ID</span>
                  <span className="text-[10px] font-mono text-gray-400">
                    {RITUAL_CHAIN.chainId} ({RITUAL_CHAIN.chainName})
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Info box */}
      {!result && !error && (
        <div className="p-4 bg-[#080810] border border-purple-900/20 rounded-lg space-y-2">
          <p className="text-[10px] font-mono text-gray-600 tracking-wider">
            HOW VERIFICATION WORKS
          </p>
          <div className="space-y-1.5">
            {[
              "Each sealed prediction gets a unique on-chain ID (e.g. #42)",
              "The AI analysis, confidence, and reasoning are stored permanently",
              "Anyone can verify — no wallet, no permission needed",
              "Data is read directly from Ritual Testnet — no intermediaries",
            ].map((line, i) => (
              <p key={i} className="text-xs text-gray-500 font-mono flex gap-2">
                <span className="text-purple-700">[{i + 1}]</span>
                {line}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
