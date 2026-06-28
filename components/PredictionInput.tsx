// components/PredictionInput.tsx
// The main input form where users type their future scenario question.
// Includes category selection and example questions.

"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ChevronDown } from "lucide-react";
import type { MarketCategory } from "@/types";
import { EXAMPLE_QUESTIONS, CATEGORY_DESCRIPTIONS } from "@/lib/mockData";
import { validateQuestion } from "@/lib/helpers";

const CATEGORIES: MarketCategory[] = [
  "Crypto",
  "Politics",
  "Tech",
  "Sports",
  "General",
];

const CATEGORY_ICONS: Record<MarketCategory, string> = {
  Crypto: "₿",
  Politics: "⚖",
  Tech: "⚡",
  Sports: "🏆",
  General: "◈",
};

interface PredictionInputProps {
  onSubmit: (question: string, category: MarketCategory) => void;
  isLoading: boolean;
  error: string | null;
}

export default function PredictionInput({
  onSubmit,
  isLoading,
  error,
}: PredictionInputProps) {
  const [question, setQuestion] = useState("");
  const [category, setCategory] = useState<MarketCategory>("Crypto");
  const [showExamples, setShowExamples] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = () => {
    const err = validateQuestion(question);
    if (err) {
      setLocalError(err);
      return;
    }
    setLocalError(null);
    onSubmit(question, category);
  };

  const handleExample = (q: string) => {
    setQuestion(q);
    setShowExamples(false);
    setLocalError(null);
  };

  const displayError = localError || error;
  const charCount = question.length;
  const isOverLimit = charCount > 500;

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      {/* Header */}
      <div className="text-center space-y-2 mb-6">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-3 py-1 bg-purple-900/30 border border-purple-700/30 rounded-full"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          <span className="text-[10px] font-mono text-purple-300 tracking-widest uppercase">
            Ritual AI Oracle — Testnet Active
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-3xl sm:text-4xl font-bold text-white leading-tight"
        >
          Ask the{" "}
          <span className="bg-gradient-to-r from-purple-400 to-amber-400 bg-clip-text text-transparent">
            Oracle
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-sm text-gray-500 font-mono"
        >
          Submit any future scenario. AI analyzes → result sealed on Ritual chain.
        </motion.p>
      </div>

      {/* Category selector */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="flex gap-2 flex-wrap"
      >
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded border text-xs font-mono tracking-wider transition-all ${
              category === cat
                ? "bg-purple-600/20 border-purple-500/50 text-purple-300"
                : "bg-transparent border-gray-800 text-gray-600 hover:border-gray-600 hover:text-gray-400"
            }`}
          >
            <span className="text-[11px]">{CATEGORY_ICONS[cat]}</span>
            {cat.toUpperCase()}
          </button>
        ))}
      </motion.div>

      {/* Main input area */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="relative"
      >
        <div
          className={`relative rounded-lg border bg-[#080810] transition-all ${
            displayError
              ? "border-red-500/50"
              : "border-purple-900/50 focus-within:border-purple-500/60"
          }`}
        >
          {/* Terminal prompt line */}
          <div className="flex items-center gap-2 px-4 pt-3 pb-1 border-b border-purple-900/20">
            <span className="text-purple-500 font-mono text-xs">oracle@ritual:~$</span>
            <span className="text-gray-600 font-mono text-xs">query --analyze</span>
          </div>

          <textarea
            value={question}
            onChange={(e) => {
              setQuestion(e.target.value);
              setLocalError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmit();
            }}
            placeholder={`Will ${category === "Crypto" ? "Bitcoin reach $200k by 2030?" : category === "Tech" ? "GPT-5 achieve AGI by 2026?" : "your prediction come true?"}`}
            rows={3}
            disabled={isLoading}
            className="w-full bg-transparent px-4 py-3 text-white placeholder-gray-700 font-mono text-sm resize-none focus:outline-none disabled:opacity-50"
          />

          {/* Bottom toolbar */}
          <div className="flex items-center justify-between px-4 pb-3">
            <div className="flex items-center gap-3">
              {/* Examples toggle */}
              <button
                onClick={() => setShowExamples((v) => !v)}
                className="flex items-center gap-1 text-[10px] font-mono text-gray-600 hover:text-purple-400 transition-colors"
              >
                <ChevronDown
                  size={10}
                  className={`transition-transform ${showExamples ? "rotate-180" : ""}`}
                />
                EXAMPLES
              </button>
              <span className="text-[10px] font-mono text-gray-700">
                ⌘+↵ to submit
              </span>
            </div>

            <span
              className={`text-[10px] font-mono ${
                isOverLimit ? "text-red-400" : "text-gray-700"
              }`}
            >
              {charCount}/500
            </span>
          </div>
        </div>

        {/* Example questions dropdown */}
        <AnimatePresence>
          {showExamples && (
            <motion.div
              initial={{ opacity: 0, y: -4, scaleY: 0.95 }}
              animate={{ opacity: 1, y: 0, scaleY: 1 }}
              exit={{ opacity: 0, y: -4, scaleY: 0.95 }}
              className="absolute top-full left-0 right-0 z-20 mt-1 bg-[#0d0d18] border border-purple-900/40 rounded-lg overflow-hidden shadow-2xl"
            >
              {(EXAMPLE_QUESTIONS[category] || EXAMPLE_QUESTIONS["General"]).map(
                (q, i) => (
                  <button
                    key={i}
                    onClick={() => handleExample(q)}
                    className="w-full text-left px-4 py-3 text-xs text-gray-400 hover:text-white hover:bg-purple-900/20 font-mono border-b border-purple-900/20 last:border-0 transition-colors"
                  >
                    <span className="text-purple-600 mr-2">›</span>
                    {q}
                  </button>
                )
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Error message */}
      <AnimatePresence>
        {displayError && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="text-xs font-mono text-red-400 px-1"
          >
            ✗ {displayError}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Submit button */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        onClick={handleSubmit}
        disabled={isLoading || isOverLimit || !question.trim()}
        className="w-full flex items-center justify-center gap-2.5 py-3.5 bg-gradient-to-r from-purple-700 to-purple-600 hover:from-purple-600 hover:to-purple-500 disabled:from-gray-800 disabled:to-gray-800 disabled:text-gray-600 text-white font-mono text-sm tracking-widest uppercase rounded-lg transition-all border border-purple-500/20 disabled:border-gray-700/20 shadow-lg shadow-purple-900/20"
      >
        <Sparkles size={14} className="text-amber-400" />
        {isLoading ? "Oracle is thinking..." : "Consult the Oracle"}
      </motion.button>

      {/* Category description */}
      <p className="text-center text-[10px] font-mono text-gray-700">
        {CATEGORY_DESCRIPTIONS[category]}
      </p>
    </div>
  );
}
