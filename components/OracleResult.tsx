// components/OracleResult.tsx
// Displays the AI oracle's analysis result after a question is submitted.
// Shows outcome, confidence chart, risk factors, and reasoning.

"use client";

import { motion } from "framer-motion";
import {
  RadialBarChart,
  RadialBar,
  ResponsiveContainer,
  PolarAngleAxis,
} from "recharts";
import { AlertTriangle, Clock, TrendingUp, FileText } from "lucide-react";
import type { PredictionRecord } from "@/types";
import {
  outcomeBg,
  outcomeColor,
  confidenceLabel,
  confidenceColor,
  categoryIcon,
  formatDate,
} from "@/lib/helpers";

interface OracleResultProps {
  record: PredictionRecord;
  onStoreOnChain: () => void;
  isStoring: boolean;
}

export default function OracleResult({
  record,
  onStoreOnChain,
  isStoring,
}: OracleResultProps) {
  const { analysis } = record;

  // Data for the radial confidence chart
  const chartData = [
    {
      name: "Confidence",
      value: analysis.confidence,
      fill: confidenceColor(analysis.confidence),
    },
  ];

  const isConfirmed = record.status === "confirmed";
  const isPending = record.status === "pending";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-2xl mx-auto space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">{categoryIcon(analysis.category)}</span>
          <span className="text-xs font-mono text-gray-500 tracking-wider uppercase">
            {analysis.category} · {formatDate(analysis.timestamp)}
          </span>
        </div>
        <span
          className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
            isConfirmed
              ? "bg-emerald-400/10 border-emerald-400/30 text-emerald-400"
              : "bg-amber-400/10 border-amber-400/30 text-amber-400"
          }`}
        >
          {isConfirmed ? "● ON-CHAIN" : "○ PENDING"}
        </span>
      </div>

      {/* Question */}
      <div className="p-4 bg-[#080810] border border-purple-900/30 rounded-lg">
        <p className="text-[10px] font-mono text-gray-600 mb-1.5">QUERY</p>
        <p className="text-white font-medium leading-relaxed">{analysis.question}</p>
      </div>

      {/* Main result: Outcome + Confidence */}
      <div className="grid grid-cols-2 gap-4">
        {/* Outcome */}
        <div className="p-4 bg-[#080810] border border-purple-900/30 rounded-lg flex flex-col items-center justify-center gap-3">
          <p className="text-[10px] font-mono text-gray-600 tracking-wider">
            ORACLE VERDICT
          </p>
          <div
            className={`px-5 py-2 rounded border text-xl font-bold tracking-widest font-mono ${outcomeBg(
              analysis.outcome
            )}`}
          >
            {analysis.outcome}
          </div>
          <p className={`text-xs font-mono ${outcomeColor(analysis.outcome)}`}>
            {confidenceLabel(analysis.confidence)}
          </p>
        </div>

        {/* Confidence radial chart */}
        <div className="p-4 bg-[#080810] border border-purple-900/30 rounded-lg flex flex-col items-center justify-center gap-1">
          <p className="text-[10px] font-mono text-gray-600 tracking-wider">
            CONFIDENCE
          </p>
          <div className="relative w-28 h-28">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart
                cx="50%"
                cy="50%"
                innerRadius="65%"
                outerRadius="100%"
                startAngle={90}
                endAngle={-270}
                data={chartData}
              >
                <PolarAngleAxis
                  type="number"
                  domain={[0, 100]}
                  angleAxisId={0}
                  tick={false}
                />
                <RadialBar
                  dataKey="value"
                  cornerRadius={4}
                  background={{ fill: "#1a1a2e" }}
                />
              </RadialBarChart>
            </ResponsiveContainer>
            {/* Center label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span
                className="text-2xl font-bold font-mono"
                style={{ color: confidenceColor(analysis.confidence) }}
              >
                {analysis.confidence}
              </span>
              <span className="text-[9px] font-mono text-gray-600">/ 100</span>
            </div>
          </div>
        </div>
      </div>

      {/* Time Horizon */}
      <div className="p-3 bg-[#080810] border border-purple-900/30 rounded-lg flex items-center gap-3">
        <Clock size={14} className="text-purple-400 flex-shrink-0" />
        <div>
          <p className="text-[10px] font-mono text-gray-600">TIME HORIZON</p>
          <p className="text-sm font-mono text-white">{analysis.timeHorizon}</p>
        </div>
      </div>

      {/* Risk Factors */}
      <div className="p-4 bg-[#080810] border border-purple-900/30 rounded-lg space-y-2">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle size={13} className="text-amber-400" />
          <p className="text-[10px] font-mono text-gray-500 tracking-wider">
            RISK FACTORS
          </p>
        </div>
        {analysis.riskFactors.map((risk, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 }}
            className="flex items-start gap-2"
          >
            <span className="text-amber-400/60 font-mono text-xs mt-0.5">
              [{String(i + 1).padStart(2, "0")}]
            </span>
            <span className="text-sm text-gray-300 font-mono">{risk}</span>
          </motion.div>
        ))}
      </div>

      {/* AI Reasoning */}
      <div className="p-4 bg-[#080810] border border-purple-900/30 rounded-lg space-y-2">
        <div className="flex items-center gap-2 mb-2">
          <FileText size={13} className="text-purple-400" />
          <p className="text-[10px] font-mono text-gray-500 tracking-wider">
            ORACLE REASONING
          </p>
        </div>
        <p className="text-sm text-gray-300 leading-relaxed font-mono">
          {analysis.reasoning}
        </p>
      </div>

      {/* On-chain storage section */}
      {!isConfirmed && (
        <div className="p-4 bg-gradient-to-r from-purple-900/20 to-amber-900/10 border border-purple-700/30 rounded-lg space-y-3">
          <div className="flex items-center gap-2">
            <TrendingUp size={13} className="text-amber-400" />
            <p className="text-xs font-mono text-amber-400/80 tracking-wider">
              SEAL TO RITUAL BLOCKCHAIN
            </p>
          </div>
          <p className="text-xs text-gray-500 font-mono leading-relaxed">
            Store this prediction permanently on Ritual Testnet. The oracle record
            becomes a verifiable, immutable proof — anyone can verify it by tx hash.
          </p>
          <button
            onClick={onStoreOnChain}
            disabled={isStoring}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-amber-500/10 hover:bg-amber-500/20 disabled:bg-gray-800/40 border border-amber-500/30 disabled:border-gray-700/20 rounded text-xs font-mono text-amber-400 disabled:text-gray-600 tracking-widest uppercase transition-all"
          >
            {isStoring ? (
              <>
                <span className="w-2 h-2 rounded-full border border-amber-400 border-t-transparent animate-spin" />
                Sealing to chain...
              </>
            ) : (
              <>⬡ Seal Prediction On-Chain</>
            )}
          </button>
        </div>
      )}

      {/* Confirmed: show tx hash */}
      {isConfirmed && record.txHash && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-4 bg-emerald-900/10 border border-emerald-500/20 rounded-lg space-y-2"
        >
          <p className="text-[10px] font-mono text-emerald-400 tracking-wider">
            ✓ SEALED ON RITUAL TESTNET
          </p>
          <div className="flex items-center gap-2">
            <p className="text-[10px] font-mono text-gray-600">TX HASH</p>
            <a
              href={`https://explorer.ritualfoundation.org/tx/${record.txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-mono text-emerald-400 hover:text-emerald-300 underline break-all"
            >
              {record.txHash}
            </a>
          </div>
          {record.onChainId && (
            <p className="text-[10px] font-mono text-gray-600">
              ON-CHAIN ID:{" "}
              <span className="text-white">#{record.onChainId}</span>
            </p>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}
