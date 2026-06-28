// components/MarketTicker.tsx
// Horizontal scrolling ticker bar at the top — Bloomberg terminal style.
// Shows live-looking market data and oracle stats.

"use client";

import { useEffect, useState } from "react";
import { MOCK_TICKER } from "@/lib/mockData";
import type { TickerItem } from "@/types";

export default function MarketTicker() {
  const [tickers, setTickers] = useState<TickerItem[]>(MOCK_TICKER);

  // Simulate small price fluctuations every few seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setTickers((prev) =>
        prev.map((t) => {
          if (t.change === "neutral") return t;
          // Randomly nudge numeric values slightly
          const numMatch = t.value.match(/([\$]?)([\d,]+\.?\d*)/);
          if (!numMatch) return t;
          return t; // keep stable for UX clarity
        })
      );
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Duplicate for seamless infinite scroll
  const doubled = [...tickers, ...tickers];

  return (
    <div className="w-full bg-black border-b border-purple-900/40 overflow-hidden">
      <div className="flex items-center">
        {/* Static label */}
        <div className="flex-shrink-0 px-3 py-1.5 bg-purple-900/60 border-r border-purple-700/40">
          <span className="text-[10px] font-mono font-bold text-purple-300 tracking-widest uppercase">
            ORACLE FEED
          </span>
        </div>

        {/* Scrolling ticker */}
        <div className="flex-1 overflow-hidden relative">
          <div className="flex animate-ticker whitespace-nowrap">
            {doubled.map((item, i) => (
              <TickerCell key={i} item={item} />
            ))}
          </div>
        </div>

        {/* Live indicator */}
        <div className="flex-shrink-0 px-3 py-1.5 border-l border-purple-900/40 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] font-mono text-emerald-400 tracking-wider">
            LIVE
          </span>
        </div>
      </div>
    </div>
  );
}

function TickerCell({ item }: { item: TickerItem }) {
  const changeColor =
    item.change === "up"
      ? "text-emerald-400"
      : item.change === "down"
      ? "text-red-400"
      : "text-gray-400";

  const arrow =
    item.change === "up" ? "▲" : item.change === "down" ? "▼" : "◆";

  return (
    <span className="inline-flex items-center gap-1.5 px-4 py-1.5 border-r border-purple-900/20">
      <span className="text-[10px] font-mono text-gray-500 tracking-wider">
        {item.label}
      </span>
      <span className={`text-[10px] font-mono font-bold ${changeColor}`}>
        {item.value}
      </span>
      <span className={`text-[8px] ${changeColor}`}>{arrow}</span>
    </span>
  );
}
