// app/page.tsx
"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { useOracle } from "@/hooks/useOracle";
import { useRitualVault } from "@/hooks/useRitualVault";
import type { PredictionRecord, MarketCategory } from "@/types";

const MarketTicker    = dynamic(() => import("@/components/MarketTicker"),        { ssr: false });
const Navbar          = dynamic(() => import("@/components/Navbar"),               { ssr: false });
const PredictionInput = dynamic(() => import("@/components/PredictionInput"),     { ssr: false });
const OracleResult    = dynamic(() => import("@/components/OracleResult"),        { ssr: false });
const LoadingOracle   = dynamic(() => import("@/components/LoadingOracle"),       { ssr: false });
const OracleDashboard = dynamic(() => import("@/components/OracleDashboard"),    { ssr: false });
const VerifyPrediction= dynamic(() => import("@/components/VerifyPrediction"),   { ssr: false });
const TradingDashboard= dynamic(() => import("@/components/TradingDashboard"),   { ssr: false });

export default function Home() {
  const [activeTab, setActiveTab] = useState<string>("oracle");

  const { predictions, activePrediction, isAnalyzing, error, analyze, updatePrediction, setActivePrediction, clearError } = useOracle();
  const { storePrediction, isLoading: isStoring } = useRitualVault();

  const handleSubmit = useCallback(async (question: string, category: MarketCategory) => {
    const record = await analyze(question, category);
    if (record) setActiveTab("oracle");
  }, [analyze]);

  const handleStoreOnChain = useCallback(async () => {
    if (!activePrediction) return;
    updatePrediction(activePrediction.id, { status: "storing" });
    const result = await storePrediction({
      question: activePrediction.analysis.question,
      outcome: activePrediction.analysis.outcome,
      confidence: activePrediction.analysis.confidence,
      reasoning: activePrediction.analysis.reasoning,
      category: activePrediction.analysis.category,
    });
    if (result.success && result.txHash) {
      updatePrediction(activePrediction.id, { status: "confirmed", txHash: result.txHash, blockNumber: result.blockNumber, onChainId: result.onChainId, chainId: 1979 });
    } else {
      updatePrediction(activePrediction.id, { status: "failed" });
    }
  }, [activePrediction, storePrediction, updatePrediction]);

  const handleSelectPrediction = useCallback((record: PredictionRecord) => {
    setActivePrediction(record);
    setActiveTab("oracle");
  }, [setActivePrediction]);

  return (
    <div className="min-h-screen bg-[#050508] flex flex-col relative overflow-hidden">

      <style>{`
        @keyframes lightning { 0%,93%,96%,100%{opacity:0} 94%{opacity:0.12} 97%{opacity:0.18} }
        .lightning-flash { animation: lightning 9s infinite; }
        .bg-grid {
          background-image: linear-gradient(rgba(109,40,217,0.04) 1px,transparent 1px),
                            linear-gradient(90deg,rgba(109,40,217,0.04) 1px,transparent 1px);
          background-size: 40px 40px;
        }
        .ritual-bg {
          filter: grayscale(100%) brightness(30%) contrast(160%);
          mix-blend-mode: screen;
        }
      `}</style>

      {/* ── Background layer ─────────────────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none z-0 bg-grid">
        <div className="absolute inset-0 bg-blue-100 lightning-flash" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="w-[700px] h-[700px] bg-contain bg-center bg-no-repeat animate-[spin_60s_linear_infinite] ritual-bg opacity-30"
            style={{ backgroundImage: "url('/ritual.jpg')" }}
          />
        </div>
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-900/8 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-amber-900/6 rounded-full blur-3xl" />
      </div>

      {/* ── Content ──────────────────────────────────────────────────── */}
      <div className="relative z-10 flex flex-col flex-1">
        <MarketTicker />
        <Navbar activeTab={activeTab} onTabChange={setActiveTab} />

        <main className="flex-1">
          <div className="max-w-7xl mx-auto px-4 py-8 space-y-10">

            {/* ── Oracle Tab ─────────────────────────────────────────── */}
            {activeTab === "oracle" && (
              <div className="space-y-10">

                {/* Trading Terminal — always visible at top */}
                <section>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-[10px] font-mono text-gray-600 tracking-widest uppercase">Market Oracle Terminal</span>
                    <div className="flex-1 h-px bg-purple-900/20" />
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[9px] font-mono text-emerald-600">LIVE SIM</span>
                  </div>
                  <TradingDashboard />
                </section>

                {/* Divider */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-purple-900/20" />
                  <span className="text-[10px] font-mono text-gray-700 tracking-widest uppercase px-2">AI Prediction Oracle</span>
                  <div className="flex-1 h-px bg-purple-900/20" />
                </div>

                {/* Prediction form / result */}
                {!isAnalyzing && !activePrediction && (
                  <PredictionInput onSubmit={handleSubmit} isLoading={isAnalyzing} error={error} />
                )}
                {isAnalyzing && <LoadingOracle />}
                {!isAnalyzing && activePrediction && (
                  <div className="space-y-4">
                    <button
                      onClick={() => { setActivePrediction(null); clearError(); }}
                      className="text-xs font-mono text-gray-600 hover:text-gray-400 flex items-center gap-1 transition-colors"
                    >
                      ← New Prediction
                    </button>
                    <OracleResult record={activePrediction} onStoreOnChain={handleStoreOnChain}
                      isStoring={isStoring || activePrediction.status === "storing"} />
                  </div>
                )}
              </div>
            )}

            {activeTab === "dashboard" && (
              <OracleDashboard predictions={predictions} onSelectPrediction={handleSelectPrediction} onTabChange={setActiveTab} />
            )}
            {activeTab === "verify" && <VerifyPrediction />}
          </div>
        </main>

        <footer className="border-t border-purple-900/20 bg-black/40 backdrop-blur-sm py-4">
          <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
            <span className="text-[10px] font-mono text-gray-700">⬡ Ritual Will Oracle — Testnet</span>
            <div className="flex items-center gap-4">
              <span className="text-[10px] font-mono text-gray-700">Chain ID: 1979</span>
              <span className="text-[10px] font-mono text-gray-700">Powered by Groq × llama-3.3-70b</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
