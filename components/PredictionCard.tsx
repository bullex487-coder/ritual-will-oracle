// components/PredictionCard.tsx
// Compact card displayed in the Oracle Dashboard list.
// Shows summary of each stored/pending prediction.

"use client";

import { motion } from "framer-motion";
import { ExternalLink, Clock } from "lucide-react";
import type { PredictionRecord } from "@/types";
import {
  outcomeBg,
  outcomeColor,
  confidenceColor,
  categoryIcon,
  shortHash,
  formatDate,
} from "@/lib/helpers";
import { RITUAL_CHAIN } from "@/lib/ritual";

interface PredictionCardProps {
  record: PredictionRecord;
  index: number;
  onClick: (record: PredictionRecord) => void;
}

export default function PredictionCard({
  record,
  index,
  onClick,
}: PredictionCardProps) {
  const { analysis } = record;
  const isConfirmed = record.status === "confirmed";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={() => onClick(record)}
      className="group p-4 bg-[#080810] hover:bg-[#0e0e1c] border border-purple-900/20 hover:border-purple-700/40 rounded-lg cursor-pointer transition-all"
    >
      {/* Top row: category + outcome + confidence */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-sm flex-shrink-0">{categoryIcon(analysis.category)}</span>
          <p className="text-xs font-mono text-gray-500 uppercase tracking-wide flex-shrink-0">
            {analysis.category}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Confidence bar */}
          <div className="flex items-center gap-1.5">
            <div className="w-16 h-1 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${analysis.confidence}%`,
                  backgroundColor: confidenceColor(analysis.confidence),
                }}
              />
            </div>
            <span
              className="text-[10px] font-mono font-bold"
              style={{ color: confidenceColor(analysis.confidence) }}
            >
              {analysis.confidence}%
            </span>
          </div>

          {/* Outcome badge */}
          <span
            className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${outcomeBg(
              analysis.outcome
            )}`}
          >
            {analysis.outcome}
          </span>
        </div>
      </div>

      {/* Question */}
      <p className="text-sm text-gray-300 group-hover:text-white leading-snug mb-3 line-clamp-2 transition-colors">
        {analysis.question}
      </p>

      {/* Bottom row: status + time + tx */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Status pill */}
          <span
            className={`flex items-center gap-1 text-[9px] font-mono tracking-wider px-1.5 py-0.5 rounded ${
              isConfirmed
                ? "text-emerald-400 bg-emerald-400/10"
                : record.status === "storing"
                ? "text-amber-400 bg-amber-400/10"
                : "text-gray-600 bg-gray-700/20"
            }`}
          >
            <span
              className={`w-1 h-1 rounded-full ${
                isConfirmed
                  ? "bg-emerald-400"
                  : record.status === "storing"
                  ? "bg-amber-400 animate-pulse"
                  : "bg-gray-600"
              }`}
            />
            {isConfirmed
              ? "ON-CHAIN"
              : record.status === "storing"
              ? "STORING"
              : "PENDING"}
          </span>

          {/* Time horizon */}
          <span className="text-[9px] font-mono text-gray-700 flex items-center gap-1">
            <Clock size={8} />
            {analysis.timeHorizon.split(" ")[0]}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Timestamp */}
          <span className="text-[9px] font-mono text-gray-700">
            {formatDate(analysis.timestamp)}
          </span>

          {/* Explorer link (if confirmed) */}
          {isConfirmed && record.txHash && (
            <a
              href={`${RITUAL_CHAIN.explorerUrl}/tx/${record.txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-purple-600 hover:text-purple-400 transition-colors"
            >
              <ExternalLink size={10} />
            </a>
          )}

          {/* On-chain ID */}
          {record.onChainId && (
            <span className="text-[9px] font-mono text-purple-700">
              #{record.onChainId}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
