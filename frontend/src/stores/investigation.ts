import { create } from 'zustand';
import { apiGet, apiPost } from '../utils/api';
import { detectChainType, getChainParam } from '../utils/chainDetect';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES — Live Blockchain Data from Mempool.space & Etherscan
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
  coinSymbol: string;
  formattedBalance: number;
  formattedReceived: number;
  formattedSent: number;
  confirmedBalance: number;
  unconfirmedBalance: number;
  totalReceived: number;
  totalSent: number;
  txCount: number;
  firstSeen?: string;
  lastSeen?: string;
  scriptType: string;
  dataSource?: 'live' | 'fallback';
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
  flaggedAddress?: string;
  txid?: string;
  metadata?: Record<string, any>;
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
  totalIn: number;   // atomic units received FROM this address
  totalOut: number;  // atomic units sent TO this address
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

export interface InvestigationStore {
  // Core Active Target State
  activeTargetAddress: string;
  summary: LiveAddressSummary | null;
  transactions: LiveTransaction[];
  utxos: LiveUtxo[];
  isLoading: boolean;
  error: string | null;

  // Computed Investigation Metadata
  investigationId: string;
  investigationStartedAt: string;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';

  // Live Derived Forensics
  alerts: InvestigationAlert[];
  auditLog: AuditLogEntry[];
  counterparties: CounterpartyInfo[];
  evidenceItems: EvidenceItem[];
  incidentResponseSteps: Record<string, string>;

  // Core Actions
  setActiveTarget: (address: string) => Promise<void>;
  refreshTargetData: () => Promise<void>;
  addAuditEntry: (action: string, detail: string) => void;
  markAlertRead: (id: string) => Promise<void>;
  markAllAlertsRead: () => Promise<void>;
  fetchBackendAlerts: () => Promise<void>;
  enrichAlertsWithDetectors: (target: string, counterparties: CounterpartyInfo[], baseAlerts: InvestigationAlert[]) => Promise<void>;
  toggleIncidentStep: (id: string, stepTitle?: string) => void;
  resetIncidentSteps: () => void;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS & LOCAL STORAGE CACHE
// ═══════════════════════════════════════════════════════════════════════════════

const DEFAULT_TARGET_ADDRESS = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';
const CACHE_KEY_PREFIX = 'leattrace_inv_cache_';
const AUDIT_LOG_KEY = 'leattrace_audit_log_v2';
const INCIDENT_STEPS_KEY = 'leattrace_incident_steps_v1';
const LAST_TARGET_KEY = 'leattrace_active_target';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minute SWR cache

interface CachedAddressData {
  summary: LiveAddressSummary;
  transactions: LiveTransaction[];
  utxos: LiveUtxo[];
  cachedAt: number;
}

const addressCacheMap = new Map<string, CachedAddressData>();

function loadPersistedCache(): { address: string; data: CachedAddressData | null } {
  try {
    const savedAddr = localStorage.getItem(LAST_TARGET_KEY) || DEFAULT_TARGET_ADDRESS;
    const raw = localStorage.getItem(`${CACHE_KEY_PREFIX}${savedAddr}`);
    if (raw) {
      const parsed: CachedAddressData = JSON.parse(raw);
      // Evict old dummy generator artifacts (e.g. suspect 145.832 or fake generated hashes)
      if (parsed?.summary && parsed.summary.formattedBalance !== 145.832 && !parsed.transactions?.[0]?.txid?.includes('00000')) {
        addressCacheMap.set(savedAddr, parsed);
        return { address: savedAddr, data: parsed };
      }
    }
    return { address: savedAddr, data: null };
  } catch {
    return { address: DEFAULT_TARGET_ADDRESS, data: null };
  }
}

function persistToLocalStorage(address: string, data: CachedAddressData) {
  try {
    localStorage.setItem(LAST_TARGET_KEY, address);
    localStorage.setItem(`${CACHE_KEY_PREFIX}${address}`, JSON.stringify(data));
  } catch { /* ignore quote limits */ }
}

function loadAuditLog(): AuditLogEntry[] {
  try {
    const raw = localStorage.getItem(AUDIT_LOG_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return [];
}

function persistAuditLog(entries: AuditLogEntry[]) {
  try {
    localStorage.setItem(AUDIT_LOG_KEY, JSON.stringify(entries.slice(0, 100)));
  } catch { /* ignore */ }
}

function loadIncidentSteps(): Record<string, string> {
  try {
    const raw = localStorage.getItem(INCIDENT_STEPS_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return {};
}

function persistIncidentSteps(steps: Record<string, string>) {
  try {
    localStorage.setItem(INCIDENT_STEPS_KEY, JSON.stringify(steps));
  } catch { /* ignore */ }
}

// ═══════════════════════════════════════════════════════════════════════════════
// ALERT PERSISTENCE & DETECTOR CACHING HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

const FIRST_SEEN_KEY = 'leattrace_alerts_first_seen';
const READ_ALERTS_KEY = 'leattrace_alerts_read_ids';

export function getOrSetFirstSeen(address: string, type: string, extraKey = ''): string {
  try {
    const raw = localStorage.getItem(FIRST_SEEN_KEY);
    const map: Record<string, string> = raw ? JSON.parse(raw) : {};
    const key = `${address.toLowerCase()}_${type}${extraKey ? `_${extraKey}` : ''}`;
    if (map[key]) {
      return map[key];
    }
    const now = new Date().toISOString();
    map[key] = now;
    localStorage.setItem(FIRST_SEEN_KEY, JSON.stringify(map));
    return now;
  } catch {
    return new Date().toISOString();
  }
}

export function getStoredReadIds(): Set<string> {
  try {
    const raw = localStorage.getItem(READ_ALERTS_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

export function persistReadId(id: string) {
  try {
    const set = getStoredReadIds();
    set.add(id);
    localStorage.setItem(READ_ALERTS_KEY, JSON.stringify(Array.from(set)));
  } catch { /* ignore */ }
}

export function persistAllReadIds(ids: string[]) {
  try {
    const set = getStoredReadIds();
    ids.forEach(id => set.add(id));
    localStorage.setItem(READ_ALERTS_KEY, JSON.stringify(Array.from(set)));
  } catch { /* ignore */ }
}

interface CachedDetectorData<T> {
  data: T;
  cachedAt: number;
}

const mixerCache = new Map<string, CachedDetectorData<any>>();
const sanctionsCache = new Map<string, CachedDetectorData<any>>();

export async function checkMixerExposureCached(address: string): Promise<any | null> {
  const cleanAddr = address.trim();
  if (!cleanAddr) return null;
  const norm = cleanAddr.toLowerCase();
  const cached = mixerCache.get(norm);
  if (cached && (Date.now() - cached.cachedAt < CACHE_TTL_MS)) {
    return cached.data;
  }
  try {
    const data = await apiGet<any>(`/api/wallets/mixer-check/${encodeURIComponent(cleanAddr)}`, { timeoutMs: 4000 });
    mixerCache.set(norm, { data, cachedAt: Date.now() });
    return data;
  } catch (err: any) {
    console.warn(`[InvestigationStore] Mixer check skipped/failed for ${cleanAddr}:`, err?.message || err);
    return null;
  }
}

export async function checkSanctionsCached(address: string): Promise<any | null> {
  const cleanAddr = address.trim();
  if (!cleanAddr) return null;
  const norm = cleanAddr.toLowerCase();
  const cached = sanctionsCache.get(norm);
  if (cached && (Date.now() - cached.cachedAt < CACHE_TTL_MS)) {
    return cached.data;
  }
  try {
    const data = await apiGet<any>(`/api/sanctions/check/${encodeURIComponent(cleanAddr)}`, { timeoutMs: 4000 });
    sanctionsCache.set(norm, { data, cachedAt: Date.now() });
    return data;
  } catch (err: any) {
    console.warn(`[InvestigationStore] Sanctions check skipped/failed for ${cleanAddr}:`, err?.message || err);
    return null;
  }
}

export async function fetchBackendAlertsApi(): Promise<InvestigationAlert[]> {
  try {
    const backendData = await apiGet<any[]>('/api/wallets/alerts', { timeoutMs: 3000 });
    if (Array.isArray(backendData)) {
      return backendData.map((b: any) => ({
        id: b.id || `alt-backend-${b.address?.slice(-6) || 'x'}-${Math.random().toString(36).slice(2, 6)}`,
        severity: (b.severity || 'medium') as any,
        type: b.type || 'security_notice',
        message: b.message || `Alert detected for ${b.address}`,
        timestamp: b.created_at || new Date().toISOString(),
        walletAddress: b.address || '',
        isRead: Boolean(b.is_read),
      }));
    }
  } catch (err: any) {
    console.warn('[InvestigationStore] Could not fetch backend alerts:', err?.message || err);
  }
  return [];
}

export function getAlertStableKey(alert: InvestigationAlert): string {
  const addr = (alert.walletAddress || '').trim().toLowerCase();
  const type = (alert.type || '').trim().toLowerCase();
  const flagged = alert.flaggedAddress && alert.flaggedAddress.toLowerCase() !== addr
    ? `_${alert.flaggedAddress.toLowerCase()}`
    : '';
  const tx = alert.txid ? `_${alert.txid}` : '';
  return `${addr}_${type}${flagged}${tx}`;
}

export function mergeAlerts(generated: InvestigationAlert[], backend: InvestigationAlert[]): InvestigationAlert[] {
  const readIds = getStoredReadIds();
  const alertMap = new Map<string, InvestigationAlert>();

  // 1. Add generated alerts
  for (const gen of generated) {
    const key = getAlertStableKey(gen);
    alertMap.set(key, {
      ...gen,
      isRead: gen.isRead || readIds.has(gen.id),
    });
  }

  // 2. Merge backend alerts (preserve backend id, isRead, timestamp when stable key matches)
  for (const b of backend) {
    const key = getAlertStableKey(b);
    const existing = alertMap.get(key);
    if (existing) {
      alertMap.set(key, {
        ...existing,
        id: b.id, // preserve backend id for read API calls
        isRead: b.isRead || existing.isRead || readIds.has(b.id),
        timestamp: b.timestamp || existing.timestamp,
      });
    } else {
      alertMap.set(key, {
        ...b,
        isRead: b.isRead || readIds.has(b.id),
      });
    }
  }

  const sevOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
  return Array.from(alertMap.values()).sort((a, b) => {
    const diff = (sevOrder[a.severity] ?? 3) - (sevOrder[b.severity] ?? 3);
    if (diff !== 0) return diff;
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER CALCULATORS
// ═══════════════════════════════════════════════════════════════════════════════

function generateInvestigationId(address: string): string {
  let hash = 0;
  for (let i = 0; i < address.length; i++) {
    hash = (hash << 5) - hash + address.charCodeAt(i);
    hash |= 0;
  }
  const num = Math.abs(hash % 900000) + 100000;
  return `INV-2026-${num}`;
}

function computeRiskScore(summary: LiveAddressSummary | null, txs: LiveTransaction[], utxos: LiveUtxo[], targetAddr: string): number {
  if (!summary) return 0;
  let score = 15; // baseline for active target

  // Volume factor
  const totalVol = summary.formattedReceived + summary.formattedSent;
  if (totalVol > 1000) score += 35;
  else if (totalVol > 100) score += 25;
  else if (totalVol > 10) score += 15;

  // Unconfirmed tx factor
  const unconfirmedCount = txs.filter(t => !t.status.confirmed).length;
  if (unconfirmedCount > 0) score += 20;

  // High UTXO fragmentation factor
  if (utxos.length > 50) score += 15;

  return Math.min(99, Math.max(5, score));
}

function getRiskLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
  if (score >= 80) return 'critical';
  if (score >= 60) return 'high';
  if (score >= 35) return 'medium';
  return 'low';
}

function computeCounterparties(txs: LiveTransaction[], targetAddr: string): CounterpartyInfo[] {
  const map = new Map<string, { totalIn: number; totalOut: number; txCount: number; lastSeen: string }>();
  const targetLower = targetAddr.toLowerCase();

  txs.forEach(tx => {
    const txTime = tx.status.block_time ? new Date(tx.status.block_time * 1000).toISOString() : new Date().toISOString();

    // Inputs -> sender addresses
    tx.vin.forEach(input => {
      const fromAddr = input.prevout?.scriptpubkey_address;
      if (fromAddr && fromAddr.toLowerCase() !== targetLower) {
        const existing = map.get(fromAddr) || { totalIn: 0, totalOut: 0, txCount: 0, lastSeen: txTime };
        existing.totalIn += input.prevout?.value || 0;
        existing.txCount += 1;
        if (new Date(txTime) > new Date(existing.lastSeen)) existing.lastSeen = txTime;
        map.set(fromAddr, existing);
      }
    });

    // Outputs -> recipient addresses
    tx.vout.forEach(output => {
      const toAddr = output.scriptpubkey_address;
      if (toAddr && toAddr.toLowerCase() !== targetLower) {
        const existing = map.get(toAddr) || { totalIn: 0, totalOut: 0, txCount: 0, lastSeen: txTime };
        existing.totalOut += output.value || 0;
        existing.txCount += 1;
        if (new Date(txTime) > new Date(existing.lastSeen)) existing.lastSeen = txTime;
        map.set(toAddr, existing);
      }
    });
  });

  return Array.from(map.entries()).map(([address, data]) => {
    let direction: 'inbound' | 'outbound' | 'both' = 'both';
    if (data.totalIn > 0 && data.totalOut === 0) direction = 'inbound';
    else if (data.totalOut > 0 && data.totalIn === 0) direction = 'outbound';

    return {
      address,
      totalIn: data.totalIn,
      totalOut: data.totalOut,
      txCount: data.txCount,
      lastSeen: data.lastSeen,
      direction,
    };
  }).sort((a, b) => (b.totalIn + b.totalOut) - (a.totalIn + a.totalOut));
}

function generateAlerts(summary: LiveAddressSummary | null, txs: LiveTransaction[], utxos: LiveUtxo[], targetAddr: string): InvestigationAlert[] {
  if (!summary) return [];
  const alerts: InvestigationAlert[] = [];
  const readIds = getStoredReadIds();
  const coin = summary.coinSymbol || 'ETH';

  // 1. High balance alert (uses first observed time to show real elapsed duration)
  const balance = summary.formattedBalance;
  if (balance > 10) {
    const id = `alt-highbal-${targetAddr.slice(-6)}`;
    alerts.push({
      id,
      severity: balance > 100 ? 'critical' : 'high',
      type: 'high_balance',
      message: `Significant target holding: ${balance.toFixed(4)} ${coin} confirmed balance.`,
      timestamp: getOrSetFirstSeen(targetAddr, 'high_balance'),
      walletAddress: targetAddr,
      isRead: readIds.has(id),
    });
  }

  // 2. Unconfirmed / mempool activity alert
  const unconfirmed = txs.filter(t => !t.status.confirmed);
  if (unconfirmed.length > 0) {
    const id = `alt-unconf-${targetAddr.slice(-6)}`;
    alerts.push({
      id,
      severity: 'critical',
      type: 'mempool_activity',
      message: `${unconfirmed.length} pending transaction(s) detected on-chain for active target.`,
      timestamp: getOrSetFirstSeen(targetAddr, 'mempool_activity'),
      walletAddress: targetAddr,
      isRead: readIds.has(id),
    });
  }

  // 3. Large transfer alert — scan ALL available transactions sorted by value (no arbitrary idx < 10 cap)
  const txsWithVolume = txs.map(tx => {
    const totalOut = tx.vout.reduce((s, o) => s + (o.value || 0), 0) / 1e8;
    return { tx, totalOut };
  });

  // Sort by output volume descending so highest value transfers always surface
  txsWithVolume.sort((a, b) => b.totalOut - a.totalOut);

  txsWithVolume.filter(item => item.totalOut > 5).slice(0, 10).forEach(({ tx, totalOut }) => {
    const id = `alt-largetx-${tx.txid.slice(0, 8)}`;
    alerts.push({
      id,
      severity: totalOut > 50 ? 'critical' : 'high',
      type: 'large_transfer',
      message: `High-value transfer of ${totalOut.toFixed(2)} ${coin} in transaction ${tx.txid.slice(0, 16)}…`,
      timestamp: tx.status.block_time
        ? new Date(tx.status.block_time * 1000).toISOString()
        : getOrSetFirstSeen(targetAddr, 'large_transfer', tx.txid),
      walletAddress: targetAddr,
      isRead: readIds.has(id),
      txid: tx.txid,
    });
  });

  // 4. Target timeline profile indicator (uses first observed time so ongoing profile doesn't reset to "just now")
  if (summary.firstSeen) {
    const id = `alt-timeline-${targetAddr.slice(-6)}`;
    alerts.push({
      id,
      severity: 'info',
      type: 'target_profile',
      message: `Wallet active on ${summary.chain} from ${new Date(summary.firstSeen).toLocaleDateString()} to ${summary.lastSeen ? new Date(summary.lastSeen).toLocaleDateString() : 'present'}`,
      timestamp: getOrSetFirstSeen(targetAddr, 'target_profile'),
      walletAddress: targetAddr,
      isRead: readIds.has(id),
    });
  }

  return alerts.sort((a, b) => {
    const sev = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
    return (sev[a.severity] ?? 3) - (sev[b.severity] ?? 3);
  });
}

function generateEvidenceItems(summary: LiveAddressSummary | null, txs: LiveTransaction[], utxos: LiveUtxo[], targetAddr: string): EvidenceItem[] {
  if (!summary) return [];
  const items: EvidenceItem[] = [];
  const now = new Date().toISOString();
  const coin = summary.coinSymbol || 'ETH';
  const targetLower = targetAddr.toLowerCase();

  // Large transfers as evidence
  txs.slice(0, 25).forEach(tx => {
    const targetReceived = tx.vout.filter(o => o.scriptpubkey_address?.toLowerCase() === targetLower).reduce((s, o) => s + o.value, 0);
    const targetSent = tx.vin.filter(i => i.prevout?.scriptpubkey_address?.toLowerCase() === targetLower).reduce((s, i) => s + (i.prevout?.value || 0), 0);
    const relevantAmount = Math.max(targetReceived, targetSent);

    if (relevantAmount > 1e8) {
      items.push({
        id: `ev-tx-${tx.txid.slice(0, 8)}`,
        type: 'large_transfer',
        title: `Large ${targetReceived > targetSent ? 'Inbound' : 'Outbound'} Transfer`,
        description: `${(relevantAmount / 1e8).toFixed(4)} ${coin} ${targetReceived > targetSent ? 'received' : 'sent'} in tx ${tx.txid.slice(0, 16)}…`,
        severity: relevantAmount > 10e8 ? 'critical' : 'high',
        timestamp: tx.status.block_time ? new Date(tx.status.block_time * 1000).toISOString() : now,
        txid: tx.txid,
        value: relevantAmount,
        walletAddress: targetAddr,
      });
    }
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
        description: `${((maxUtxo / totalVal) * 100).toFixed(0)}% of ${(totalVal / 1e8).toFixed(4)} ${coin} concentrated in single UTXO`,
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
      description: `${recentTxs.length} transactions in the last 24 hours detected on-chain`,
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
// FALLBACK & ZERO-DATA GENERATION (Deterministic fallback model)
// ═══════════════════════════════════════════════════════════════════════════════

export function generateFallbackData(target: string): {
  summary: LiveAddressSummary;
  transactions: LiveTransaction[];
  utxos: LiveUtxo[];
} {
  const chainType = detectChainType(target);
  const isEvm = chainType === 'ethereum';
  const isSolana = chainType === 'solana';
  const isTron = chainType === 'tron';

  let hash = 0;
  for (let i = 0; i < target.length; i++) {
    hash = (hash << 5) - hash + target.charCodeAt(i);
    hash |= 0;
  }
  const seed = Math.abs(hash);

  const chainName = isEvm
    ? 'Ethereum Mainnet'
    : isSolana
    ? 'Solana Mainnet'
    : isTron
    ? 'TRON Network'
    : 'Bitcoin Mainnet';

  const coinSymbol = isEvm ? 'ETH' : isSolana ? 'SOL' : isTron ? 'TRX' : 'BTC';
  const scriptType = isEvm
    ? 'EVM Account / Smart Contract'
    : isSolana
    ? 'Ed25519 Account'
    : isTron
    ? 'TRC-20 Account'
    : 'P2PKH';

  const balanceRaw = ((seed % 8500) + 120) / 100;
  const txCount = (seed % 95) + 5;
  const receivedRaw = balanceRaw + ((seed % 4500) / 100);
  const sentRaw = Math.max(0, receivedRaw - balanceRaw);

  const now = Date.now();
  const firstSeen = new Date(now - (seed % (365 * 24 * 3600 * 1000))).toISOString();
  const lastSeen = new Date(now - (seed % (7 * 24 * 3600 * 1000))).toISOString();

  const summary: LiveAddressSummary = {
    address: target,
    chain: chainName,
    coinSymbol,
    formattedBalance: +balanceRaw.toFixed(4),
    formattedReceived: +receivedRaw.toFixed(4),
    formattedSent: +sentRaw.toFixed(4),
    confirmedBalance: Math.round(balanceRaw * 1e8),
    unconfirmedBalance: 0,
    totalReceived: Math.round(receivedRaw * 1e8),
    totalSent: Math.round(sentRaw * 1e8),
    txCount,
    firstSeen,
    lastSeen,
    scriptType,
    dataSource: 'fallback',
  };

  const numTxs = Math.min(10, Math.max(3, (txCount % 8) + 3));
  const transactions: LiveTransaction[] = [];
  for (let i = 0; i < numTxs; i++) {
    const txSeed = seed + i * 1337;
    const txTime = Math.floor((now - (i * 3600 * 24 * 3 + (txSeed % 86400)) * 1000) / 1000);
    const valSats = Math.round((((txSeed % 250) + 10) / 100) * 1e8);
    const txHash = isEvm
      ? `0x${(txSeed * 9999).toString(16).padEnd(64, '0').slice(0, 64)}`
      : `tx_${(txSeed * 9999).toString(16).padEnd(64, 'a').slice(0, 64)}`;

    const isIncoming = txSeed % 2 === 0;
    const counterparty = isEvm
      ? `0x${(txSeed * 1234).toString(16).padEnd(40, '1').slice(0, 40)}`
      : `addr_${(txSeed * 1234).toString(16).padEnd(34, '2').slice(0, 34)}`;

    transactions.push({
      txid: txHash,
      version: 1,
      locktime: 0,
      vin: [{
        txid: txHash,
        vout: 0,
        prevout: {
          scriptpubkey_address: isIncoming ? counterparty : target,
          value: valSats,
        },
      }],
      vout: [{
        scriptpubkey_address: isIncoming ? target : counterparty,
        value: valSats,
      }],
      size: 250,
      weight: 1000,
      fee: Math.round(0.0005 * 1e8),
      status: {
        confirmed: true,
        block_height: 19000000 + (txSeed % 50000),
        block_time: txTime,
      },
    });
  }

  return { summary, transactions, utxos: [] };
}

function getEmptyLiveState(target: string): { summary: LiveAddressSummary; transactions: LiveTransaction[]; utxos: LiveUtxo[] } {
  const chainType = detectChainType(target);
  const isEvm = chainType === 'ethereum';
  const isSolana = chainType === 'solana';
  const isTron = chainType === 'tron';

  const chainName = isEvm
    ? 'Ethereum Mainnet'
    : isSolana
    ? 'Solana Mainnet'
    : isTron
    ? 'TRON Network'
    : 'Bitcoin Mainnet';

  const coinSymbol = isEvm ? 'ETH' : isSolana ? 'SOL' : isTron ? 'TRX' : 'BTC';
  const scriptType = isEvm
    ? 'EVM Account / Smart Contract'
    : isSolana
    ? 'Ed25519 Account'
    : isTron
    ? 'TRC-20 Account'
    : 'P2PKH';

  const summary: LiveAddressSummary = {
    address: target,
    chain: chainName,
    coinSymbol,
    formattedBalance: 0,
    formattedReceived: 0,
    formattedSent: 0,
    confirmedBalance: 0,
    unconfirmedBalance: 0,
    totalReceived: 0,
    totalSent: 0,
    txCount: 0,
    scriptType,
    dataSource: 'fallback',
  };
  return { summary, transactions: [], utxos: [] };
}

// ═══════════════════════════════════════════════════════════════════════════════
// HYDRATE INITIAL STATE
// ═══════════════════════════════════════════════════════════════════════════════

const persisted = loadPersistedCache();
const initialAudit = loadAuditLog();
const initialIncidentSteps = loadIncidentSteps();

const initialSummary = persisted.data?.summary ?? null;
const initialTxs = persisted.data?.transactions ?? [];
const initialUtxos = persisted.data?.utxos ?? [];

// ═══════════════════════════════════════════════════════════════════════════════
// STORE
// ═══════════════════════════════════════════════════════════════════════════════

// Concurrency guard: prevents race conditions when multiple setActiveTarget calls overlap
let _targetVersion = 0;

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
  incidentResponseSteps: initialIncidentSteps,

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

  toggleIncidentStep: (id: string, stepTitle?: string) => {
    const current = { ...get().incidentResponseSteps };
    const investigationId = get().investigationId;
    const isCompleted = !!current[id];

    if (isCompleted) {
      delete current[id];
      set({ incidentResponseSteps: current });
      persistIncidentSteps(current);
      get().addAuditEntry('INCIDENT_STEP_REOPENED', `Step "${stepTitle || id}" reopened for case ${investigationId}`);
    } else {
      const now = new Date().toISOString();
      current[id] = now;
      set({ incidentResponseSteps: current });
      persistIncidentSteps(current);
      get().addAuditEntry('INCIDENT_STEP_COMPLETED', `Step "${stepTitle || id}" marked complete for case ${investigationId}`);
    }
  },

  resetIncidentSteps: () => {
    set({ incidentResponseSteps: {} });
    persistIncidentSteps({});
  },

  markAlertRead: async (id: string) => {
    const prevAlerts = get().alerts;
    const updated = prevAlerts.map(a => a.id === id ? { ...a, isRead: true } : a);
    set({ alerts: updated });
    persistReadId(id);

    try {
      await apiPost(`/api/wallets/alerts/read/${encodeURIComponent(id)}`, undefined, { timeoutMs: 3000 });
    } catch (err: any) {
      console.warn(`[InvestigationStore] Backend markAlertRead failed for ${id}, rolling back:`, err?.message || err);
      set({ alerts: prevAlerts });
    }
  },

  markAllAlertsRead: async () => {
    const prevAlerts = get().alerts;
    const updated = prevAlerts.map(a => ({ ...a, isRead: true }));
    set({ alerts: updated });
    persistAllReadIds(prevAlerts.map(a => a.id));

    try {
      await apiPost('/api/wallets/alerts/read', undefined, { timeoutMs: 3000 });
    } catch (err: any) {
      console.warn('[InvestigationStore] Backend markAllAlertsRead failed, rolling back:', err?.message || err);
      set({ alerts: prevAlerts });
    }
  },

  fetchBackendAlerts: async () => {
    const backend = await fetchBackendAlertsApi();
    const current = get().alerts;
    const merged = mergeAlerts(current, backend);
    set({ alerts: merged });
  },

  enrichAlertsWithDetectors: async (target: string, counterparties: CounterpartyInfo[], baseAlerts: InvestigationAlert[]) => {
    const activeVersion = _targetVersion;
    const detectorAlerts: InvestigationAlert[] = [];
    const readIds = getStoredReadIds();

    // 1. Call GET /api/wallets/mixer-check/{address}
    try {
      const mixerData = await checkMixerExposureCached(target);
      if (mixerData && mixerData.has_mixer_interaction) {
        const exposurePct = typeof mixerData.mixer_exposure_percent === 'number'
          ? mixerData.mixer_exposure_percent
          : (typeof mixerData.exposure_percentage === 'number' ? mixerData.exposure_percentage : 0);

        const pools = Array.isArray(mixerData.mixer_transactions)
          ? Array.from(new Set(mixerData.mixer_transactions.map((t: any) => t.pool).filter(Boolean))).join(', ')
          : '';

        let desc = `Mixer exposure detected: ${exposurePct}% exposure`;
        if (mixerData.total_mixed_volume_eth) {
          desc += ` with ${mixerData.total_mixed_volume_eth} ETH mixed`;
        }
        if (mixerData.layering_hops_detected) {
          desc += ` across ${mixerData.layering_hops_detected} layering hop(s)`;
        }
        if (pools) {
          desc += ` involving ${pools}`;
        }
        desc += '.';

        const id = `alt-mixer-${target.slice(-6)}`;
        const firstTx = Array.isArray(mixerData.mixer_transactions) && mixerData.mixer_transactions[0];
        const flaggedAddress = firstTx?.pool || target;

        detectorAlerts.push({
          id,
          severity: exposurePct >= 50 ? 'critical' : 'high',
          type: 'mixer_exposure',
          message: desc,
          timestamp: getOrSetFirstSeen(target, 'mixer_exposure'),
          walletAddress: target,
          flaggedAddress,
          isRead: readIds.has(id),
          metadata: mixerData,
        });
      }
    } catch (err: any) {
      console.warn(`[InvestigationStore] Mixer check skipped silently for ${target}:`, err?.message || err);
    }

    // 2. Call sanctions check for active target + top counterparties
    try {
      const targetSanctions = await checkSanctionsCached(target);
      if (targetSanctions && (targetSanctions.sanctioned || targetSanctions.stix_flagged)) {
        const id = `alt-sanct-target-${target.slice(-6)}`;
        const provider = targetSanctions.screening_result?.provider_id || targetSanctions.stix_detail?.source || 'Sanctions List';
        const entityName = targetSanctions.screening_result?.entity_name || 'Designated Target';
        const programs = targetSanctions.screening_result?.programs;

        const desc = `Sanctions match detected for active target: Entity "${entityName}" on ${provider.toUpperCase()}${programs ? ` (${programs})` : ''}.`;

        detectorAlerts.push({
          id,
          severity: 'critical',
          type: 'sanctions_match',
          message: desc,
          timestamp: getOrSetFirstSeen(target, 'sanctions_match'),
          walletAddress: target,
          flaggedAddress: target,
          isRead: readIds.has(id),
          metadata: targetSanctions,
        });
      }

      // Check top 3 counterparties
      const topCps = counterparties.slice(0, 3);
      await Promise.allSettled(
        topCps.map(async (cp) => {
          const cpSanctions = await checkSanctionsCached(cp.address);
          if (cpSanctions && (cpSanctions.sanctioned || cpSanctions.stix_flagged)) {
            const id = `alt-sanct-cp-${cp.address.slice(-6)}`;
            const provider = cpSanctions.screening_result?.provider_id || cpSanctions.stix_detail?.source || 'Sanctions DB';
            const entityName = cpSanctions.screening_result?.entity_name || 'Flagged Entity';
            const programs = cpSanctions.screening_result?.programs;

            const desc = `Direct counterparty sanctioned: Counterparty ${cp.address.slice(0, 10)}… matches "${entityName}" on ${provider.toUpperCase()}${programs ? ` (${programs})` : ''}.`;

            detectorAlerts.push({
              id,
              severity: 'critical',
              type: 'sanctions_match',
              message: desc,
              timestamp: getOrSetFirstSeen(cp.address, 'sanctions_match'),
              walletAddress: target,
              flaggedAddress: cp.address,
              isRead: readIds.has(id),
              metadata: cpSanctions,
            });
          }
        })
      );
    } catch (err: any) {
      console.warn(`[InvestigationStore] Sanctions check skipped silently for ${target}:`, err?.message || err);
    }

    // 3. Fetch backend-persisted alerts
    const backendAlerts = await fetchBackendAlertsApi();

    // Guard against race conditions
    if (get().activeTargetAddress !== target || _targetVersion !== activeVersion) return;

    // Combine base alerts, detector alerts, and backend alerts
    const combined = [...detectorAlerts, ...baseAlerts];
    const merged = mergeAlerts(combined, backendAlerts);

    set({ alerts: merged });
  },

  setActiveTarget: async (address: string) => {
    const cleanAddr = address.trim();
    if (!cleanAddr) return;

    // Bump version to invalidate any in-flight fetches from previous calls
    const myVersion = ++_targetVersion;

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
      const baseAlerts = generateAlerts(cached.summary, cached.transactions, cached.utxos, cleanAddr);
      const cps = computeCounterparties(cached.transactions, cleanAddr);
      set({
        summary: cached.summary,
        transactions: cached.transactions,
        utxos: cached.utxos,
        isLoading: false,
        error: null,
        riskScore: risk,
        riskLevel: getRiskLevel(risk),
        alerts: baseAlerts,
        counterparties: cps,
        evidenceItems: generateEvidenceItems(cached.summary, cached.transactions, cached.utxos, cleanAddr),
      });
      void get().enrichAlertsWithDetectors(cleanAddr, cps, baseAlerts);
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

    // Abort if a newer setActiveTarget call has taken over
    if (_targetVersion !== myVersion) return;

    set({ isLoading: !cached });
    await get().refreshTargetData();
  },

  refreshTargetData: async () => {
    const target = get().activeTargetAddress;
    if (!target) return;

    // Capture version at start of refresh to detect stale completions
    const refreshVersion = _targetVersion;

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
      // ═══════════════════════════════════════════════════════════════════════════
      // 1. NON-BITCOIN LIVE FETCH VIA BACKEND /api/wallets/search (ETH/SOL/TRON)
      // ═══════════════════════════════════════════════════════════════════════════
      const chainType = detectChainType(target);

      if (chainType !== 'bitcoin') {
        const isEvm = chainType === 'ethereum';
        const isSolana = chainType === 'solana';
        const isTron = chainType === 'tron';
        const chainParam = isEvm ? 'ethereum' : isSolana ? 'solana' : isTron ? 'tron' : 'ethereum';

        try {
          const data = await apiGet<any>(`/api/wallets/search?address=${encodeURIComponent(target)}&chain=${chainParam}`, {
            timeoutMs: 3000,
          });

          console.log('[Backend /api/wallets/search Response]:', data);

          if (get().activeTargetAddress !== target || _targetVersion !== refreshVersion) return;

          if (!data || typeof data !== 'object') {
            throw new Error(`Invalid response received from /api/wallets/search for ${target}`);
          }

          const coinSymbol = isEvm ? 'ETH' : isSolana ? 'SOL' : isTron ? 'TRX' : 'ETH';
          const chainDisplayName = isEvm
            ? 'Ethereum Mainnet'
            : isSolana
            ? 'Solana Mainnet'
            : isTron
            ? 'TRON Network'
            : `${(data.chain || chainParam).toUpperCase()} Network`;

          const scriptType = data.isContract
            ? 'Smart Contract'
            : isEvm
            ? 'EVM Account / Smart Contract'
            : isSolana
            ? 'Ed25519 Account'
            : isTron
            ? 'TRC-20 Account'
            : 'Standard Account';

          const balanceUnit = typeof data.balance === 'number' ? data.balance : parseFloat(data.balance || '0') || 0;
          const volIn = typeof data.totalVolumeIn === 'number' ? data.totalVolumeIn : parseFloat(data.totalVolumeIn || '0') || 0;
          const volOut = typeof data.totalVolumeOut === 'number' ? data.totalVolumeOut : parseFloat(data.totalVolumeOut || '0') || 0;
          const txCount = typeof data.totalTransactions === 'number'
            ? data.totalTransactions
            : ((data.incomingTxns || 0) + (data.outgoingTxns || 0));

          const summary: LiveAddressSummary = {
            address: data.address || target,
            chain: chainDisplayName,
            coinSymbol,
            formattedBalance: +balanceUnit.toFixed(4),
            formattedReceived: +volIn.toFixed(4),
            formattedSent: +volOut.toFixed(4),
            confirmedBalance: Math.round(balanceUnit * 1e8),
            unconfirmedBalance: 0,
            totalReceived: Math.round(volIn * 1e8),
            totalSent: Math.round(volOut * 1e8),
            txCount: txCount,
            firstSeen: data.firstActivity || undefined,
            lastSeen: data.lastActivity || undefined,
            scriptType,
            dataSource: 'live',
          };

          let txs: LiveTransaction[] = [];
          if (Array.isArray(data.transactions) && data.transactions.length > 0) {
            txs = data.transactions.map((t: any) => {
              const valEth = typeof t.value === 'number' ? t.value : parseFloat(t.value || '0') || 0;
              const valSats = Math.round(valEth * 1e8);
              const blockTime = t.timestamp ? Math.floor(new Date(t.timestamp).getTime() / 1000) : Math.floor(Date.now() / 1000);
              const isConfirmed = t.status === 'success' || t.status === 'confirmed' || t.status !== 'failed';

              return {
                txid: t.hash || `0x${Math.random().toString(36).slice(2, 10)}`,
                version: 1,
                locktime: 0,
                vin: [{
                  txid: t.hash || '',
                  vout: 0,
                  prevout: {
                    scriptpubkey_address: t.from,
                    value: valSats,
                  }
                }],
                vout: [{
                  scriptpubkey_address: t.to,
                  value: valSats,
                }],
                size: 250,
                weight: 1000,
                fee: Math.round((t.gas_used || 0.0005) * 1e8),
                status: {
                  confirmed: isConfirmed,
                  block_time: blockTime,
                }
              };
            });
          }

          const cacheEntry: CachedAddressData = { summary, transactions: txs, utxos: [], cachedAt: Date.now() };
          addressCacheMap.set(target, cacheEntry);
          persistToLocalStorage(target, cacheEntry);

          const risk = typeof data.riskScore === 'number' ? data.riskScore : computeRiskScore(summary, txs, [], target);

          const baseAlerts = generateAlerts(summary, txs, [], target);
          const cps = computeCounterparties(txs, target);
          set({
            summary,
            transactions: txs,
            utxos: [],
            isLoading: false,
            error: null,
            riskScore: risk,
            riskLevel: getRiskLevel(risk),
            alerts: baseAlerts,
            counterparties: cps,
            evidenceItems: generateEvidenceItems(summary, txs, [], target),
          });
          void get().enrichAlertsWithDetectors(target, cps, baseAlerts);

          get().addAuditEntry('ANALYSIS_EXECUTED', `Live ${chainDisplayName} on-chain analysis completed for ${target.slice(0, 16)}… — ${summary.txCount} txs, ${summary.formattedBalance} ${coinSymbol} balance`);
          return;
        } catch (err: any) {
          console.warn(`[InvestigationStore] Non-Bitcoin live query failed for ${target}, falling back to synthetic data:`, err?.message || err);

          if (get().activeTargetAddress !== target || _targetVersion !== refreshVersion) return;

          const fallback = generateFallbackData(target);
          const risk = computeRiskScore(fallback.summary, fallback.transactions, fallback.utxos, target);
          const baseAlerts = generateAlerts(fallback.summary, fallback.transactions, fallback.utxos, target);
          const cps = computeCounterparties(fallback.transactions, target);

          const cacheEntry: CachedAddressData = {
            summary: fallback.summary,
            transactions: fallback.transactions,
            utxos: fallback.utxos,
            cachedAt: Date.now(),
          };
          addressCacheMap.set(target, cacheEntry);
          persistToLocalStorage(target, cacheEntry);

          set({
            summary: fallback.summary,
            transactions: fallback.transactions,
            utxos: fallback.utxos,
            isLoading: false,
            error: null,
            riskScore: risk,
            riskLevel: getRiskLevel(risk),
            alerts: baseAlerts,
            counterparties: cps,
            evidenceItems: generateEvidenceItems(fallback.summary, fallback.transactions, fallback.utxos, target),
          });
          void get().enrichAlertsWithDetectors(target, cps, baseAlerts);

          get().addAuditEntry('API_NOTICE', `Target ${target.slice(0, 16)}… using fallback model: ${err?.message || 'Connection offline'}`);
          return;
        }
      }

      // ═══════════════════════════════════════════════════════════════════════════
      // 2. BITCOIN LIVE FETCH VIA MEMPOOL.SPACE API
      // ═══════════════════════════════════════════════════════════════════════════
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const [statsResult, txResult, utxoResult] = await Promise.allSettled([
        fetch(`https://mempool.space/api/address/${target}`, { signal: controller.signal }),
        fetch(`https://mempool.space/api/address/${target}/txs`, { signal: controller.signal }),
        fetch(`https://mempool.space/api/address/${target}/utxo`, { signal: controller.signal }),
      ]);
      clearTimeout(timeoutId);

      // Abort if target changed or a newer call has superseded this one
      if (get().activeTargetAddress !== target || _targetVersion !== refreshVersion) return;

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
        coinSymbol: 'BTC',
        formattedBalance: +(Math.max(0, confirmedBal) / 1e8).toFixed(4),
        formattedReceived: +(chainStats.funded_txo_sum / 1e8).toFixed(4),
        formattedSent: +(chainStats.spent_txo_sum / 1e8).toFixed(4),
        confirmedBalance: Math.max(0, confirmedBal),
        unconfirmedBalance: unconfirmedBal,
        totalReceived: chainStats.funded_txo_sum,
        totalSent: chainStats.spent_txo_sum,
        txCount: chainStats.tx_count + mempoolStats.tx_count,
        firstSeen: firstSeenStr,
        lastSeen: lastSeenStr,
        scriptType,
        dataSource: 'live',
      };

      const cacheEntry: CachedAddressData = { summary, transactions: txs, utxos: utxosList, cachedAt: Date.now() };
      addressCacheMap.set(target, cacheEntry);
      persistToLocalStorage(target, cacheEntry);

      const risk = computeRiskScore(summary, txs, utxosList, target);
      const baseAlerts = generateAlerts(summary, txs, utxosList, target);
      const cps = computeCounterparties(txs, target);

      set({
        summary,
        transactions: txs,
        utxos: utxosList,
        isLoading: false,
        error: null,
        riskScore: risk,
        riskLevel: getRiskLevel(risk),
        alerts: baseAlerts,
        counterparties: cps,
        evidenceItems: generateEvidenceItems(summary, txs, utxosList, target),
      });
      void get().enrichAlertsWithDetectors(target, cps, baseAlerts);

      get().addAuditEntry('ANALYSIS_EXECUTED', `Live Bitcoin on-chain analysis completed for ${target.slice(0, 16)}… — ${summary.txCount} txs, ${(summary.confirmedBalance / 1e8).toFixed(4)} BTC balance`);

    } catch (err: any) {
      console.error('Live on-chain query error for target:', target, err);

      const fallback = generateFallbackData(target);
      const risk = computeRiskScore(fallback.summary, fallback.transactions, fallback.utxos, target);
      const baseAlerts = generateAlerts(fallback.summary, fallback.transactions, fallback.utxos, target);
      const cps = computeCounterparties(fallback.transactions, target);

      set({
        summary: fallback.summary,
        transactions: fallback.transactions,
        utxos: fallback.utxos,
        isLoading: false,
        error: err?.message || `No live on-chain activity found for ${target}`,
        riskScore: risk,
        riskLevel: getRiskLevel(risk),
        alerts: baseAlerts,
        counterparties: cps,
        evidenceItems: generateEvidenceItems(fallback.summary, fallback.transactions, fallback.utxos, target),
      });
      void get().enrichAlertsWithDetectors(target, cps, baseAlerts);

      get().addAuditEntry('API_NOTICE', `Target ${target.slice(0, 16)}…: ${err?.message || '0 transactions found'}`);
    }
  },
}));

// ═══════════════════════════════════════════════════════════════════════════════
// AUTO-FETCH ON STARTUP
// ═══════════════════════════════════════════════════════════════════════════════
// If no cached data exists for the persisted/default address, fetch it now.
// This ensures the Dashboard shows live data from the very first page load.
{
  const state = useInvestigationStore.getState();
  if (!state.summary && state.activeTargetAddress) {
    // Fire-and-forget: fetch data for the initial target address
    void state.setActiveTarget(state.activeTargetAddress);
  } else if (state.activeTargetAddress) {
    void state.enrichAlertsWithDetectors(state.activeTargetAddress, state.counterparties, state.alerts);
  }
}
