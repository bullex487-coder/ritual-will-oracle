// components/OracleDashboard.tsx
// Dashboard showing all stored predictions with stats overview.
// Includes category filter and summary metrics.

"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  Cell,
} from "recharts";
import { Database, Filter, TrendingUp } from "lucide-react";
import type { PredictionRecord, MarketCategory } from "@/types";
import PredictionCard from "./PredictionCard";
import { MOCK_PREDICTIONS } from "@/lib/mockData";
import { confidenceColor, categoryIcon } from "@/lib/helpers";

const ALL_CATEGORIES = ["All", "Crypto", "Politics", "Tech", "Sports", "General"];

interface OracleDashboardProps {
  predictions: PredictionRecord[];
  onSelectPrediction: (record: PredictionRecord) => void;
  onTabChange?: (tab: string) => void;
}

export default function OracleDashboard({
  predictions,
  onSelectPrediction,
  onTabChange,
}: OracleDashboardProps) {
  const [filter, setFilter] = useState<string>("All");

  // Combine user predictions + mock data (deduplicated by id)
  const allPredictions = useMemo(() => {
    const userIds = new Set(predictions.map((p) => p.id));
    const mocks = MOCK_PREDICTIONS.filter((m) => !userIds.has(m.id));
    return [...predictions, ...mocks];
  }, [predictions]);

  // Apply category filter
  const filtered = useMemo(() => {
    if (filter === "All") return allPredictions;
    return allPredictions.filter((p) => p.analysis.category === filter);
  }, [allPredictions, filter]);

  // Stats
  const stats = useMemo(() => {
    const total = allPredictions.length;
    const confirmed = allPredictions.filter((p) => p.status === "confirmed").length;
    const avgConf =
      total > 0
        ? Math.round(
            allPredictions.reduce((sum, p) => sum + p.analysis.confidence, 0) / total
          )
        : 0;
    const yesCount = allPredictions.filter((p) => p.analysis.outcome === "YES").length;
    const noCount = allPredictions.filter((p) => p.analysis.outcome === "NO").length;

    return { total, confirmed, avgConf, yesCount, noCount };
  }, [allPredictions]);

  // Chart data: outcome distribution
  const outcomeData = [
    { name: "YES", value: stats.yesCount, color: "#10b981" },
    { name: "NO", value: stats.noCount, color: "#ef4444" },
    {
      name: "UNCERTAIN",
      value: allPredictions.filter((p) => p.analysis.outcome === "UNCERTAIN").length,
      color: "#f59e0b",
    },
  ];

  // Category breakdown
  const categoryData = useMemo(() => {
    const cats: Record<string, number> = {};
    allPredictions.forEach((p) => {
      cats[p.analysis.category] = (cats[p.analysis.category] || 0) + 1;
    });
    return Object.entries(cats).map(([name, value]) => ({ name, value }));
  }, [allPredictions]);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Title */}
      <div className="flex items-center gap-3">
        <Database size={16} className="text-purple-400" />
        <h2 className="text-sm font-mono text-gray-300 tracking-wider uppercase">
          Oracle Dashboard
        </h2>
        <span className="text-xs font-mono text-gray-700">
          — {stats.total} total predictions
        </span>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Predictions", value: stats.total, color: "text-white" },
          { label: "Sealed On-Chain", value: stats.confirmed, color: "text-emerald-400" },
          { label: "Avg Confidence", value: `${stats.avgConf}%`, color: "text-amber-400" },
          {
            label: "YES / NO Ratio",
            value: `${stats.yesCount}/${stats.noCount}`,
            color: "text-purple-400",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="p-3 bg-[#080810] border border-purple-900/20 rounded-lg"
          >
            <p className="text-[9px] font-mono text-gray-600 tracking-wider mb-1">
              {stat.label.toUpperCase()}
            </p>
            <p className={`text-xl font-bold font-mono ${stat.color}`}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Outcome distribution */}
        <div className="p-4 bg-[#080810] border border-purple-900/20 rounded-lg">
          <p className="text-[10px] font-mono text-gray-600 tracking-wider mb-3">
            OUTCOME DISTRIBUTION
          </p>
          <ResponsiveContainer width="100%" height={80}>
            <BarChart data={outcomeData} barSize={28}>
              <XAxis
                dataKey="name"
                tick={{ fontSize: 9, fontFamily: "monospace", fill: "#6b7280" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis hide />
              <Tooltip
                contentStyle={{
                  background: "#0d0d18",
                  border: "1px solid #4c1d95",
                  borderRadius: 4,
                  fontSize: 10,
                  fontFamily: "monospace",
                }}
              />
              <Bar dataKey="value" radius={[2, 2, 0, 0]}>
                {outcomeData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Category breakdown */}
        <div className="p-4 bg-[#080810] border border-purple-900/20 rounded-lg">
          <p className="text-[10px] font-mono text-gray-600 tracking-wider mb-3">
            BY CATEGORY
          </p>
          <div className="space-y-2">
            {categoryData.map((cat) => (
              <div key={cat.name} className="flex items-center gap-2">
                <span className="text-sm w-4">{categoryIcon(cat.name as MarketCategory)}</span>
                <span className="text-[10px] font-mono text-gray-500 w-16">
                  {cat.name}
                </span>
                <div className="flex-1 h-1 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-600 rounded-full"
                    style={{
                      width: `${(cat.value / (stats.total || 1)) * 100}%`,
                    }}
                  />
                </div>
                <span className="text-[10px] font-mono text-gray-600 w-4">
                  {cat.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter size={11} className="text-gray-700" />
        {ALL_CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-3 py-1 text-[10px] font-mono tracking-wider rounded border transition-all ${
              filter === cat
                ? "bg-purple-600/20 border-purple-500/40 text-purple-300"
                : "border-gray-800 text-gray-600 hover:border-gray-700 hover:text-gray-400"
            }`}
          >
            {cat.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Predictions list */}
      <div className="space-y-2">
        <AnimatePresence>
          {filtered.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-16 gap-3"
            >
              <TrendingUp size={24} className="text-gray-700" />
              <p className="text-sm font-mono text-gray-600">
                No predictions in {filter} yet.
              </p>
              {onTabChange && (
                <button
                  onClick={() => onTabChange("oracle")}
                  className="text-xs font-mono text-purple-500 hover:text-purple-400 underline"
                >
                  Ask the Oracle →
                </button>
              )}
            </motion.div>
          ) : (
            filtered.map((record, i) => (
              <PredictionCard
                key={record.id}
                record={record}
                index={i}
                onClick={onSelectPrediction}
              />
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
