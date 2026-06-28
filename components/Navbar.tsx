// components/Navbar.tsx
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wifi, WifiOff, ChevronDown, ExternalLink } from "lucide-react";
import { useRitualVault } from "@/hooks/useRitualVault";
import { shortAddress } from "@/lib/helpers";
import { RITUAL_CHAIN } from "@/lib/ritual";

interface NavbarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const TABS = [
  { id: "oracle",    label: "Oracle"    },
  { id: "dashboard", label: "Dashboard" },
  { id: "verify",    label: "Verify"    },
];

// ─── Ritual Logo — berputar menyamping secara konsisten ────────────────────────
function RitualLogo() {
  return (
    <div className="relative w-8 h-8 flex-shrink-0" style={{ perspective: "400px" }}>
      <motion.div
        className="w-full h-full relative"
        style={{ transformStyle: "preserve-3d" }}
        animate={{ rotateY: [0, 360] }}
        transition={{ 
          duration: 6, 
          repeat: Infinity, 
          ease: "linear" 
        }}
      >
        {/* Face */}
        <div className="absolute inset-0 rounded-sm overflow-hidden border border-purple-700/40">
          <img
            src="/ritual.jpg"
            alt="Ritual"
            className="w-full h-full object-cover"
            style={{
              filter: "grayscale(10%) brightness(0.95) contrast(1.1)",
            }}
          />
        </div>
      </motion.div>
    </div>
  );
}

// ─── Main Navbar ──────────────────────────────────────────────────────────────
export default function Navbar({ activeTab, onTabChange }: NavbarProps) {
  const { wallet, isLoading, connect, switchNetwork } = useRitualVault();
  const [showWalletMenu, setShowWalletMenu] = useState(false);

  const handleWalletClick = async () => {
    if (!wallet.isConnected) await connect();
    else setShowWalletMenu(v => !v);
  };

  return (
    <nav className="w-full border-b border-purple-900/30 bg-black/70 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-14">

        {/* ── Logo + Brand ── */}
        <div className="flex items-center gap-2.5">
          <RitualLogo />
          <div className="flex flex-col leading-tight">
            <span className="text-xs font-bold tracking-[0.2em] text-white uppercase">
              Ritual Will
            </span>
            <span className="text-[9px] tracking-[0.3em] text-purple-400 uppercase">
              Oracle
            </span>
          </div>
        </div>

        {/* ── Nav tabs (desktop) ── */}
        <div className="hidden sm:flex items-center gap-1">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`px-4 py-1.5 text-xs font-mono tracking-wider transition-all rounded-sm ${
                activeTab === tab.id
                  ? "text-amber-400 bg-amber-400/10 border border-amber-400/20"
                  : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
              }`}
            >
              {tab.label.toUpperCase()}
            </button>
          ))}
        </div>

        {/* ── Wallet button ── */}
        <div className="relative">
          {!wallet.isConnected ? (
            <button
              onClick={handleWalletClick}
              disabled={isLoading}
              className="flex items-center gap-2 px-3 py-1.5 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 hover:border-purple-400/50 rounded text-xs font-mono text-purple-300 hover:text-purple-200 transition-all disabled:opacity-50"
            >
              <WifiOff size={11} />
              {isLoading ? "Connecting..." : "Connect Wallet"}
            </button>
          ) : !wallet.isCorrectNetwork ? (
            <button
              onClick={switchNetwork}
              disabled={isLoading}
              className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded text-xs font-mono text-amber-400 transition-all disabled:opacity-50"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              Switch to Ritual
            </button>
          ) : (
            <button
              onClick={() => setShowWalletMenu(v => !v)}
              className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded text-xs font-mono text-emerald-400 transition-all"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {shortAddress(wallet.address!)}
              <ChevronDown size={10} />
            </button>
          )}

          {/* Wallet dropdown */}
          <AnimatePresence>
            {showWalletMenu && wallet.isConnected && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="absolute right-0 top-10 w-56 bg-[#0d0d14] border border-purple-900/50 rounded-lg shadow-2xl shadow-purple-900/20 overflow-hidden z-50"
              >
                <div className="p-3 border-b border-purple-900/30">
                  <p className="text-[10px] text-gray-500 font-mono mb-1">CONNECTED WALLET</p>
                  <p className="text-xs font-mono text-white break-all">{wallet.address}</p>
                </div>
                <div className="p-3 border-b border-purple-900/30">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-gray-500 font-mono">BALANCE</span>
                    <span className="text-xs font-mono text-amber-400">{wallet.balance} RITUAL</span>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-[10px] text-gray-500 font-mono">NETWORK</span>
                    <span className="text-xs font-mono text-emerald-400">Ritual Testnet</span>
                  </div>
                </div>
                <a
                  href={`${RITUAL_CHAIN.explorerUrl}/address/${wallet.address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-3 text-xs text-gray-400 hover:text-white hover:bg-white/5 transition-all font-mono"
                  onClick={() => setShowWalletMenu(false)}
                >
                  <ExternalLink size={11} />
                  View on Explorer
                </a>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Mobile tabs ── */}
      <div className="sm:hidden flex border-t border-purple-900/30">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex-1 py-2 text-[10px] font-mono tracking-wider transition-all ${
              activeTab === tab.id
                ? "text-amber-400 bg-amber-400/5 border-b border-amber-400"
                : "text-gray-500"
            }`}
          >
            {tab.label.toUpperCase()}
          </button>
        ))}
      </div>
    </nav>
  );
}