// lib/ritual.ts
// Ethers.js connector for the Ritual Testnet blockchain.
// Handles wallet connection, network switching, and contract interaction.

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on: (event: string, handler: (...args: unknown[]) => void) => void;
      removeListener: (event: string, handler: (...args: unknown[]) => void) => void;
    };
  }
}

import { ethers } from "ethers";
import type { WalletState, StoreResult, OnChainPrediction, MarketCategory } from "@/types";

// ─── Ritual Testnet Config ────────────────────────────────────────────────────

export const RITUAL_CHAIN = {
  chainId: 1979,
  chainIdHex: "0x7BB",
  chainName: "Ritual Testnet",
  rpcUrl:
    process.env.NEXT_PUBLIC_RITUAL_RPC || "https://rpc.ritualfoundation.org",
  symbol: "RITUAL",
  decimals: 18,
  explorerUrl: "https://explorer.ritualfoundation.org",
} as const;

// ─── OracleVault ABI (only the functions we use) ──────────────────────────────

export const ORACLE_VAULT_ABI = [
  // Write
  "function storePrediction(string question, string outcome, uint8 confidence, string reasoning, string category) external returns (uint256 id)",
  // Read
  "function getPrediction(uint256 id) external view returns (tuple(uint256 id, string question, string outcome, uint8 confidence, string reasoning, string category, address analyst, uint256 timestamp))",
  "function getTotalPredictions() external view returns (uint256)",
  "function getUserPredictions(address user) external view returns (uint256[])",
  // Events
  "event PredictionStored(uint256 indexed id, string question, address indexed analyst, uint8 confidence, uint256 timestamp)",
] as const;

// ─── Helper: Get provider ────────────────────────────────────────────────────

/**
 * Returns a BrowserProvider (MetaMask) if available, or throws.
 */
export function getBrowserProvider(): ethers.BrowserProvider {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("MetaMask not found. Please install MetaMask.");
  }
  return new ethers.BrowserProvider(window.ethereum);
}

/**
 * Returns a read-only JSON-RPC provider for Ritual Testnet.
 * Useful for fetching data without a wallet.
 */
export function getReadProvider(): ethers.JsonRpcProvider {
  return new ethers.JsonRpcProvider(RITUAL_CHAIN.rpcUrl);
}

// ─── Network Switching ────────────────────────────────────────────────────────

/**
 * Requests MetaMask to switch to Ritual Testnet.
 * If the network hasn't been added yet, adds it automatically.
 */
export async function switchToRitual(): Promise<void> {
  if (!window.ethereum) throw new Error("MetaMask not found");

  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: RITUAL_CHAIN.chainIdHex }],
    });
  } catch (err: unknown) {
    // Error code 4902 = chain not added yet
    const error = err as { code?: number };
    if (error.code === 4902) {
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: RITUAL_CHAIN.chainIdHex,
            chainName: RITUAL_CHAIN.chainName,
            nativeCurrency: {
              name: RITUAL_CHAIN.symbol,
              symbol: RITUAL_CHAIN.symbol,
              decimals: RITUAL_CHAIN.decimals,
            },
            rpcUrls: [RITUAL_CHAIN.rpcUrl],
            blockExplorerUrls: [RITUAL_CHAIN.explorerUrl],
          },
        ],
      });
    } else {
      throw err;
    }
  }
}

// ─── Wallet State ─────────────────────────────────────────────────────────────

/**
 * Reads the current wallet state from MetaMask without triggering a popup.
 */
export async function getWalletState(): Promise<WalletState> {
  if (typeof window === "undefined" || !window.ethereum) {
    return {
      address: null,
      chainId: null,
      isConnected: false,
      isCorrectNetwork: false,
      balance: null,
    };
  }

  try {
    const provider = getBrowserProvider();
    const accounts: string[] = await window.ethereum.request({
      method: "eth_accounts",
    });
    const address = accounts[0] ?? null;

    if (!address) {
      return {
        address: null,
        chainId: null,
        isConnected: false,
        isCorrectNetwork: false,
        balance: null,
      };
    }

    const network = await provider.getNetwork();
    const chainId = Number(network.chainId);
    const balanceBN = await provider.getBalance(address);
    const balance = parseFloat(ethers.formatEther(balanceBN)).toFixed(4);

    return {
      address,
      chainId,
      isConnected: true,
      isCorrectNetwork: chainId === RITUAL_CHAIN.chainId,
      balance,
    };
  } catch {
    return {
      address: null,
      chainId: null,
      isConnected: false,
      isCorrectNetwork: false,
      balance: null,
    };
  }
}

// ─── Contract Interaction ─────────────────────────────────────────────────────

/**
 * Returns a signer-connected OracleVault contract instance.
 * Requires MetaMask to be connected.
 */
export async function getOracleVaultContract(): Promise<ethers.Contract> {
  const address = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
  if (!address) {
    throw new Error(
      "NEXT_PUBLIC_CONTRACT_ADDRESS not set. Deploy the contract first."
    );
  }

  const provider = getBrowserProvider();
  const signer = await provider.getSigner();
  return new ethers.Contract(address, ORACLE_VAULT_ABI, signer);
}

/**
 * Returns a read-only OracleVault contract instance (no wallet needed).
 */
export function getOracleVaultReader(): ethers.Contract {
  const address = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
  if (!address) {
    throw new Error("NEXT_PUBLIC_CONTRACT_ADDRESS not set.");
  }
  const provider = getReadProvider();
  return new ethers.Contract(address, ORACLE_VAULT_ABI, provider);
}

/**
 * Store a prediction on-chain via MetaMask.
 * Returns the tx hash and on-chain prediction ID.
 */
export async function storePredictionOnChain(params: {
  question: string;
  outcome: string;
  confidence: number;
  reasoning: string;
  category: MarketCategory;
}): Promise<StoreResult> {
  try {
    const contract = await getOracleVaultContract();

    // Truncate reasoning to avoid excessive gas usage
    const shortReasoning = params.reasoning.slice(0, 500);

    const tx = await contract.storePrediction(
      params.question,
      params.outcome,
      params.confidence,
      shortReasoning,
      params.category
    );

    const receipt = await tx.wait();

    // Parse the PredictionStored event to get the on-chain ID
    let onChainId: number | undefined;
    for (const log of receipt.logs) {
      try {
        const parsed = contract.interface.parseLog(log);
        if (parsed?.name === "PredictionStored") {
          onChainId = Number(parsed.args[0]);
          break;
        }
      } catch {
        // Skip unparseable logs
      }
    }

    return {
      success: true,
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      onChainId,
    };
  } catch (err: unknown) {
    const error = err as { message?: string };
    return {
      success: false,
      error: error.message || "Transaction failed",
    };
  }
}

/**
 * Fetch a prediction from on-chain by ID (read-only).
 */
export async function fetchPredictionById(
  id: number
): Promise<OnChainPrediction | null> {
  try {
    const contract = getOracleVaultReader();
    const raw = await contract.getPrediction(id);
    return {
      id: Number(raw.id),
      question: raw.question,
      outcome: raw.outcome as "YES" | "NO" | "UNCERTAIN",
      confidence: Number(raw.confidence),
      reasoning: raw.reasoning,
      category: raw.category as MarketCategory,
      analyst: raw.analyst,
      timestamp: Number(raw.timestamp) * 1000,
      txHash: "", // Not stored on-chain, need separate indexing
    };
  } catch {
    return null;
  }
}

/**
 * Get total number of predictions stored.
 */
export async function getTotalPredictions(): Promise<number> {
  try {
    const contract = getOracleVaultReader();
    const total = await contract.getTotalPredictions();
    return Number(total);
  } catch {
    return 0;
  }
}

// ─── Explorer URL helper ──────────────────────────────────────────────────────

export function getTxUrl(txHash: string): string {
  return `${RITUAL_CHAIN.explorerUrl}/tx/${txHash}`;
}

export function getAddressUrl(address: string): string {
  return `${RITUAL_CHAIN.explorerUrl}/address/${address}`;
}
