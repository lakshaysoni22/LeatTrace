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

    // 0ms Cache Fast-Path — show cached data instantly
    const cached = addressCacheMap.get(cleanAddr);
    if (cached) {
      set({
        summary: cached.summary,
        transactions: cached.transactions,
        utxos: cached.utxos,
        isLoading: false,
        error: null,
      });
      // If cache is still fresh, skip network
      if (Date.now() - cached.cachedAt < CACHE_TTL_MS) return;
    }

    // Background refresh — don't block UI
    set({ isLoading: !cached }); // only show loading if no cached data at all
    await get().refreshTargetData();
  },

  refreshTargetData: async () => {
    const target = get().activeTargetAddress;
    if (!target) return;

    // Check Cache first — address must match
    const cached = addressCacheMap.get(target);
    const currentSummary = get().summary;
    if (cached && (Date.now() - cached.cachedAt < CACHE_TTL_MS) && currentSummary?.address === target) {
      set({
        summary: cached.summary,
        transactions: cached.transactions,
        utxos: cached.utxos,
        isLoading: false,
        error: null,
      });
      return;
    }

    // Only show loading spinner if we have zero data for this address
    if (!currentSummary || currentSummary.address !== target) {
      set({ isLoading: true, error: null });
    }

    try {
      // Parallel fetch — all 3 APIs at once for maximum speed
      const [statsResult, txResult, utxoResult] = await Promise.allSettled([
        fetch(`https://mempool.space/api/address/${target}`),
        fetch(`https://mempool.space/api/address/${target}/txs`),
        fetch(`https://mempool.space/api/address/${target}/utxo`),
      ]);

      // Abort if target changed while fetching
      if (get().activeTargetAddress !== target) return;

      // 1. Parse address summary
      if (statsResult.status !== 'fulfilled' || !statsResult.value.ok) {
        throw new Error(`Failed to fetch live address details for ${target}`);
      }
      const statsData = await statsResult.value.json();

      const chainStats = statsData.chain_stats || { funded_txo_sum: 0, spent_txo_sum: 0, tx_count: 0 };
      const mempoolStats = statsData.mempool_stats || { funded_txo_sum: 0, spent_txo_sum: 0, tx_count: 0 };

      const confirmedBal = chainStats.funded_txo_sum - chainStats.spent_txo_sum;
      const unconfirmedBal = mempoolStats.funded_txo_sum - mempoolStats.spent_txo_sum;

      // Determine script type based on prefix
      let scriptType = 'P2PKH';
      if (target.startsWith('3')) scriptType = 'P2SH';
      else if (target.startsWith('bc1q')) scriptType = 'P2WPKH (Native SegWit)';
      else if (target.startsWith('bc1p')) scriptType = 'P2TR (Taproot)';

      // 2. Parse transactions
      let txs: LiveTransaction[] = [];
      if (txResult.status === 'fulfilled' && txResult.value.ok) {
        try { txs = await txResult.value.json(); } catch { /* skip */ }
      }

      // 3. Parse UTXOs
      let utxosList: LiveUtxo[] = [];
      if (utxoResult.status === 'fulfilled' && utxoResult.value.ok) {
        try { utxosList = await utxoResult.value.json(); } catch { /* skip */ }
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
