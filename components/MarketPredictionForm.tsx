// components/MarketPredictionForm.tsx

"use client";

import { useState } from "react";
import { TrendingUp, TrendingDown, Crosshair, Clock, Zap } from "lucide-react";
import type { MarketCategory } from "@/types";

interface MarketPredictionFormProps {
  onSubmit: (question: string, category: MarketCategory) => void;
  isLoading: boolean;
}

const ASSETS = ["BTC", "ETH", "SOL", "RITUAL"];
const TIMEFRAMES = ["24 Hours", "7 Days", "End of Month"];

export default function MarketPredictionForm({ onSubmit, isLoading }: MarketPredictionFormProps) {
  const [asset, setAsset] = useState("RITUAL");
  const [condition, setCondition] = useState<"ABOVE" | "BELOW">("ABOVE");
  const [targetPrice, setTargetPrice] = useState("");
  const [timeframe, setTimeframe] = useState("24 Hours");

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetPrice) return;

    // Merangkai prompt pertanyaan untuk AI
    const question = `Will the price of ${asset} close ${condition} $${targetPrice} within the next ${timeframe}?`;
    
    // Asumsi category untuk market adalah "crypto" atau "finance"
    onSubmit(question, "crypto" as MarketCategory); 
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-black/60 border border-purple-900/40 rounded-xl backdrop-blur-md shadow-2xl shadow-purple-900/20">
      <div className="flex items-center gap-2 mb-6 border-b border-white/5 pb-4">
        <Zap className="text-amber-400" size={20} />
        <h2 className="text-lg font-mono text-white tracking-widest uppercase">Market Oracle Terminal</h2>
      </div>

      <form onSubmit={handleGenerate} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Asset Selection */}
          <div className="space-y-2">
            <label className="text-xs font-mono text-gray-400 uppercase">Select Asset</label>
            <div className="flex gap-2">
              {ASSETS.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setAsset(a)}
                  className={`flex-1 py-2 text-xs font-mono rounded border transition-all ${
                    asset === a 
                      ? "bg-purple-600/20 border-purple-500 text-white" 
                      : "bg-white/5 border-white/10 text-gray-500 hover:text-gray-300"
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>

          {/* Timeframe Selection */}
          <div className="space-y-2">
            <label className="text-xs font-mono text-gray-400 uppercase flex items-center gap-1">
              <Clock size={12} /> Timeframe
            </label>
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded p-2.5 text-sm font-mono text-white focus:outline-none focus:border-purple-500"
            >
              {TIMEFRAMES.map((t) => (
                <option key={t} value={t} className="bg-gray-900">{t}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Price Target Condition */}
        <div className="space-y-2">
          <label className="text-xs font-mono text-gray-400 uppercase flex items-center gap-1">
            <Crosshair size={12} /> Target Price (USD)
          </label>
          <div className="flex bg-white/5 border border-white/10 rounded overflow-hidden p-1">
            <button
              type="button"
              onClick={() => setCondition("ABOVE")}
              className={`flex items-center justify-center gap-1 px-4 py-2 text-xs font-mono rounded w-1/3 transition-all ${
                condition === "ABOVE" ? "bg-emerald-500/20 text-emerald-400" : "text-gray-500 hover:text-gray-300"
              }`}
            >
              <TrendingUp size={14} /> ABOVE
            </button>
            <button
              type="button"
              onClick={() => setCondition("BELOW")}
              className={`flex items-center justify-center gap-1 px-4 py-2 text-xs font-mono rounded w-1/3 transition-all ${
                condition === "BELOW" ? "bg-red-500/20 text-red-400" : "text-gray-500 hover:text-gray-300"
              }`}
            >
              <TrendingDown size={14} /> BELOW
            </button>
            <div className="relative w-1/3 flex items-center">
              <span className="absolute left-3 text-gray-500">$</span>
              <input
                type="number"
                placeholder="0.00"
                value={targetPrice}
                onChange={(e) => setTargetPrice(e.target.value)}
                className="w-full bg-transparent pl-7 pr-3 py-2 text-sm font-mono text-white focus:outline-none placeholder:text-gray-700"
                required
              />
            </div>
          </div>
        </div>

        {/* Dynamic Question Preview */}
        <div className="p-4 bg-black/40 border border-purple-900/30 rounded-lg">
          <p className="text-[10px] text-gray-500 font-mono mb-1">PROMPT PREVIEW:</p>
          <p className="text-sm font-mono text-purple-200">
            "Will the price of <span className="text-white font-bold">{asset}</span> close <span className={condition === "ABOVE" ? "text-emerald-400" : "text-red-400"}>{condition}</span> <span className="text-white font-bold">${targetPrice || "0.00"}</span> within the next <span className="text-white">{timeframe}</span>?"
          </p>
        </div>

        <button
          type="submit"
          disabled={isLoading || !targetPrice}
          className="w-full py-3 bg-gradient-to-r from-purple-900 to-black hover:from-purple-800 hover:to-gray-900 border border-purple-500/50 rounded font-mono text-sm text-white tracking-widest uppercase transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <span className="animate-pulse">Consulting Oracle...</span>
          ) : (
            <>Request AI Signal</>
          )}
        </button>
      </form>
    </div>
  );
}