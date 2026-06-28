// components/LoadingOracle.tsx
// Animated loading screen shown while the AI oracle is analyzing a question.
// Gives it that mystical "consulting the oracle" feel.

"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const ORACLE_MESSAGES = [
  "Consulting the oracle nodes...",
  "Parsing probabilistic futures...",
  "Scanning market signals...",
  "Running inference on Ritual network...",
  "Computing confidence intervals...",
  "Sealing prediction to chain...",
];

export default function LoadingOracle() {
  const [msgIdx, setMsgIdx] = useState(0);
  const [dots, setDots] = useState(".");

  // Cycle through oracle messages
  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIdx((i) => (i + 1) % ORACLE_MESSAGES.length);
    }, 1400);
    return () => clearInterval(interval);
  }, []);

  // Animate dots
  useEffect(() => {
    const interval = setInterval(() => {
      setDots((d) => (d.length >= 3 ? "." : d + "."));
    }, 400);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-16 gap-8">
      {/* Hexagonal pulse animation */}
      <div className="relative w-24 h-24 flex items-center justify-center">
        {/* Outer rings */}
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="absolute border border-purple-500/30 rounded-full"
            style={{ width: 96 + i * 28, height: 96 + i * 28 }}
            animate={{ scale: [1, 1.08, 1], opacity: [0.4, 0.15, 0.4] }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.4,
              ease: "easeInOut",
            }}
          />
        ))}

        {/* Center hexagon */}
        <motion.div
          className="w-16 h-16 relative flex items-center justify-center"
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        >
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <polygon
              points="50,5 95,27.5 95,72.5 50,95 5,72.5 5,27.5"
              fill="none"
              stroke="url(#hexGrad)"
              strokeWidth="2"
            />
            <defs>
              <linearGradient id="hexGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#7c3aed" />
                <stop offset="100%" stopColor="#d97706" />
              </linearGradient>
            </defs>
          </svg>
        </motion.div>

        {/* Inner dot */}
        <motion.div
          className="absolute w-3 h-3 rounded-full bg-amber-400"
          animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* Message */}
      <div className="text-center space-y-2">
        <AnimatePresence mode="wait">
          <motion.p
            key={msgIdx}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="text-sm font-mono text-purple-300 tracking-wider"
          >
            {ORACLE_MESSAGES[msgIdx]}
            <span className="text-amber-400">{dots}</span>
          </motion.p>
        </AnimatePresence>

        <p className="text-xs font-mono text-gray-600">
          Powered by llama-3.3-70b on Groq × Ritual Network
        </p>
      </div>

      {/* Progress bar */}
      <div className="w-48 h-0.5 bg-gray-800 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-purple-500 to-amber-400 rounded-full"
          animate={{ x: ["-100%", "100%"] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
    </div>
  );
}
