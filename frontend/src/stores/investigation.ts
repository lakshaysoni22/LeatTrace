import { create } from 'zustand';

export interface LiveTransactionInput {
  txid: string;
  vout: number;
  prevout?: {
    scriptpubkey_address?: string;
    value: number;
  };
}

export interface LiveTransactionOutput {
  scriptpubkey_address?: string;
  value: number;
}

export interface LiveTransaction {
  txid: string;
  version: number;
  locktime: number;
  vin: LiveTransactionInput[];
  vout: LiveTransactionOutput[];
  size: number;
  weight: number;
  fee: number;
  status: {
    confirmed: boolean;
    block_height?: number;
    block_hash?: string;
    block_time?: number;
  };
}

export interface LiveAddressSummary {
  address: string;
  chain: string;
  confirmedBalance: number; // in Satoshis
  unconfirmedBalance: number;
  totalReceived: number;
  totalSent: number;
  txCount: number;
  firstSeen?: string;
  lastSeen?: string;
  scriptType: string;
}

export interface LiveUtxo {
  txid: string;
  vout: number;
  status: {
    confirmed: boolean;
    block_height?: number;
    block_hash?: string;
    block_time?: number;
  };
  value: number;
}

interface InvestigationStore {
  activeTargetAddress: string;
  summary: LiveAddressSummary | null;
  transactions: LiveTransaction[];
  utxos: LiveUtxo[];
  isLoading: boolean;
  error: string | null;
  setActiveTarget: (address: string) => Promise<void>;
  refreshTargetData: () => Promise<void>;
}

const DEFAULT_TARGET = '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa'; // Genesis / Satoshi Address

interface CachedAddressData {
  summary: LiveAddressSummary;
  transactions: LiveTransaction[];
  utxos: LiveUtxo[];
  cachedAt: number;
}

const addressCacheMap = new Map<string, CachedAddressData>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes in-memory cache

export const useInvestigationStore = create<InvestigationStore>((set, get) => ({
  activeTargetAddress: DEFAULT_TARGET,
  summary: null,
  transactions: [],
  utxos: [],
  isLoading: false,
  error: null,

  setActiveTarget: async (address: string) => {
    const cleanAddr = address.trim();
    if (!cleanAddr) return;
    set({ activeTargetAddress: cleanAddr, error: null });

    // 0ms Cache Fast-Path
    const cached = addressCacheMap.get(cleanAddr);
    if (cached && (Date.now() - cached.cachedAt < CACHE_TTL_MS)) {
      set({
        summary: cached.summary,
        transactions: cached.transactions,
        utxos: cached.utxos,
        isLoading: false,
        error: null,
      });
      return;
    }

    set({ isLoading: true });
    await get().refreshTargetData();
  },

  refreshTargetData: async () => {
    const target = get().activeTargetAddress;
    if (!target) return;

    // Check Cache first
    const cached = addressCacheMap.get(target);
    if (cached && (Date.now() - cached.cachedAt < CACHE_TTL_MS) && get().summary) {
      set({
        summary: cached.summary,
        transactions: cached.transactions,
        utxos: cached.utxos,
        isLoading: false,
        error: null,
      });
      return;
    }

    set({ isLoading: true, error: null });

    try {
      // 1. Fetch live address summary from Mempool.space API
      const statsRes = await fetch(`https://mempool.space/api/address/${target}`);
      if (!statsRes.ok) {
        throw new Error(`Failed to fetch live address details for ${target}`);
      }
      const statsData = await statsRes.json();

      const chainStats = statsData.chain_stats || { funded_txo_sum: 0, spent_txo_sum: 0, tx_count: 0 };
      const mempoolStats = statsData.mempool_stats || { funded_txo_sum: 0, spent_txo_sum: 0, tx_count: 0 };

      const confirmedBal = chainStats.funded_txo_sum - chainStats.spent_txo_sum;
      const unconfirmedBal = mempoolStats.funded_txo_sum - mempoolStats.spent_txo_sum;

      // Determine script type based on prefix
      let scriptType = 'P2PKH';
      if (target.startsWith('3')) scriptType = 'P2SH';
      else if (target.startsWith('bc1q')) scriptType = 'P2WPKH (Native SegWit)';
      else if (target.startsWith('bc1p')) scriptType = 'P2TR (Taproot)';

      // 2. Fetch live transactions
      let txs: LiveTransaction[] = [];
      try {
        const txRes = await fetch(`https://mempool.space/api/address/${target}/txs`);
        if (txRes.ok) {
          txs = await txRes.json();
        }
      } catch (err) {
        console.warn('Mempool transactions fetch fallback:', err);
      }

      // 3. Fetch live UTXOs
      let utxosList: LiveUtxo[] = [];
      try {
        const utxoRes = await fetch(`https://mempool.space/api/address/${target}/utxo`);
        if (utxoRes.ok) {
          utxosList = await utxoRes.json();
        }
      } catch (err) {
        console.warn('Mempool UTXOs fetch fallback:', err);
      }

      // Calculate first and last seen timestamps from txs
      let firstSeenStr: string | undefined = undefined;
      let lastSeenStr: string | undefined = undefined;

      if (txs.length > 0) {
        const timestamps = txs
          .map(t => t.status.block_time)
          .filter((t): t is number => Boolean(t))
          .sort((a, b) => a - b);

        if (timestamps.length > 0) {
          firstSeenStr = new Date(timestamps[0] * 1000).toISOString();
          lastSeenStr = new Date(timestamps[timestamps.length - 1] * 1000).toISOString();
        }
      }

      const summary: LiveAddressSummary = {
        address: target,
        chain: 'Bitcoin Mainnet',
        confirmedBalance: Math.max(0, confirmedBal),
        unconfirmedBalance: unconfirmedBal,
        totalReceived: chainStats.funded_txo_sum,
        totalSent: chainStats.spent_txo_sum,
        txCount: chainStats.tx_count + mempoolStats.tx_count,
        firstSeen: firstSeenStr,
        lastSeen: lastSeenStr,
        scriptType,
      };

      // Save to 0ms in-memory cache
      addressCacheMap.set(target, {
        summary,
        transactions: txs,
        utxos: utxosList,
        cachedAt: Date.now(),
      });

      set({
        summary,
        transactions: txs,
        utxos: utxosList,
        isLoading: false,
        error: null,
      });
    } catch (err: any) {
      console.error('Error fetching live blockchain data:', err);
      set({
        isLoading: false,
        error: err.message || 'No live data available for this target address.',
      });
    }
  },
}));
