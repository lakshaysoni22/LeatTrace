import { create } from 'zustand';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES — Live Blockchain Data from Mempool.space
// ═══════════════════════════════════════════════════════════════════════════════

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
  confirmedBalance: number;
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

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES — Computed Investigation Metadata
// ═══════════════════════════════════════════════════════════════════════════════

export interface InvestigationAlert {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  type: string;
  message: string;
  timestamp: string;
  walletAddress: string;
  isRead: boolean;
}

export interface AuditLogEntry {
  id: string;
  action: string;
  detail: string;
  timestamp: string;
  walletAddress: string;
  username: string;
  status: 'success' | 'failure' | 'info';
}

export interface CounterpartyInfo {
  address: string;
  totalIn: number;   // satoshis received FROM this address
  totalOut: number;   // satoshis sent TO this address
  txCount: number;
  lastSeen: string;
  direction: 'inbound' | 'outbound' | 'both';
}

export interface EvidenceItem {
  id: string;
  type: 'large_transfer' | 'high_frequency' | 'unconfirmed' | 'utxo_concentration' | 'pattern';
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  timestamp: string;
  txid?: string;
  value?: number;
  walletAddress: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// STORE INTERFACE
// ═══════════════════════════════════════════════════════════════════════════════

interface InvestigationStore {
  // Core blockchain data
  activeTargetAddress: string;
  summary: LiveAddressSummary | null;
  transactions: LiveTransaction[];
  utxos: LiveUtxo[];
  isLoading: boolean;
  error: string | null;

  // Investigation metadata
  investigationId: string;
  investigationStartedAt: string;
  riskScore: number;          // 0-100
  riskLevel: 'low' | 'medium' | 'high' | 'critical';

  // Computed data for all pages
  alerts: InvestigationAlert[];
  auditLog: AuditLogEntry[];
  counterparties: CounterpartyInfo[];
  evidenceItems: EvidenceItem[];

  // Actions
  setActiveTarget: (address: string) => Promise<void>;
  refreshTargetData: () => Promise<void>;
  addAuditEntry: (action: string, detail: string) => void;
  markAlertRead: (id: string) => void;
  markAllAlertsRead: () => void;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS & CACHE
// ═══════════════════════════════════════════════════════════════════════════════

const DEFAULT_TARGET = '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa';
const LS_KEY = 'leattrace_investigation_cache';
const LS_AUDIT_KEY = 'leattrace_audit_log';

interface CachedAddressData {
  summary: LiveAddressSummary;
  transactions: LiveTransaction[];
  utxos: LiveUtxo[];
  cachedAt: number;
}

const addressCacheMap = new Map<string, CachedAddressData>();
const CACHE_TTL_MS = 5 * 60 * 1000;

// ═══════════════════════════════════════════════════════════════════════════════
// PERSISTENCE HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

function loadPersistedCache(): { address: string; data: CachedAddressData | null } {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return { address: DEFAULT_TARGET, data: null };
    const parsed = JSON.parse(raw) as { address: string; data: CachedAddressData };
    if (parsed.address && parsed.data) {
      addressCacheMap.set(parsed.address, parsed.data);
      return { address: parsed.address, data: parsed.data };
    }
  } catch { /* ignore */ }
  return { address: DEFAULT_TARGET, data: null };
}

function persistToLocalStorage(address: string, data: CachedAddressData) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify({ address, data }));
  } catch { /* quota exceeded */ }
}

function loadAuditLog(): AuditLogEntry[] {
  try {
    const raw = localStorage.getItem(LS_AUDIT_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as AuditLogEntry[];
  } catch { return []; }
}

function persistAuditLog(entries: AuditLogEntry[]) {
  try {
    localStorage.setItem(LS_AUDIT_KEY, JSON.stringify(entries.slice(0, 200)));
  } catch { /* skip */ }
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPUTATION HELPERS — Pure functions for derived data
// ═══════════════════════════════════════════════════════════════════════════════

function generateInvestigationId(address: string): string {
  let hash = 0;
  for (let i = 0; i < address.length; i++) {
    const ch = address.charCodeAt(i);
    hash = ((hash << 5) - hash) + ch;
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).toUpperCase().padStart(8, '0');
  return `INV-${hex.slice(0, 4)}-${hex.slice(4, 8)}`;
}

function computeCounterparties(txs: LiveTransaction[], targetAddr: string): CounterpartyInfo[] {
  const map = new Map<string, { totalIn: number; totalOut: number; txCount: number; lastSeen: number }>();

  txs.forEach(tx => {
    const blockTime = tx.status.block_time || Math.floor(Date.now() / 1000);

    // Inbound: addresses that sent TO target
    tx.vin.forEach(inp => {
      const addr = inp.prevout?.scriptpubkey_address;
      if (addr && addr !== targetAddr) {
        const isSendingToTarget = tx.vout.some(o => o.scriptpubkey_address === targetAddr);
        if (isSendingToTarget) {
          const entry = map.get(addr) || { totalIn: 0, totalOut: 0, txCount: 0, lastSeen: 0 };
          entry.totalIn += inp.prevout?.value || 0;
          entry.txCount++;
          entry.lastSeen = Math.max(entry.lastSeen, blockTime);
          map.set(addr, entry);
        }
      }
    });

    // Outbound: addresses that received FROM target
    const isTargetSending = tx.vin.some(inp => inp.prevout?.scriptpubkey_address === targetAddr);
    if (isTargetSending) {
      tx.vout.forEach(out => {
        const addr = out.scriptpubkey_address;
        if (addr && addr !== targetAddr) {
          const entry = map.get(addr) || { totalIn: 0, totalOut: 0, txCount: 0, lastSeen: 0 };
          entry.totalOut += out.value;
          entry.txCount++;
          entry.lastSeen = Math.max(entry.lastSeen, tx.status.block_time || Math.floor(Date.now() / 1000));
          map.set(addr, entry);
        }
      });
    }
  });

  return Array.from(map.entries()).map(([address, data]) => ({
    address,
    totalIn: data.totalIn,
    totalOut: data.totalOut,
    txCount: data.txCount,
    lastSeen: new Date(data.lastSeen * 1000).toISOString(),
    direction: data.totalIn > 0 && data.totalOut > 0 ? 'both' as const :
               data.totalIn > 0 ? 'inbound' as const : 'outbound' as const,
  })).sort((a, b) => (b.totalIn + b.totalOut) - (a.totalIn + a.totalOut));
}

function computeRiskScore(summary: LiveAddressSummary | null, txs: LiveTransaction[], utxos: LiveUtxo[], targetAddr: string): number {
  if (!summary) return 0;
  let score = 0;

  // High tx count = higher risk
  if (summary.txCount > 1000) score += 25;
  else if (summary.txCount > 100) score += 15;
  else if (summary.txCount > 10) score += 5;

  // Large balance
  const balBtc = summary.confirmedBalance / 1e8;
  if (balBtc > 100) score += 20;
  else if (balBtc > 10) score += 10;
  else if (balBtc > 1) score += 5;

  // High volume throughput
  const totalVolume = (summary.totalReceived + summary.totalSent) / 1e8;
  if (totalVolume > 10000) score += 20;
  else if (totalVolume > 1000) score += 15;
  else if (totalVolume > 100) score += 10;

  // Recent activity (last 48h)
  const now = Date.now();
  const recentTxs = txs.filter(tx => {
    const bt = tx.status.block_time;
    return bt && (now - bt * 1000) < 48 * 60 * 60 * 1000;
  });
  if (recentTxs.length > 10) score += 15;
  else if (recentTxs.length > 3) score += 10;
  else if (recentTxs.length > 0) score += 5;

  // Unconfirmed transactions
  const unconfirmed = txs.filter(tx => !tx.status.confirmed);
  if (unconfirmed.length > 0) score += 10;

  // UTXO concentration
  if (utxos.length === 1 && summary.confirmedBalance > 1e8) score += 5;

  return Math.min(100, score);
}

function getRiskLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
  if (score >= 75) return 'critical';
  if (score >= 50) return 'high';
  if (score >= 25) return 'medium';
  return 'low';
}

function generateAlerts(summary: LiveAddressSummary | null, txs: LiveTransaction[], utxos: LiveUtxo[], targetAddr: string): InvestigationAlert[] {
  if (!summary) return [];
  const alerts: InvestigationAlert[] = [];
  const now = new Date().toISOString();

  // Large balance alert
  const balBtc = summary.confirmedBalance / 1e8;
  if (balBtc > 100) {
    alerts.push({
      id: `alert-bal-${targetAddr.slice(-6)}`,
      severity: 'high', type: 'large_balance',
      message: `Target wallet holds ${balBtc.toFixed(4)} BTC (${(balBtc * 60000).toLocaleString()} USD est.)`,
      timestamp: now, walletAddress: targetAddr, isRead: false,
    });
  }

  // High transaction volume
  if (summary.txCount > 500) {
    alerts.push({
      id: `alert-txvol-${targetAddr.slice(-6)}`,
      severity: 'medium', type: 'high_volume',
      message: `${summary.txCount.toLocaleString()} total transactions detected — indicates high-volume activity`,
      timestamp: now, walletAddress: targetAddr, isRead: false,
    });
  }

  // Recent activity spike
  const recentTxs = txs.filter(tx => {
    const bt = tx.status.block_time;
    return bt && (Date.now() - bt * 1000) < 48 * 60 * 60 * 1000;
  });
  if (recentTxs.length > 5) {
    alerts.push({
      id: `alert-spike-${targetAddr.slice(-6)}`,
      severity: 'high', type: 'activity_spike',
      message: `${recentTxs.length} transactions in the last 48 hours — unusual activity spike`,
      timestamp: now, walletAddress: targetAddr, isRead: false,
    });
  }

  // Unconfirmed transactions
  const unconfirmed = txs.filter(tx => !tx.status.confirmed);
  if (unconfirmed.length > 0) {
    alerts.push({
      id: `alert-unconf-${targetAddr.slice(-6)}`,
      severity: 'medium', type: 'unconfirmed_tx',
      message: `${unconfirmed.length} unconfirmed transaction(s) detected in mempool`,
      timestamp: now, walletAddress: targetAddr, isRead: false,
    });
  }

  // Large individual transfers
  txs.slice(0, 25).forEach(tx => {
    const totalOut = tx.vout.reduce((s, o) => s + o.value, 0);
    if (totalOut > 1e8) { // > 1 BTC
      const existingId = `alert-ltx-${tx.txid.slice(0, 8)}`;
      if (!alerts.find(a => a.id === existingId)) {
        alerts.push({
          id: existingId,
          severity: totalOut > 10e8 ? 'critical' : 'high',
          type: 'large_transfer',
          message: `Large transfer: ${(totalOut / 1e8).toFixed(4)} BTC in tx ${tx.txid.slice(0, 12)}…`,
          timestamp: tx.status.block_time ? new Date(tx.status.block_time * 1000).toISOString() : now,
          walletAddress: targetAddr, isRead: false,
        });
      }
    }
  });

  // UTXO concentration
  if (utxos.length > 0) {
    const maxUtxo = Math.max(...utxos.map(u => u.value));
    const totalVal = utxos.reduce((s, u) => s + u.value, 0);
    if (totalVal > 0 && maxUtxo / totalVal > 0.8) {
      alerts.push({
        id: `alert-utxoconc-${targetAddr.slice(-6)}`,
        severity: 'low', type: 'utxo_concentration',
        message: `${((maxUtxo / totalVal) * 100).toFixed(0)}% of funds concentrated in a single UTXO`,
        timestamp: now, walletAddress: targetAddr, isRead: false,
      });
    }
  }

  // First/last activity metadata
  if (summary.firstSeen) {
    alerts.push({
      id: `alert-meta-${targetAddr.slice(-6)}`,
      severity: 'info', type: 'metadata',
      message: `Wallet active from ${new Date(summary.firstSeen).toLocaleDateString()} to ${summary.lastSeen ? new Date(summary.lastSeen).toLocaleDateString() : 'present'}`,
      timestamp: now, walletAddress: targetAddr, isRead: false,
    });
  }

  return alerts.sort((a, b) => {
    const sev = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
    return sev[a.severity] - sev[b.severity];
  });
}

function generateEvidenceItems(summary: LiveAddressSummary | null, txs: LiveTransaction[], utxos: LiveUtxo[], targetAddr: string): EvidenceItem[] {
  if (!summary) return [];
  const items: EvidenceItem[] = [];
  const now = new Date().toISOString();

  // Large transfers as evidence
  txs.slice(0, 25).forEach(tx => {
    const targetReceived = tx.vout.filter(o => o.scriptpubkey_address === targetAddr).reduce((s, o) => s + o.value, 0);
    const targetSent = tx.vin.filter(i => i.prevout?.scriptpubkey_address === targetAddr).reduce((s, i) => s + (i.prevout?.value || 0), 0);
    const relevantAmount = Math.max(targetReceived, targetSent);

    if (relevantAmount > 1e8) {
      items.push({
        id: `ev-tx-${tx.txid.slice(0, 8)}`,
        type: 'large_transfer',
        title: `Large ${targetReceived > targetSent ? 'Inbound' : 'Outbound'} Transfer`,
        description: `${(relevantAmount / 1e8).toFixed(4)} BTC ${targetReceived > targetSent ? 'received' : 'sent'} in tx ${tx.txid.slice(0, 16)}…`,
        severity: relevantAmount > 10e8 ? 'critical' : 'high',
        timestamp: tx.status.block_time ? new Date(tx.status.block_time * 1000).toISOString() : now,
        txid: tx.txid,
        value: relevantAmount,
        walletAddress: targetAddr,
      });
    }
  });

  // Unconfirmed transaction evidence
  const unconfirmed = txs.filter(tx => !tx.status.confirmed);
  unconfirmed.forEach(tx => {
    items.push({
      id: `ev-unconf-${tx.txid.slice(0, 8)}`,
      type: 'unconfirmed',
      title: 'Unconfirmed Transaction Detected',
      description: `Pending tx ${tx.txid.slice(0, 16)}… with fee ${(tx.fee / 1e8).toFixed(8)} BTC`,
      severity: 'medium',
      timestamp: now,
      txid: tx.txid,
      value: tx.vout.reduce((s, o) => s + o.value, 0),
      walletAddress: targetAddr,
    });
  });

  // UTXO concentration pattern
  if (utxos.length > 0) {
    const totalVal = utxos.reduce((s, u) => s + u.value, 0);
    const maxUtxo = Math.max(...utxos.map(u => u.value));
    if (totalVal > 0 && maxUtxo / totalVal > 0.8) {
      items.push({
        id: `ev-utxo-conc-${targetAddr.slice(-6)}`,
        type: 'utxo_concentration',
        title: 'UTXO Concentration Pattern',
        description: `${((maxUtxo / totalVal) * 100).toFixed(0)}% of ${(totalVal / 1e8).toFixed(4)} BTC concentrated in single UTXO`,
        severity: 'medium',
        timestamp: now,
        walletAddress: targetAddr,
      });
    }
  }

  // High frequency pattern
  const recentTxs = txs.filter(tx => {
    const bt = tx.status.block_time;
    return bt && (Date.now() - bt * 1000) < 24 * 60 * 60 * 1000;
  });
  if (recentTxs.length > 5) {
    items.push({
      id: `ev-highfreq-${targetAddr.slice(-6)}`,
      type: 'high_frequency',
      title: 'High Frequency Activity Pattern',
      description: `${recentTxs.length} transactions in the last 24 hours detected`,
      severity: 'high',
      timestamp: now,
      walletAddress: targetAddr,
    });
  }

  return items.sort((a, b) => {
    const sev = { critical: 0, high: 1, medium: 2, low: 3 };
    return (sev[a.severity] ?? 3) - (sev[b.severity] ?? 3);
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// HYDRATE INITIAL STATE
// ═══════════════════════════════════════════════════════════════════════════════

const persisted = loadPersistedCache();
const initialAudit = loadAuditLog();

const initialSummary = persisted.data?.summary ?? null;
const initialTxs = persisted.data?.transactions ?? [];
const initialUtxos = persisted.data?.utxos ?? [];

// ═══════════════════════════════════════════════════════════════════════════════
// STORE
// ═══════════════════════════════════════════════════════════════════════════════

export const useInvestigationStore = create<InvestigationStore>((set, get) => ({
  // Core data — hydrated from localStorage
  activeTargetAddress: persisted.address,
  summary: initialSummary,
  transactions: initialTxs,
  utxos: initialUtxos,
  isLoading: false,
  error: null,

  // Investigation metadata — computed from hydrated data
  investigationId: generateInvestigationId(persisted.address),
  investigationStartedAt: initialSummary?.firstSeen || new Date().toISOString(),
  riskScore: computeRiskScore(initialSummary, initialTxs, initialUtxos, persisted.address),
  riskLevel: getRiskLevel(computeRiskScore(initialSummary, initialTxs, initialUtxos, persisted.address)),

  // Computed data
  alerts: generateAlerts(initialSummary, initialTxs, initialUtxos, persisted.address),
  auditLog: initialAudit,
  counterparties: computeCounterparties(initialTxs, persisted.address),
  evidenceItems: generateEvidenceItems(initialSummary, initialTxs, initialUtxos, persisted.address),

  // ── Actions ───────────────────────────────────────────────────────────────

  addAuditEntry: (action: string, detail: string) => {
    const entry: AuditLogEntry = {
      id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      action,
      detail,
      timestamp: new Date().toISOString(),
      walletAddress: get().activeTargetAddress,
      username: 'Investigator',
      status: 'success',
    };
    const updated = [entry, ...get().auditLog].slice(0, 200);
    set({ auditLog: updated });
    persistAuditLog(updated);
  },

  markAlertRead: (id: string) => {
    set({ alerts: get().alerts.map(a => a.id === id ? { ...a, isRead: true } : a) });
  },

  markAllAlertsRead: () => {
    set({ alerts: get().alerts.map(a => ({ ...a, isRead: true })) });
  },

  setActiveTarget: async (address: string) => {
    const cleanAddr = address.trim();
    if (!cleanAddr) return;

    const prevAddr = get().activeTargetAddress;

    // Clear previous investigation data & set new target
    set({
      activeTargetAddress: cleanAddr,
      error: null,
      investigationId: generateInvestigationId(cleanAddr),
      investigationStartedAt: new Date().toISOString(),
    });

    // Log wallet change
    if (prevAddr !== cleanAddr) {
      get().addAuditEntry('WALLET_CHANGED', `Investigation target changed from ${prevAddr.slice(0, 12)}… to ${cleanAddr.slice(0, 12)}…`);
    }

    // Cache Fast-Path
    const cached = addressCacheMap.get(cleanAddr);
    if (cached) {
      const risk = computeRiskScore(cached.summary, cached.transactions, cached.utxos, cleanAddr);
      set({
        summary: cached.summary,
        transactions: cached.transactions,
        utxos: cached.utxos,
        isLoading: false,
        error: null,
        riskScore: risk,
        riskLevel: getRiskLevel(risk),
        alerts: generateAlerts(cached.summary, cached.transactions, cached.utxos, cleanAddr),
        counterparties: computeCounterparties(cached.transactions, cleanAddr),
        evidenceItems: generateEvidenceItems(cached.summary, cached.transactions, cached.utxos, cleanAddr),
      });
      if (Date.now() - cached.cachedAt < CACHE_TTL_MS) return;
    } else {
      // Clear stale data from previous wallet
      set({
        summary: null,
        transactions: [],
        utxos: [],
        riskScore: 0,
        riskLevel: 'low',
        alerts: [],
        counterparties: [],
        evidenceItems: [],
      });
    }

    set({ isLoading: !cached });
    await get().refreshTargetData();
  },

  refreshTargetData: async () => {
    const target = get().activeTargetAddress;
    if (!target) return;

    const cached = addressCacheMap.get(target);
    const currentSummary = get().summary;
    if (cached && (Date.now() - cached.cachedAt < CACHE_TTL_MS) && currentSummary?.address === target) {
      set({ isLoading: false });
      return;
    }

    if (!currentSummary || currentSummary.address !== target) {
      set({ isLoading: true, error: null });
    }

    try {
      const [statsResult, txResult, utxoResult] = await Promise.allSettled([
        fetch(`https://mempool.space/api/address/${target}`),
        fetch(`https://mempool.space/api/address/${target}/txs`),
        fetch(`https://mempool.space/api/address/${target}/utxo`),
      ]);

      if (get().activeTargetAddress !== target) return;

      if (statsResult.status !== 'fulfilled' || !statsResult.value.ok) {
        throw new Error(`Failed to fetch live address details for ${target}`);
      }
      const statsData = await statsResult.value.json();

      const chainStats = statsData.chain_stats || { funded_txo_sum: 0, spent_txo_sum: 0, tx_count: 0 };
      const mempoolStats = statsData.mempool_stats || { funded_txo_sum: 0, spent_txo_sum: 0, tx_count: 0 };

      const confirmedBal = chainStats.funded_txo_sum - chainStats.spent_txo_sum;
      const unconfirmedBal = mempoolStats.funded_txo_sum - mempoolStats.spent_txo_sum;

      let scriptType = 'P2PKH';
      if (target.startsWith('3')) scriptType = 'P2SH';
      else if (target.startsWith('bc1q')) scriptType = 'P2WPKH (Native SegWit)';
      else if (target.startsWith('bc1p')) scriptType = 'P2TR (Taproot)';

      let txs: LiveTransaction[] = [];
      if (txResult.status === 'fulfilled' && txResult.value.ok) {
        try { txs = await txResult.value.json(); } catch { /* skip */ }
      }

      let utxosList: LiveUtxo[] = [];
      if (utxoResult.status === 'fulfilled' && utxoResult.value.ok) {
        try { utxosList = await utxoResult.value.json(); } catch { /* skip */ }
      }

      let firstSeenStr: string | undefined;
      let lastSeenStr: string | undefined;
      if (txs.length > 0) {
        const timestamps = txs.map(t => t.status.block_time).filter((t): t is number => Boolean(t)).sort((a, b) => a - b);
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

      const cacheEntry: CachedAddressData = { summary, transactions: txs, utxos: utxosList, cachedAt: Date.now() };
      addressCacheMap.set(target, cacheEntry);
      persistToLocalStorage(target, cacheEntry);

      const risk = computeRiskScore(summary, txs, utxosList, target);

      set({
        summary,
        transactions: txs,
        utxos: utxosList,
        isLoading: false,
        error: null,
        riskScore: risk,
        riskLevel: getRiskLevel(risk),
        alerts: generateAlerts(summary, txs, utxosList, target),
        counterparties: computeCounterparties(txs, target),
        evidenceItems: generateEvidenceItems(summary, txs, utxosList, target),
      });

      get().addAuditEntry('ANALYSIS_EXECUTED', `Blockchain analysis completed for ${target.slice(0, 16)}… — ${summary.txCount} txs, ${(summary.confirmedBalance / 1e8).toFixed(4)} BTC balance`);

    } catch (err: any) {
      console.error('Error fetching live blockchain data:', err);
      set({
        isLoading: false,
        error: err.message || 'No live blockchain data available.',
      });
      get().addAuditEntry('ANALYSIS_FAILED', `Failed to fetch data for ${target.slice(0, 16)}…: ${err.message || 'Unknown error'}`);
    }
  },
}));
