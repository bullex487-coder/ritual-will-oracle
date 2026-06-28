# ⬡ Ritual Will Oracle

> Decentralized AI prediction oracle built on the Ritual blockchain ecosystem.
> Submit future scenarios → AI analyzes → result sealed on-chain as a verifiable record.

---

## Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js 14 App Router + TypeScript |
| Styling | TailwindCSS + Framer Motion |
| AI Inference | Groq API (llama-3.3-70b-versatile) |
| Blockchain | ethers.js v6 → Ritual Testnet |
| Charts | Recharts |
| Icons | Lucide React |

---

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```env
GROQ_API_KEY=gsk_your_key_here
NEXT_PUBLIC_CONTRACT_ADDRESS=0xYourContractAddress
NEXT_PUBLIC_RITUAL_RPC=https://rpc.ritualfoundation.org
```

Get your Groq API key free at: https://console.groq.com/keys

### 3. Deploy the smart contract

1. Open [Remix IDE](https://remix.ethereum.org)
2. Create a new file → paste contents of `contracts/OracleVault.sol`
3. Compile with Solidity 0.8.19
4. In MetaMask, add the **Ritual Testnet**:
   - RPC: `https://rpc.ritualfoundation.org`
   - Chain ID: `1979`
   - Symbol: `RITUAL`
   - Explorer: `https://explorer.ritualfoundation.org`
5. Get testnet RITUAL tokens from the faucet
6. In Remix → Deploy & Run → Environment: **Injected Provider (MetaMask)**
7. Deploy `OracleVault`
8. Copy the deployed contract address → paste in `.env.local`

### 4. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## How It Works

```
User types question
       ↓
POST /api/predict
       ↓
Groq llama-3.3-70b analyzes
       ↓
Returns: outcome + confidence + reasoning + risk factors
       ↓
User connects MetaMask → clicks "Seal On-Chain"
       ↓
ethers.js → OracleVault.storePrediction() → Ritual Testnet
       ↓
Tx hash returned → permanent verifiable record
       ↓
Anyone can verify via Verify tab or Explorer
```

---

## File Structure

```
/app
  /api/predict/route.ts    ← Groq API endpoint
  layout.tsx
  page.tsx                 ← Main page with dynamic imports
  globals.css

/components
  Navbar.tsx               ← Nav + wallet connect
  MarketTicker.tsx         ← Bloomberg-style ticker
  PredictionInput.tsx      ← Question input form
  OracleResult.tsx         ← AI analysis display
  PredictionCard.tsx       ← Dashboard list item
  OracleDashboard.tsx      ← Stats + predictions list
  RitualVault.tsx          ← On-chain storage UI
  VerifyPrediction.tsx     ← Public verification
  LoadingOracle.tsx        ← Animated loading state

/hooks
  useOracle.ts             ← AI predictions state
  useRitualVault.ts        ← Wallet + contract interaction

/lib
  ritual.ts                ← ethers.js connector
  helpers.ts               ← Utility functions
  mockData.ts              ← Demo data

/types/index.ts            ← All TypeScript types
/services/api.ts           ← Client API service
/contracts/OracleVault.sol ← Solidity smart contract
```

---

## Ritual Testnet Config

| Property | Value |
|----------|-------|
| Network Name | Ritual Testnet |
| RPC URL | https://rpc.ritualfoundation.org |
| Chain ID | 1979 |
| Symbol | RITUAL |
| Explorer | https://explorer.ritualfoundation.org |

---

## Design Theme

- **Aesthetic**: Bloomberg terminal meets AI oracle
- **Colors**: `#050508` black / deep purple `#6d28d9` / gold `#d97706`
- **Typography**: JetBrains Mono (monospace-first)
- **Motif**: Hexagonal ⬡ oracle geometry

---

Built for the Ritual ecosystem showcase. Not for production mainnet use.
