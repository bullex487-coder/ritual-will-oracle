// components/TradingDashboard.tsx
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp, TrendingDown, Activity, Zap, RefreshCw,
  AlertTriangle, Info, ChevronDown, ArrowUpRight, ArrowDownRight,
  Search, X, Star, Loader2,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
type TF = "5m" | "15m" | "1H" | "4H" | "1D";

interface CoinInfo {
  id: string;
  symbol: string;
  name: string;
  thumb?: string;
  current_price?: number;
  price_change_percentage_24h?: number;
  market_cap?: number;
  total_volume?: number;
  high_24h?: number;
  low_24h?: number;
}

interface Candle {
  time: string; open: number; high: number; low: number; close: number; volume: number;
}

interface Signal {
  action: "STRONG BUY" | "BUY" | "NEUTRAL" | "SELL" | "STRONG SELL";
  confidence: number; rsi: number; macd: number;
  ma20: number; ma50: number; reasons: string[];
}

// ─── Constants ────────────────────────────────────────────────────────────────
const TFS: TF[] = ["5m", "15m", "1H", "4H", "1D"];

const DEFAULT_COINS: CoinInfo[] = [
  { id: "bitcoin",        symbol: "BTC",    name: "Bitcoin" },
  { id: "ethereum",       symbol: "ETH",    name: "Ethereum" },
  { id: "solana",         symbol: "SOL",    name: "Solana" },
  { id: "binancecoin",    symbol: "BNB",    name: "BNB" },
  { id: "ripple",         symbol: "XRP",    name: "XRP" },
  { id: "cardano",        symbol: "ADA",    name: "Cardano" },
  { id: "dogecoin",       symbol: "DOGE",   name: "Dogecoin" },
  { id: "avalanche-2",    symbol: "AVAX",   name: "Avalanche" },
];

// CoinGecko public API (no key needed, rate limit 30 req/min)
const CG = "https://api.coingecko.com/api/v3";

// ─── CoinGecko Helpers ────────────────────────────────────────────────────────
async function fetchCoinPrice(id: string): Promise<CoinInfo | null> {
  try {
    const res = await fetch(
      `${CG}/coins/markets?vs_currency=usd&ids=${id}&order=market_cap_desc&per_page=1&page=1&sparkline=false&price_change_percentage=24h`,
      { next: { revalidate: 30 } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (!data[0]) return null;
    const d = data[0];
    return {
      id: d.id,
      symbol: d.symbol.toUpperCase(),
      name: d.name,
      thumb: d.image,
      current_price: d.current_price,
      price_change_percentage_24h: d.price_change_percentage_24h,
      market_cap: d.market_cap,
      total_volume: d.total_volume,
      high_24h: d.high_24h,
      low_24h: d.low_24h,
    };
  } catch { return null; }
}

async function searchCoins(query: string): Promise<CoinInfo[]> {
  try {
    const res = await fetch(`${CG}/search?query=${encodeURIComponent(query)}`);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.coins ?? []).slice(0, 8).map((c: { id: string; symbol: string; name: string; thumb?: string }) => ({
      id: c.id,
      symbol: c.symbol.toUpperCase(),
      name: c.name,
      thumb: c.thumb,
    }));
  } catch { return []; }
}

// Fetch OHLC from CoinGecko (days param: 1=hourly, 7/14/30=daily)
async function fetchOHLC(id: string, tf: TF): Promise<Candle[]> {
  const days = tf === "5m" || tf === "15m" ? 1 : tf === "1H" ? 2 : tf === "4H" ? 7 : 30;
  try {
    const res = await fetch(`${CG}/coins/${id}/ohlc?vs_currency=usd&days=${days}`);
    if (!res.ok) throw new Error("OHLC fetch failed");
    const raw: [number, number, number, number, number][] = await res.json();

    // CoinGecko returns [timestamp, open, high, low, close]
    return raw.map(([ts, o, h, l, c]) => {
      const d = new Date(ts);
      const time =
        tf === "1D"
          ? d.toLocaleDateString("en", { month: "short", day: "numeric" })
          : d.toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" });
      return { time, open: o, high: h, low: l, close: c, volume: 0 };
    });
  } catch {
    return [];
  }
}

// ─── Fallback: simulate candles if CoinGecko OHLC fails ──────────────────────
function genFallbackCandles(basePrice: number, tf: TF, n = 80): Candle[] {
  const vol = basePrice > 10000 ? 0.013 : basePrice > 100 ? 0.02 : 0.04;
  const tfMs: Record<TF, number> = { "5m": 3e5, "15m": 9e5, "1H": 36e5, "4H": 144e5, "1D": 864e5 };
  let price = basePrice * 0.92;
  const now = Date.now();
  return Array.from({ length: n }, (_, i) => {
    const ts = now - (n - 1 - i) * tfMs[tf];
    const d = new Date(ts);
    const time =
      tf === "1D"
        ? d.toLocaleDateString("en", { month: "short", day: "numeric" })
        : d.toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" });
    const chg = (Math.sin(i * 0.18) * 0.4 + (Math.random() - 0.47)) * vol;
    const open = price;
    price = price * (1 + chg);
    const close = price;
    const wick = vol * 0.5;
    return {
      time, open, close,
      high: Math.max(open, close) * (1 + Math.random() * wick),
      low: Math.min(open, close) * (1 - Math.random() * wick),
      volume: basePrice * (0.6 + Math.random()) * 800,
    };
  });
}

// ─── Indicators ───────────────────────────────────────────────────────────────
function calcSignal(candles: Candle[], basePrice: number): Signal {
  const closes = candles.map(c => c.close);
  const n = closes.length;
  if (n < 20) return { action: "NEUTRAL", confidence: 50, rsi: 50, macd: 0, ma20: basePrice, ma50: basePrice, reasons: ["Insufficient data"] };

  let gains = 0, losses = 0;
  for (let i = Math.max(1, n - 14); i < n; i++) {
    const d = closes[i] - closes[i - 1];
    if (d > 0) gains += d; else losses -= d;
  }
  const rs = losses === 0 ? 100 : (gains / 14) / (losses / 14);
  const rsi = Math.round(100 - 100 / (1 + rs));

  const ma20 = closes.slice(-20).reduce((a, b) => a + b, 0) / 20;
  const ma50 = closes.slice(-Math.min(50, n)).reduce((a, b) => a + b, 0) / Math.min(50, n);

  const ema = (arr: number[], p: number) =>
    arr.slice(-p).reduce((a, b, i) => i === 0 ? b : a * (1 - 2 / (p + 1)) + b * (2 / (p + 1)), 0);
  const macd = ema(closes, 12) - ema(closes, 26);

  const last = closes[n - 1];
  const bull = [last > ma20, last > ma50, macd > 0, rsi > 45 && rsi < 75, rsi < 65].filter(Boolean).length;

  let action: Signal["action"], confidence: number, reasons: string[];
  if (bull >= 4) {
    action = rsi > 62 ? "STRONG BUY" : "BUY"; confidence = 68 + bull * 4;
    reasons = [`Price above MA20 & MA50 — strong uptrend`, `RSI ${rsi} — ${rsi > 55 ? "bullish momentum" : "healthy zone"}`, `MACD positive — bullish confirmation`];
  } else if (bull === 3) {
    action = "BUY"; confidence = 62;
    reasons = [`Bullish structure forming`, `RSI ${rsi} — neutral to positive zone`, `Potential breakout above MA20`];
  } else if (bull === 2) {
    action = "NEUTRAL"; confidence = 50;
    reasons = [`Mixed signals — consolidation phase`, `RSI ${rsi} — no clear direction yet`, `Wait for breakout confirmation`];
  } else if (bull === 1) {
    action = "SELL"; confidence = 63;
    reasons = [`Price below key moving averages`, `RSI ${rsi} — selling pressure increasing`, `MACD ${macd > 0 ? "weakening" : "negative"}`];
  } else {
    action = "STRONG SELL"; confidence = 74;
    reasons = [`Strong bearish structure — all indicators negative`, `RSI ${rsi} — ${rsi < 30 ? "oversold, watch for bounce" : "heavy selling pressure"}`, `Below MA20 & MA50 — downtrend confirmed`];
  }
  return { action, confidence: Math.min(92, confidence), rsi, macd, ma20, ma50, reasons };
}

function calcFG(candles: Candle[]): number {
  const last = candles.slice(-14);
  if (!last.length) return 50;
  const bull = last.filter(c => c.close > c.open).length;
  const avgChg = last.reduce((s, c) => s + (c.close - c.open) / c.open, 0) / last.length;
  return Math.max(5, Math.min(95, Math.round(50 + bull * 3 + avgChg * 400)));
}

// ─── Canvas Chart ─────────────────────────────────────────────────────────────
function CandleChart({ candles, signal, price }: { candles: Candle[]; signal: Signal | null; price: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || !candles.length) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const W = canvas.offsetWidth;
    const H = canvas.offsetHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.scale(dpr, dpr);

    const chartH = H * 0.73, volH = H * 0.18, volY = H * 0.80;
    const padL = 68, padR = 14, padT = 16, padB = 16;
    const chartW = W - padL - padR;

    const prices = candles.flatMap(c => [c.high, c.low]);
    const pMin = Math.min(...prices), pMax = Math.max(...prices);
    const pPad = (pMax - pMin) * 0.1;
    const lo = pMin - pPad, hi = pMax + pPad;
    const py = (p: number) => padT + (1 - (p - lo) / (hi - lo)) * (chartH - padT - padB);
    const maxVol = Math.max(...candles.map(c => c.volume), 1);
    const cw = Math.max(2, Math.floor(chartW / candles.length * 0.7));
    const step = chartW / candles.length;

    // BG
    ctx.fillStyle = "#080810";
    ctx.fillRect(0, 0, W, H);

    // Grid
    for (let i = 0; i <= 5; i++) {
      const y = padT + (i / 5) * (chartH - padT - padB);
      ctx.setLineDash([2, 5]);
      ctx.strokeStyle = "rgba(109,40,217,0.08)";
      ctx.lineWidth = 0.5;
      ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(W - padR, y); ctx.stroke();
      ctx.setLineDash([]);
      const pv = hi - (i / 5) * (hi - lo);
      const label = pv > 1000 ? `$${(pv / 1000).toFixed(1)}k` : pv > 1 ? `$${pv.toFixed(2)}` : `$${pv.toFixed(4)}`;
      ctx.fillStyle = "#374151"; ctx.font = "8px monospace"; ctx.textAlign = "right";
      ctx.fillText(label, padL - 4, y + 3);
    }

    // MA lines
    if (signal) {
      const drawMA = (val: number, color: string, dash: number[], label: string) => {
        const y = py(val);
        if (y < padT || y > chartH) return;
        ctx.setLineDash(dash); ctx.strokeStyle = color; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(W - padR, y); ctx.stroke();
        ctx.setLineDash([]); ctx.fillStyle = color; ctx.font = "8px monospace"; ctx.textAlign = "left";
        ctx.fillText(label, padL + 4, y - 3);
      };
      drawMA(signal.ma20, "#d97706", [4, 3], "MA20");
      drawMA(signal.ma50, "#7c3aed", [6, 3], "MA50");
    }

    // Candles
    candles.forEach((c, i) => {
      const x = padL + i * step + step / 2;
      const isBull = c.close >= c.open;
      const color = isBull ? "#10b981" : "#ef4444";
      const bodyY = py(Math.max(c.open, c.close));
      const bodyH = Math.max(1, Math.abs(py(c.open) - py(c.close)));

      ctx.strokeStyle = color; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x, py(c.high)); ctx.lineTo(x, py(c.low)); ctx.stroke();

      ctx.fillStyle = isBull ? "rgba(16,185,129,0.88)" : "rgba(239,68,68,0.88)";
      ctx.fillRect(x - cw / 2, bodyY, cw, bodyH);
      ctx.strokeStyle = color; ctx.lineWidth = 0.5;
      ctx.strokeRect(x - cw / 2, bodyY, cw, bodyH);

      if (c.volume > 0) {
        const vH = (c.volume / maxVol) * (volH - 4);
        ctx.fillStyle = isBull ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)";
        ctx.fillRect(x - cw / 2, volY + volH - vH, cw, vH);
      }
    });

    // Vol label
    ctx.fillStyle = "#374151"; ctx.font = "7px monospace"; ctx.textAlign = "left";
    ctx.fillText("VOL", padL + 2, volY + 9);

    // X labels
    const interval = Math.ceil(candles.length / 7);
    ctx.fillStyle = "#374151"; ctx.font = "7px monospace"; ctx.textAlign = "center";
    candles.forEach((c, i) => {
      if (i % interval === 0) ctx.fillText(c.time, padL + i * step + step / 2, H - 3);
    });

    // Last price tag
    const last = candles[candles.length - 1];
    const lastY = py(last.close);
    const isBull = last.close >= last.open;
    ctx.setLineDash([3, 3]);
    ctx.strokeStyle = isBull ? "rgba(16,185,129,0.4)" : "rgba(239,68,68,0.4)";
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(padL, lastY); ctx.lineTo(W - padR, lastY); ctx.stroke();
    ctx.setLineDash([]);

    const tagW = 62, tagH = 14;
    ctx.fillStyle = isBull ? "#10b981" : "#ef4444";
    ctx.fillRect(W - padR - tagW, lastY - tagH / 2, tagW, tagH);
    ctx.fillStyle = "#000"; ctx.font = "bold 8px monospace"; ctx.textAlign = "center";
    const pLabel = price > 1000 ? `$${price.toLocaleString("en", { maximumFractionDigits: 0 })}` : price > 1 ? `$${price.toFixed(3)}` : `$${price.toFixed(5)}`;
    ctx.fillText(pLabel, W - padR - tagW / 2, lastY + 4);

  }, [candles, signal, price]);

  return <canvas ref={ref} style={{ width: "100%", height: "100%", display: "block" }} />;
}

// ─── Fear & Greed Gauge ───────────────────────────────────────────────────────
function FearGreedGauge({ value }: { value: number }) {
  const zones = [
    { label: "Extreme Fear", range: [0, 20],   color: "#dc2626" },
    { label: "Fear",         range: [20, 40],  color: "#f97316" },
    { label: "Neutral",      range: [40, 60],  color: "#eab308" },
    { label: "Greed",        range: [60, 80],  color: "#84cc16" },
    { label: "Extreme Greed",range: [80, 100], color: "#10b981" },
  ];
  const active = zones.find(z => value >= z.range[0] && value <= z.range[1]) ?? zones[2];
  const needleDeg = (value / 100) * 180 - 90;

  const arcPath = (s0: number, e0: number) => {
    const toR = (deg: number) => (deg - 180) * Math.PI / 180;
    const s = s0 / 100 * 180, e = e0 / 100 * 180;
    const r = 80, ri = 56, cx = 100, cy = 100;
    const x1 = cx + r * Math.cos(toR(s)), y1 = cy + r * Math.sin(toR(s));
    const x2 = cx + r * Math.cos(toR(e)), y2 = cy + r * Math.sin(toR(e));
    const xi1 = cx + ri * Math.cos(toR(s)), yi1 = cy + ri * Math.sin(toR(s));
    const xi2 = cx + ri * Math.cos(toR(e)), yi2 = cy + ri * Math.sin(toR(e));
    const lg = (e - s) > 180 ? 1 : 0;
    return `M${x1},${y1} A${r},${r} 0 ${lg},1 ${x2},${y2} L${xi2},${yi2} A${ri},${ri} 0 ${lg},0 ${xi1},${yi1} Z`;
  };

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="10 18 180 92" className="w-full max-w-[240px]">
        {zones.map((z, i) => (
          <path key={i} d={arcPath(z.range[0], z.range[1])}
            fill={z.color} fillOpacity={value >= z.range[0] && value <= z.range[1] ? 1 : 0.18}
            stroke="#050508" strokeWidth="1.5" />
        ))}
        <g transform={`rotate(${needleDeg}, 100, 100)`}>
          <polygon points="100,28 96.5,97 103.5,97" fill={active.color} opacity="0.95" />
          <circle cx="100" cy="100" r="7" fill={active.color} />
          <circle cx="100" cy="100" r="3.5" fill="#050508" />
        </g>
        <text x="100" y="89" textAnchor="middle" fill={active.color}
          fontSize="20" fontWeight="bold" fontFamily="monospace">{value}</text>
      </svg>
      <div className="flex justify-between w-full max-w-[240px] px-0.5 -mt-1">
        {zones.map((z, i) => (
          <span key={i} className="text-[7px] font-mono text-center leading-tight px-0.5"
            style={{ color: z.color, opacity: value >= z.range[0] && value <= z.range[1] ? 1 : 0.35 }}>
            {z.label.split(" ")[0]}
          </span>
        ))}
      </div>
      <div className="text-center mt-2">
        <p className="text-base font-black font-mono tracking-wider" style={{ color: active.color }}>
          {active.label.toUpperCase()}
        </p>
        <p className="text-[9px] font-mono text-gray-600 tracking-widest">FEAR & GREED INDEX</p>
      </div>
    </div>
  );
}

// ─── Signal styles ────────────────────────────────────────────────────────────
const SIG: Record<string, { color: string; bg: string; border: string; icon: React.ReactNode }> = {
  "STRONG BUY":  { color: "#10b981", bg: "rgba(16,185,129,0.07)",  border: "rgba(16,185,129,0.3)",  icon: <TrendingUp size={15} /> },
  "BUY":         { color: "#34d399", bg: "rgba(52,211,153,0.06)",  border: "rgba(52,211,153,0.25)", icon: <ArrowUpRight size={15} /> },
  "NEUTRAL":     { color: "#f59e0b", bg: "rgba(245,158,11,0.06)",  border: "rgba(245,158,11,0.25)", icon: <Activity size={15} /> },
  "SELL":        { color: "#f87171", bg: "rgba(248,113,113,0.06)", border: "rgba(248,113,113,0.25)",icon: <ArrowDownRight size={15} /> },
  "STRONG SELL": { color: "#ef4444", bg: "rgba(239,68,68,0.07)",   border: "rgba(239,68,68,0.3)",   icon: <TrendingDown size={15} /> },
};

// ─── Format helpers ───────────────────────────────────────────────────────────
const fmtPrice = (p: number) =>
  p > 10000 ? p.toLocaleString("en", { maximumFractionDigits: 0 })
  : p > 100  ? p.toFixed(2)
  : p > 1    ? p.toFixed(4)
  : p.toFixed(6);

const fmtLarge = (n: number) =>
  n > 1e12 ? `$${(n / 1e12).toFixed(2)}T`
  : n > 1e9 ? `$${(n / 1e9).toFixed(2)}B`
  : n > 1e6 ? `$${(n / 1e6).toFixed(2)}M`
  : `$${n.toFixed(0)}`;

// ─── Main Component ───────────────────────────────────────────────────────────
export default function TradingDashboard() {
  const [coin,       setCoin]       = useState<CoinInfo>(DEFAULT_COINS[0]);
  const [coinData,   setCoinData]   = useState<CoinInfo | null>(null);
  const [candles,    setCandles]    = useState<Candle[]>([]);
  const [signal,     setSignal]     = useState<Signal | null>(null);
  const [fg,         setFg]         = useState(55);
  const [livePrice,  setLivePrice]  = useState(0);
  const [pctChg,     setPctChg]     = useState(0);
  const [tf,         setTf]         = useState<TF>("1H");
  const [loading,    setLoading]    = useState(false);
  const [priceLoad,  setPriceLoad]  = useState(false);
  const [spinning,   setSpinning]   = useState(false);
  const [showDisc,   setShowDisc]   = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [query,      setQuery]      = useState("");
  const [results,    setResults]    = useState<CoinInfo[]>(DEFAULT_COINS);
  const [searching,  setSearching]  = useState(false);
  const [side,       setSide]       = useState<"BUY" | "SELL">("BUY");
  const [orderType,  setOrderType]  = useState<"MARKET" | "LIMIT">("MARKET");
  const [amount,     setAmount]     = useState("");
  const [limitPx,    setLimitPx]    = useState("");
  const [orderMsg,   setOrderMsg]   = useState("");
  const [error,      setError]      = useState<string | null>(null);
  const liveRef  = useRef(0);
  const searchTm = useRef<ReturnType<typeof setTimeout>>();
  const priceIv  = useRef<ReturnType<typeof setInterval>>();

  // ── Fetch OHLC + price ──────────────────────────────────────────────────────
  const loadChart = useCallback(async (c: CoinInfo, t: TF) => {
    setLoading(true); setError(null);
    try {
      // Fetch price data
      const info = await fetchCoinPrice(c.id);
      if (info) {
        setCoinData(info);
        const p = info.current_price ?? 0;
        liveRef.current = p;
        setLivePrice(p);
        setPctChg(info.price_change_percentage_24h ?? 0);
      }

      // Fetch OHLC
      let ohlc = await fetchOHLC(c.id, t);
      if (!ohlc.length) {
        // Fallback to simulated data if CoinGecko OHLC unavailable
        ohlc = genFallbackCandles(info?.current_price ?? 1000, t);
      }
      setCandles(ohlc);
      const sig = calcSignal(ohlc, info?.current_price ?? 1000);
      setSignal(sig);
      setFg(calcFG(ohlc));
    } catch {
      setError("Failed to load chart data. Showing simulated data.");
      const fb = genFallbackCandles(liveRef.current || 1000, t);
      setCandles(fb);
      setSignal(calcSignal(fb, liveRef.current || 1000));
      setFg(calcFG(fb));
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Live price polling (every 15s) ──────────────────────────────────────────
  const startPricePoll = useCallback((id: string) => {
    if (priceIv.current) clearInterval(priceIv.current);
    priceIv.current = setInterval(async () => {
      setPriceLoad(true);
      const info = await fetchCoinPrice(id);
      if (info) {
        setCoinData(info);
        const p = info.current_price ?? 0;
        liveRef.current = p;
        setLivePrice(p);
        setPctChg(info.price_change_percentage_24h ?? 0);
      }
      setPriceLoad(false);
    }, 15000);
  }, []);

  useEffect(() => {
    loadChart(coin, tf);
    startPricePoll(coin.id);
    return () => { if (priceIv.current) clearInterval(priceIv.current); };
  }, [coin, tf, loadChart, startPricePoll]);

  // ── Search ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!query.trim()) { setResults(DEFAULT_COINS); return; }
    clearTimeout(searchTm.current);
    searchTm.current = setTimeout(async () => {
      setSearching(true);
      const r = await searchCoins(query);
      setResults(r.length ? r : DEFAULT_COINS);
      setSearching(false);
    }, 400);
  }, [query]);

  const selectCoin = (c: CoinInfo) => {
    setCoin(c); setShowSearch(false); setQuery(""); setResults(DEFAULT_COINS);
  };

  const reload = () => { setSpinning(true); loadChart(coin, tf).then(() => setSpinning(false)); };

  const submitOrder = () => {
    if (!amount) { setOrderMsg("❌ Please enter an amount"); return; }
    setOrderMsg(`✓ ${side} order placed — DEMO ONLY`);
    setTimeout(() => setOrderMsg(""), 3000);
    setAmount(""); setLimitPx("");
  };

  const sigStyle = signal ? (SIG[signal.action] ?? SIG["NEUTRAL"]) : SIG["NEUTRAL"];
  const isUp = pctChg >= 0;
  const displayPrice = livePrice || coinData?.current_price || 0;

  const stats = [
    { label: "24H HIGH", val: coinData?.high_24h ? `$${fmtPrice(coinData.high_24h)}` : "—" },
    { label: "24H LOW",  val: coinData?.low_24h  ? `$${fmtPrice(coinData.low_24h)}`  : "—" },
    { label: "24H VOL",  val: coinData?.total_volume ? fmtLarge(coinData.total_volume) : "—" },
    { label: "MKT CAP",  val: coinData?.market_cap   ? fmtLarge(coinData.market_cap)   : "—" },
  ];

  return (
    <div className="w-full space-y-3 font-mono">

      {/* ══ HEADER ══════════════════════════════════════════════════════════ */}
      <div className="flex flex-wrap items-center justify-between gap-3">

        {/* Coin selector */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <button onClick={() => setShowSearch(v => !v)}
              className="flex items-center gap-2 px-3 py-2 bg-[#0d0d1a] border border-purple-900/40 hover:border-purple-500/50 rounded-lg text-sm text-white transition-all min-w-[160px]">
              {coinData?.thumb
                ? <img src={coinData.thumb} alt="" className="w-4 h-4 rounded-full" />
                : <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />}
              <span className="font-bold">{coin.symbol}/USDT</span>
              <span className="text-gray-600 text-[10px] ml-auto">{coin.name}</span>
              <ChevronDown size={11} className="text-gray-600 flex-shrink-0" />
            </button>

            {/* Search dropdown */}
            <AnimatePresence>
              {showSearch && (
                <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                  className="absolute top-11 left-0 z-50 w-72 bg-[#0d0d1a] border border-purple-900/40 rounded-xl shadow-2xl shadow-purple-900/30 overflow-hidden">

                  {/* Search input */}
                  <div className="flex items-center gap-2 px-3 py-2.5 border-b border-purple-900/30">
                    <Search size={12} className="text-gray-600 flex-shrink-0" />
                    <input autoFocus value={query} onChange={e => setQuery(e.target.value)}
                      placeholder="Search coins (e.g. Bitcoin, ETH...)"
                      className="flex-1 bg-transparent text-xs text-white placeholder-gray-700 focus:outline-none" />
                    {searching ? <Loader2 size={11} className="text-purple-400 animate-spin" /> : query && <button onClick={() => setQuery("")}><X size={11} className="text-gray-600" /></button>}
                  </div>

                  {/* Results */}
                  <div className="max-h-64 overflow-y-auto">
                    {results.length === 0 && (
                      <p className="text-[10px] text-gray-600 text-center py-4">No results found</p>
                    )}
                    {results.map(r => (
                      <button key={r.id} onClick={() => selectCoin(r)}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-xs transition-all hover:bg-white/5 ${coin.id === r.id ? "text-amber-400 bg-amber-400/5" : "text-gray-300"}`}>
                        {r.thumb
                          ? <img src={r.thumb} alt="" className="w-5 h-5 rounded-full flex-shrink-0" />
                          : <span className="w-5 h-5 rounded-full bg-purple-900/50 flex-shrink-0 flex items-center justify-center text-[9px] text-purple-400">{r.symbol[0]}</span>}
                        <div className="text-left min-w-0">
                          <p className="font-bold">{r.symbol}</p>
                          <p className="text-[9px] text-gray-600 truncate">{r.name}</p>
                        </div>
                        {r.current_price && (
                          <span className="ml-auto text-[10px] text-white font-bold">${fmtPrice(r.current_price)}</span>
                        )}
                        {coin.id === r.id && <Star size={10} className="text-amber-400 flex-shrink-0" />}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Live price */}
          <div>
            <div className="flex items-baseline gap-2">
              {displayPrice > 0 ? (
                <span className="text-2xl font-black text-white tracking-tight">${fmtPrice(displayPrice)}</span>
              ) : (
                <span className="text-2xl font-black text-gray-700 animate-pulse">Loading...</span>
              )}
              {priceLoad && <Loader2 size={11} className="text-purple-400 animate-spin" />}
              {pctChg !== 0 && (
                <span className={`text-sm font-bold flex items-center gap-0.5 ${isUp ? "text-emerald-400" : "text-red-400"}`}>
                  {isUp ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                  {Math.abs(pctChg).toFixed(2)}%
                </span>
              )}
            </div>
            <p className="text-[9px] text-gray-600">LIVE PRICE via CoinGecko</p>
          </div>
        </div>

        {/* Stats */}
        <div className="hidden lg:flex items-center gap-5">
          {stats.map(s => (
            <div key={s.label} className="text-center">
              <p className="text-[8px] text-gray-600">{s.label}</p>
              <p className="text-xs text-white font-bold">{s.val}</p>
            </div>
          ))}
        </div>

        {/* Timeframe + refresh */}
        <div className="flex items-center gap-1.5">
          {TFS.map(t => (
            <button key={t} onClick={() => setTf(t)}
              className={`px-2.5 py-1 text-[10px] rounded-md transition-all ${tf === t ? "bg-purple-600/25 border border-purple-500/40 text-purple-300" : "text-gray-600 hover:text-gray-400 hover:bg-white/5"}`}>
              {t}
            </button>
          ))}
          <button onClick={reload}
            className={`p-1.5 ml-1 text-gray-600 hover:text-purple-400 transition-colors ${spinning ? "animate-spin" : ""}`}>
            <RefreshCw size={13} />
          </button>
        </div>
      </div>

      {/* Error banner */}
      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex items-center gap-2 px-3 py-2 bg-amber-900/10 border border-amber-700/20 rounded-lg text-[10px] text-amber-600">
            <AlertTriangle size={10} />{error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══ MAIN GRID ═══════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-3">

        {/* ── LEFT: Chart ─────────────────────────────────────────────────── */}
        <div className="space-y-3">
          <div className="bg-[#080810] border border-purple-900/20 rounded-xl overflow-hidden">
            {/* Chart header */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-purple-900/15">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] text-gray-500 tracking-widest uppercase">
                  {coin.symbol}/USDT · {tf} · Candlestick
                </span>
              </div>
              <div className="flex items-center gap-3 text-[9px]">
                <span className="text-amber-500 flex items-center gap-1"><span className="w-4 border-t border-dashed border-amber-500 inline-block" />MA20</span>
                <span className="text-purple-400 flex items-center gap-1"><span className="w-4 border-t border-dashed border-purple-400 inline-block" />MA50</span>
                <span className="text-emerald-500">▇ Bull</span>
                <span className="text-red-500">▇ Bear</span>
              </div>
            </div>

            {/* Canvas */}
            <div className="relative" style={{ height: 320 }}>
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-[#080810] z-10">
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 size={24} className="text-purple-500 animate-spin" />
                    <p className="text-[10px] text-gray-600 font-mono">Fetching {coin.symbol} chart data...</p>
                  </div>
                </div>
              )}
              <CandleChart candles={candles} signal={signal} price={displayPrice} />
            </div>
          </div>

          {/* Indicator strip */}
          <div className="grid grid-cols-4 gap-2">
            {signal && [
              {
                label: "RSI (14)", value: signal.rsi.toString(),
                sub: signal.rsi > 70 ? "Overbought" : signal.rsi < 30 ? "Oversold" : "Neutral",
                color: signal.rsi > 70 ? "#ef4444" : signal.rsi < 30 ? "#10b981" : "#f59e0b",
                bar: signal.rsi,
              },
              {
                label: "MACD",
                value: (signal.macd > 0 ? "+" : "") + signal.macd.toFixed(displayPrice > 100 ? 2 : 5),
                sub: signal.macd > 0 ? "Bullish cross" : "Bearish cross",
                color: signal.macd > 0 ? "#10b981" : "#ef4444",
                bar: Math.min(100, 50 + signal.macd / (displayPrice || 1) * 5000),
              },
              {
                label: "vs MA20",
                value: candles.length ? (((candles[candles.length - 1].close / signal.ma20) - 1) * 100).toFixed(2) + "%" : "—",
                sub: candles.length && candles[candles.length - 1].close > signal.ma20 ? "Above" : "Below",
                color: candles.length && candles[candles.length - 1].close > signal.ma20 ? "#10b981" : "#ef4444",
                bar: candles.length && candles[candles.length - 1].close > signal.ma20 ? 72 : 28,
              },
              {
                label: "24H Volume",
                value: coinData?.total_volume ? fmtLarge(coinData.total_volume) : "—",
                sub: "CoinGecko live",
                color: "#a78bfa", bar: 68,
              },
            ].map(ind => (
              <div key={ind.label} className="p-3 bg-[#080810] border border-purple-900/15 rounded-xl">
                <p className="text-[9px] text-gray-600 mb-1.5">{ind.label}</p>
                <p className="text-base font-black" style={{ color: ind.color }}>{ind.value}</p>
                <div className="mt-2 h-0.5 bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${ind.bar}%`, background: ind.color }} />
                </div>
                <p className="text-[8px] mt-1" style={{ color: ind.color }}>{ind.sub}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── RIGHT: Signal + F&G + Trade ─────────────────────────────────── */}
        <div className="space-y-3">

          {/* AI Signal */}
          <AnimatePresence mode="wait">
            {signal && (
              <motion.div key={signal.action} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                className="rounded-xl overflow-hidden border" style={{ background: sigStyle.bg, borderColor: sigStyle.border }}>
                <div className="px-4 pt-4 pb-3 border-b" style={{ borderColor: sigStyle.border + "55" }}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Zap size={12} style={{ color: sigStyle.color }} />
                      <span className="text-[9px] text-gray-500 tracking-widest">AI ORACLE SIGNAL · {coin.symbol}</span>
                    </div>
                    <button onClick={() => setShowDisc(v => !v)} className="text-gray-700 hover:text-gray-400">
                      <Info size={12} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2" style={{ color: sigStyle.color }}>
                      {sigStyle.icon}
                      <span className="text-xl font-black tracking-wider">{signal.action}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-black" style={{ color: sigStyle.color }}>{signal.confidence}%</p>
                      <p className="text-[8px] text-gray-600">CONFIDENCE</p>
                    </div>
                  </div>
                </div>
                <div className="px-4 py-2">
                  <div className="h-1.5 bg-gray-800/60 rounded-full overflow-hidden">
                    <motion.div className="h-full rounded-full"
                      style={{ background: signal.action.includes("BUY") ? "#10b981" : signal.action === "NEUTRAL" ? "#f59e0b" : "#ef4444" }}
                      initial={{ width: 0 }} animate={{ width: `${signal.confidence}%` }}
                      transition={{ duration: 1, ease: "easeOut" }} />
                  </div>
                </div>
                <div className="px-4 pb-4 space-y-1.5">
                  {signal.reasons.map((r, i) => (
                    <div key={i} className="flex gap-2 text-[10px]">
                      <span style={{ color: sigStyle.color }} className="flex-shrink-0 font-bold">[{i + 1}]</span>
                      <span className="text-gray-400">{r}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Fear & Greed */}
          <div className="p-4 bg-[#080810] border border-purple-900/20 rounded-xl">
            <div className="flex items-center gap-2 mb-3">
              <Activity size={11} className="text-purple-400" />
              <span className="text-[9px] text-gray-600 tracking-widest">MARKET SENTIMENT</span>
            </div>
            <FearGreedGauge value={fg} />
            <div className="flex justify-between mt-3 pt-3 border-t border-purple-900/15 text-center">
              {[
                { label: "YESTERDAY", val: Math.max(5, Math.min(95, fg + Math.round((Math.random() - 0.5) * 14))) },
                { label: "LAST WEEK", val: Math.max(5, Math.min(95, fg + Math.round((Math.random() - 0.5) * 22))) },
                { label: "NOW",       val: fg },
              ].map(item => {
                const c = item.val <= 20 ? "#dc2626" : item.val <= 40 ? "#f97316" : item.val <= 60 ? "#eab308" : item.val <= 80 ? "#84cc16" : "#10b981";
                return (
                  <div key={item.label}>
                    <p className="text-[8px] text-gray-600 mb-0.5">{item.label}</p>
                    <p className="text-sm font-black" style={{ color: c }}>{item.val}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Trade Panel */}
          <div className="bg-[#080810] border border-purple-900/20 rounded-xl overflow-hidden">
            <div className="flex">
              {(["BUY", "SELL"] as const).map(s => (
                <button key={s} onClick={() => setSide(s)}
                  className={`flex-1 py-3 text-xs font-black tracking-widest transition-all ${
                    side === s
                      ? s === "BUY" ? "bg-emerald-500/12 text-emerald-400 border-b-2 border-emerald-400"
                                    : "bg-red-500/12 text-red-400 border-b-2 border-red-400"
                      : "text-gray-600 hover:text-gray-400 bg-black/20"
                  }`}>{s}
                </button>
              ))}
            </div>

            <div className="p-4 space-y-3">
              <div className="flex gap-2">
                {(["MARKET", "LIMIT"] as const).map(t => (
                  <button key={t} onClick={() => setOrderType(t)}
                    className={`flex-1 py-1.5 text-[9px] rounded-lg transition-all ${orderType === t ? "bg-purple-600/20 border border-purple-500/35 text-purple-300" : "text-gray-600 border border-gray-800 hover:text-gray-400"}`}>
                    {t}
                  </button>
                ))}
              </div>

              <div className="flex justify-between text-[9px]">
                <span className="text-gray-600">AVAILABLE</span>
                <span className="text-white">10,000.00 USDT</span>
              </div>

              <div>
                <label className="text-[9px] text-gray-600 block mb-1">AMOUNT ({coin.symbol})</label>
                <div className="flex items-center bg-[#060609] border border-purple-900/25 focus-within:border-purple-500/40 rounded-lg px-3 py-2.5 gap-2 transition-all">
                  <input type="number" value={amount} placeholder="0.00" onChange={e => setAmount(e.target.value)}
                    className="flex-1 bg-transparent text-sm text-white placeholder-gray-800 focus:outline-none" />
                  <span className="text-[9px] text-gray-600 border-l border-gray-800 pl-2">{coin.symbol}</span>
                </div>
              </div>

              {orderType === "LIMIT" && (
                <div>
                  <label className="text-[9px] text-gray-600 block mb-1">LIMIT PRICE (USDT)</label>
                  <div className="flex items-center bg-[#060609] border border-purple-900/25 focus-within:border-purple-500/40 rounded-lg px-3 py-2.5 gap-2 transition-all">
                    <span className="text-[9px] text-gray-600">$</span>
                    <input type="number" value={limitPx} placeholder={fmtPrice(displayPrice)} onChange={e => setLimitPx(e.target.value)}
                      className="flex-1 bg-transparent text-sm text-white placeholder-gray-800 focus:outline-none" />
                  </div>
                </div>
              )}

              <div className="flex gap-1.5">
                {["25%", "50%", "75%", "100%"].map(p => (
                  <button key={p} className="flex-1 py-1 text-[9px] text-gray-600 border border-gray-800/60 rounded hover:border-purple-800 hover:text-gray-300 transition-all">{p}</button>
                ))}
              </div>

              <div className="flex justify-between py-2 border-t border-purple-900/15 text-[10px]">
                <span className="text-gray-600">EST. TOTAL</span>
                <span className="text-white font-bold">
                  ≈ ${amount && displayPrice ? (parseFloat(amount) * displayPrice).toLocaleString("en", { maximumFractionDigits: 2 }) : "0.00"}
                </span>
              </div>

              <button onClick={submitOrder}
                className={`w-full py-3 rounded-xl text-sm font-black tracking-widest transition-all ${
                  side === "BUY"
                    ? "bg-emerald-500/12 hover:bg-emerald-500/22 border border-emerald-500/35 text-emerald-400"
                    : "bg-red-500/12 hover:bg-red-500/22 border border-red-500/35 text-red-400"
                }`}>
                {side === "BUY" ? "▲" : "▼"} {orderType} {side} {coin.symbol}
              </button>

              <AnimatePresence>
                {orderMsg && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="text-[10px] text-center text-amber-400">{orderMsg}</motion.p>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* ══ DISCLAIMER ══════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showDisc && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden">
            <div className="p-4 bg-amber-900/8 border border-amber-500/20 rounded-xl space-y-2">
              <div className="flex items-center gap-2">
                <AlertTriangle size={12} className="text-amber-400 flex-shrink-0" />
                <p className="text-[10px] font-bold text-amber-400 tracking-wider">⚠ IMPORTANT DISCLAIMER</p>
                <button onClick={() => setShowDisc(false)} className="ml-auto text-gray-600 hover:text-gray-400 text-xs">✕</button>
              </div>
              {[
                "This platform is a DEMO — no real transactions are executed.",
                "All signals, indicators, and trade buttons are for educational purposes only.",
                "AI Oracle signals are NOT financial advice. Do not base investment decisions on them.",
                "Cryptocurrency trading carries extreme risk. You may lose your entire capital.",
                "Always do your own research (DYOR) before trading with real money.",
                "Price data is sourced from CoinGecko API — accuracy not guaranteed.",
                "Ritual Will Oracle bears no responsibility for any financial losses.",
              ].map((line, i) => (
                <p key={i} className="flex gap-2 text-[10px] text-gray-500">
                  <span className="text-amber-600 flex-shrink-0">[{i + 1}]</span>{line}
                </p>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mini disclaimer */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#080810] border border-amber-900/15 rounded-lg">
        <div className="flex items-center gap-2">
          <AlertTriangle size={9} className="text-amber-700" />
          <span className="text-[9px] text-gray-700">DEMO ONLY · Not financial advice · Price data via CoinGecko API</span>
        </div>
        <button onClick={() => setShowDisc(v => !v)}
          className="text-[9px] text-amber-700 hover:text-amber-500 underline transition-colors flex-shrink-0">
          Read Disclaimer
        </button>
      </div>
    </div>
  );
}