import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useInvestigationStore, CounterpartyInfo } from '../stores/investigation';
import { useNavStore } from '../stores';
import { apiGet, apiPost, apiDelete } from '../utils/api';
import { 
  Eye, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownRight, 
  ArrowLeftRight, 
  ExternalLink, 
  Search, 
  Activity,
  Star,
  Download,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Loader2,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Filter,
  X,
  Check,
  RotateCcw,
  Sparkles
} from 'lucide-react';

export interface WatchlistEntryOut {
  id: string;
  address: string;
  chain: string;
  alias?: string | null;
  risk_score?: number | null;
  status: string;
  created_at: string;
}

export interface SanctionsCheckResponse {
  query_address: string;
  sanctioned: boolean;
  screening_result?: {
    matched: boolean;
    [key: string]: any;
  };
  stix_flagged?: boolean;
  stix_detail?: any;
  database_entities?: number;
  notice?: string;
}

export interface TableRowItem {
  address: string;
  direction: 'inbound' | 'outbound' | 'both';
  totalIn: number;
  totalOut: number;
  txCount: number;
  lastSeen: string;
  isWatchlistOnly?: boolean;
  alias?: string | null;
  savedRiskScore?: number | null;
}

const PAGE_SIZE = 50;
const STORAGE_KEY_WATCHLIST = 'leattrace_watchlist_v1';

export const WatchlistPage: React.FC = () => {
  const { activeTargetAddress, summary, counterparties, riskScore, riskLevel, addAuditEntry } = useInvestigationStore();
  const { setPage } = useNavStore();

  // Search & Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [dirFilter, setDirFilter] = useState<'all' | 'inbound' | 'outbound' | 'both'>('all');
  const [viewMode, setViewMode] = useState<'all' | 'watchlist'>('all');

  // Watchlist State (Fetched from backend with local fallback cache)
  const [watchlist, setWatchlist] = useState<WatchlistEntryOut[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_WATCHLIST);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  });
  const [loadingWatchlist, setLoadingWatchlist] = useState(false);

  // Sorting State
  const [sortColumn, setSortColumn] = useState<'address' | 'direction' | 'risk' | 'totalIn' | 'totalOut' | 'txCount' | 'lastSeen'>('lastSeen');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);

  // Lazy Sanctions Cache
  const [sanctionsCache, setSanctionsCache] = useState<Record<string, { status: 'loading' | 'clear' | 'flagged' | 'sanctioned' | 'unchecked'; detail?: any }>>({});

  // Row Selection State for Bulk Actions
  const [selectedAddresses, setSelectedAddresses] = useState<Set<string>>(new Set());
  const [isBulkAdding, setIsBulkAdding] = useState(false);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'error' | 'success' | 'info' } | null>(null);

  const showToast = (text: string, type: 'error' | 'success' | 'info' = 'error') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 1. Fetch Watchlist on Mount
  const fetchWatchlist = async () => {
    try {
      setLoadingWatchlist(true);
      const data = await apiGet<WatchlistEntryOut[]>('/api/wallets/watchlist');
      if (Array.isArray(data)) {
        setWatchlist(data);
        try {
          localStorage.setItem(STORAGE_KEY_WATCHLIST, JSON.stringify(data));
        } catch {}
      }
    } catch (err) {
      // Backend offline: continue with cached watchlist entries
    } finally {
      setLoadingWatchlist(false);
    }
  };

  useEffect(() => {
    void fetchWatchlist();
  }, []);

  // Map of lowercased watchlisted addresses to entry objects
  const watchlistedMap = useMemo(() => {
    const map = new Map<string, WatchlistEntryOut>();
    watchlist.forEach(w => {
      if (w.address) map.set(w.address.toLowerCase(), w);
    });
    return map;
  }, [watchlist]);

  // Direction Counts computed from the full counterparties list
  const dirCounts = useMemo(() => {
    let inbound = 0;
    let outbound = 0;
    let both = 0;
    counterparties.forEach(cp => {
      if (cp.direction === 'inbound') inbound++;
      else if (cp.direction === 'outbound') outbound++;
      else if (cp.direction === 'both') both++;
    });
    return {
      all: counterparties.length,
      inbound,
      outbound,
      both
    };
  }, [counterparties]);

  // Combined dataset based on viewMode ('all' vs 'watchlist')
  const baseRows = useMemo<TableRowItem[]>(() => {
    if (viewMode === 'all') {
      return counterparties.map(cp => ({
        address: cp.address,
        direction: cp.direction,
        totalIn: cp.totalIn,
        totalOut: cp.totalOut,
        txCount: cp.txCount,
        lastSeen: cp.lastSeen,
        isWatchlistOnly: false
      }));
    }

    // viewMode === 'watchlist': Show all watchlisted items
    // If address exists in counterparties, enrich with full counterparty data;
    // Otherwise construct a lightweight row using its saved watchlist entry
    const cpMap = new Map<string, CounterpartyInfo>();
    counterparties.forEach(cp => cpMap.set(cp.address.toLowerCase(), cp));

    return watchlist.map(w => {
      const match = cpMap.get(w.address.toLowerCase());
      if (match) {
        return {
          address: match.address,
          direction: match.direction,
          totalIn: match.totalIn,
          totalOut: match.totalOut,
          txCount: match.txCount,
          lastSeen: match.lastSeen,
          isWatchlistOnly: false,
          alias: w.alias,
          savedRiskScore: w.risk_score
        };
      }
      return {
        address: w.address,
        direction: 'both',
        totalIn: 0,
        totalOut: 0,
        txCount: 0,
        lastSeen: w.created_at || new Date().toISOString(),
        isWatchlistOnly: true,
        alias: w.alias,
        savedRiskScore: w.risk_score
      };
    });
  }, [viewMode, counterparties, watchlist]);

  // Filtered dataset across search and direction filter
  const filteredRows = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    return baseRows.filter(row => {
      const matchesSearch = !q || row.address.toLowerCase().includes(q) || (row.alias && row.alias.toLowerCase().includes(q));
      const matchesDir = dirFilter === 'all' || row.direction === dirFilter;
      return matchesSearch && matchesDir;
    });
  }, [baseRows, searchTerm, dirFilter]);

  // Sort filtered dataset BEFORE paginating
  const sortedRows = useMemo(() => {
    const list = [...filteredRows];
    if (!sortColumn) return list;

    list.sort((a, b) => {
      let valA: any;
      let valB: any;

      switch (sortColumn) {
        case 'address':
          valA = a.address.toLowerCase();
          valB = b.address.toLowerCase();
          break;
        case 'direction':
          valA = a.direction;
          valB = b.direction;
          break;
        case 'totalIn':
          valA = a.totalIn;
          valB = b.totalIn;
          break;
        case 'totalOut':
          valA = a.totalOut;
          valB = b.totalOut;
          break;
        case 'txCount':
          valA = a.txCount;
          valB = b.txCount;
          break;
        case 'lastSeen':
          valA = new Date(a.lastSeen).getTime();
          valB = new Date(b.lastSeen).getTime();
          break;
        case 'risk': {
          const rank = (status?: string) => {
            if (status === 'sanctioned') return 4;
            if (status === 'flagged') return 3;
            if (status === 'clear') return 1;
            return 2; // unchecked / loading
          };
          valA = rank(sanctionsCache[a.address.toLowerCase()]?.status);
          valB = rank(sanctionsCache[b.address.toLowerCase()]?.status);
          break;
        }
        default:
          return 0;
      }

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return list;
  }, [filteredRows, sortColumn, sortDirection, sanctionsCache]);

  // Reset pagination on filter or search changes
  useEffect(() => {
    setCurrentPage(1);
    setSelectedAddresses(new Set());
  }, [searchTerm, dirFilter, viewMode]);

  // Pagination calculation
  const totalItems = sortedRows.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const validCurrentPage = Math.min(currentPage, totalPages);

  const paginatedRows = useMemo(() => {
    const start = (validCurrentPage - 1) * PAGE_SIZE;
    return sortedRows.slice(start, start + PAGE_SIZE);
  }, [sortedRows, validCurrentPage]);

  // Lazy Sanctions Screening for Visible Rows (Max 50 at a time)
  useEffect(() => {
    if (paginatedRows.length === 0) return;

    // Filter to addresses not yet in cache
    const toCheck = paginatedRows
      .map(r => r.address)
      .filter(addr => !sanctionsCache[addr.toLowerCase()]);

    if (toCheck.length === 0) return;

    // Mark as loading in cache
    setSanctionsCache(prev => {
      const next = { ...prev };
      toCheck.forEach(addr => {
        next[addr.toLowerCase()] = { status: 'loading' };
      });
      return next;
    });

    // Fire lazy check requests for visible addresses
    toCheck.forEach(async (addr) => {
      try {
        const res = await apiGet<SanctionsCheckResponse>(`/api/sanctions/check/${encodeURIComponent(addr)}`);
        let status: 'clear' | 'flagged' | 'sanctioned' = 'clear';
        if (res?.sanctioned) {
          status = 'sanctioned';
        } else if (res?.stix_flagged || res?.screening_result?.matched) {
          status = 'flagged';
        }
        setSanctionsCache(prev => ({
          ...prev,
          [addr.toLowerCase()]: { status, detail: res }
        }));
      } catch {
        // Neutral unchecked on network error
        setSanctionsCache(prev => ({
          ...prev,
          [addr.toLowerCase()]: { status: 'unchecked' }
        }));
      }
    });
  }, [paginatedRows]);

  // Toggle Single Watchlist Entry (Add / Remove) with Optimistic UI
  const handleToggleWatchlist = async (address: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    const lower = address.toLowerCase();
    const existing = watchlistedMap.get(lower);

    if (existing) {
      // Remove from watchlist
      const previousWatchlist = [...watchlist];
      const updated = watchlist.filter(w => w.address.toLowerCase() !== lower);
      setWatchlist(updated);
      try {
        localStorage.setItem(STORAGE_KEY_WATCHLIST, JSON.stringify(updated));
      } catch {}

      showToast(`Removed ${address.slice(0, 8)}… from Watchlist`, 'info');
      addAuditEntry('WATCHLIST_REMOVED', `Removed counterparty ${address} from watchlist`);

      try {
        await apiDelete(`/api/wallets/watchlist/${existing.id}`);
      } catch (err: any) {
        // Rollback on failure
        setWatchlist(previousWatchlist);
        try {
          localStorage.setItem(STORAGE_KEY_WATCHLIST, JSON.stringify(previousWatchlist));
        } catch {}
        showToast(err?.message || 'Failed to remove from watchlist', 'error');
      }
    } else {
      // Add to watchlist
      const derivedScore = sanctionsCache[lower]?.status === 'sanctioned' ? 98 :
                           sanctionsCache[lower]?.status === 'flagged' ? 75 : 45;

      const optimisticEntry: WatchlistEntryOut = {
        id: `wtl-opt-${Date.now()}`,
        address,
        chain: address.startsWith('0x') ? 'ethereum' : 'bitcoin',
        alias: null,
        risk_score: derivedScore,
        status: 'active',
        created_at: new Date().toISOString()
      };

      const previousWatchlist = [...watchlist];
      const updated = [optimisticEntry, ...watchlist];
      setWatchlist(updated);
      try {
        localStorage.setItem(STORAGE_KEY_WATCHLIST, JSON.stringify(updated));
      } catch {}

      showToast(`Added ${address.slice(0, 8)}… to Watchlist`, 'success');
      addAuditEntry('WATCHLIST_ADDED', `Added counterparty ${address} to watchlist`);

      try {
        const created = await apiPost<WatchlistEntryOut>('/api/wallets/watchlist', {
          address,
          chain: optimisticEntry.chain,
          alias: null,
          risk_score: derivedScore,
          status: 'active'
        });

        if (created && created.id) {
          setWatchlist(prev => prev.map(w => w.address.toLowerCase() === lower ? created : w));
          try {
            const finalSaved = [created, ...previousWatchlist.filter(w => w.address.toLowerCase() !== lower)];
            localStorage.setItem(STORAGE_KEY_WATCHLIST, JSON.stringify(finalSaved));
          } catch {}
        }
      } catch (err: any) {
        // Preserved in local mode
      }
    }
  };

  // Bulk Add to Watchlist
  const handleBulkAddToWatchlist = async () => {
    const targets = Array.from(selectedAddresses).filter(addr => !watchlistedMap.has(addr.toLowerCase()));
    if (targets.length === 0) {
      showToast('Selected addresses are already on your watchlist', 'info');
      return;
    }

    setIsBulkAdding(true);
    const newItems: WatchlistEntryOut[] = [];

    for (const addr of targets) {
      const lower = addr.toLowerCase();
      const score = sanctionsCache[lower]?.status === 'sanctioned' ? 98 :
                    sanctionsCache[lower]?.status === 'flagged' ? 75 : 45;

      const item: WatchlistEntryOut = {
        id: `wtl-bulk-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        address: addr,
        chain: addr.startsWith('0x') ? 'ethereum' : 'bitcoin',
        alias: null,
        risk_score: score,
        status: 'active',
        created_at: new Date().toISOString()
      };
      newItems.push(item);

      try {
        void apiPost('/api/wallets/watchlist', {
          address: addr,
          chain: item.chain,
          alias: null,
          risk_score: score,
          status: 'active'
        });
      } catch {}
    }

    const updated = [...newItems, ...watchlist];
    setWatchlist(updated);
    try {
      localStorage.setItem(STORAGE_KEY_WATCHLIST, JSON.stringify(updated));
    } catch {}

    addAuditEntry('WATCHLIST_BULK_ADDED', `Bulk added ${targets.length} addresses to watchlist`);
    showToast(`Added ${targets.length} address${targets.length !== 1 ? 'es' : ''} to Watchlist`, 'success');
    setSelectedAddresses(new Set());
    setIsBulkAdding(false);
  };

  // Export Selected Rows to CSV
  const handleExportSelectedCsv = () => {
    const rowsToExport = selectedAddresses.size > 0
      ? sortedRows.filter(r => selectedAddresses.has(r.address))
      : paginatedRows;

    if (rowsToExport.length === 0) return;

    const headers = ['Address', 'Direction', 'Risk_Status', 'Received_From_Atomic', 'Sent_To_Atomic', 'Transaction_Count', 'Last_Seen'];
    const csvLines = [headers.join(',')];

    rowsToExport.forEach(row => {
      const risk = sanctionsCache[row.address.toLowerCase()]?.status || (row.savedRiskScore ? `score_${row.savedRiskScore}` : 'unchecked');
      const line = [
        `"${row.address}"`,
        `"${row.direction}"`,
        `"${risk.toUpperCase()}"`,
        row.totalIn,
        row.totalOut,
        row.txCount,
        `"${row.lastSeen}"`
      ];
      csvLines.push(line.join(','));
    });

    const blob = new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `leattrace_watchlist_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(`Exported ${rowsToExport.length} addresses to CSV`, 'success');
  };

  // Toggle Select All Visible Rows on Current Page
  const isAllVisibleSelected = paginatedRows.length > 0 && paginatedRows.every(r => selectedAddresses.has(r.address));

  const handleToggleSelectAllVisible = () => {
    const next = new Set(selectedAddresses);
    if (isAllVisibleSelected) {
      paginatedRows.forEach(r => next.delete(r.address));
    } else {
      paginatedRows.forEach(r => next.add(r.address));
    }
    setSelectedAddresses(next);
  };

  const handleToggleSelectRow = (address: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = new Set(selectedAddresses);
    if (next.has(address)) {
      next.delete(address);
    } else {
      next.add(address);
    }
    setSelectedAddresses(next);
  };

  // Sorting Header Click
  const handleSortClick = (col: 'address' | 'direction' | 'risk' | 'totalIn' | 'totalOut' | 'txCount' | 'lastSeen') => {
    if (sortColumn === col) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(col);
      setSortDirection('desc');
    }
  };

  const dirIcon = (dir: string) => {
    switch (dir) {
      case 'inbound': return <ArrowDownRight size={12} className="text-accent-green" />;
      case 'outbound': return <ArrowUpRight size={12} className="text-accent-red" />;
      default: return <ArrowLeftRight size={12} className="text-accent-gold" />;
    }
  };

  const dirColor = (dir: string) => {
    switch (dir) {
      case 'inbound': return 'bg-accent-green/20 text-accent-green border-accent-green/30';
      case 'outbound': return 'bg-accent-red/20 text-accent-red border-accent-red/30';
      default: return 'bg-accent-gold/20 text-accent-gold border-accent-gold/30';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-2.5 rounded-lg text-xs font-semibold shadow-2xl flex items-center gap-2 border animate-fade-in ${
          toastMessage.type === 'success'
            ? 'bg-dark-900/95 text-accent-green border-accent-green/40 shadow-[0_0_15px_rgba(0,230,153,0.2)]'
            : toastMessage.type === 'info'
            ? 'bg-dark-900/95 text-primary-400 border-primary-500/40 shadow-[0_0_15px_rgba(0,210,255,0.2)]'
            : 'bg-dark-900/95 text-accent-red border-accent-red/40 shadow-[0_0_15px_rgba(255,75,75,0.2)]'
        }`}>
          {toastMessage.type === 'success' ? <CheckCircle2 size={14} /> : toastMessage.type === 'info' ? <Star size={14} /> : <AlertCircle size={14} />}
          <span>{toastMessage.text}</span>
          <button onClick={() => setToastMessage(null)} className="ml-2 hover:opacity-80">
            <X size={12} />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Eye size={20} className="text-primary-400" />
            <h2 className="text-xl font-bold text-white tracking-tight">Watchlist & Counterparties</h2>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <Wallet size={12} className="text-primary-400" />
            <span className="text-xs text-dark-400 mono">
              {activeTargetAddress ? `${activeTargetAddress.slice(0, 16)}…${activeTargetAddress.slice(-8)}` : 'No active target'}
            </span>
            <span className="text-[10px] text-dark-500">•</span>
            <span className="text-xs text-dark-400">
              {counterparties.length} counterpart{counterparties.length !== 1 ? 'ies' : 'y'} detected
            </span>
            <span className="text-[10px] text-dark-500">•</span>
            <span className="text-xs text-primary-400 font-semibold">
              {watchlist.length} saved in Watchlist
            </span>
          </div>
        </div>

        {/* View Mode Switcher: All Counterparties vs My Watchlist */}
        <div className="flex items-center p-1 rounded-lg bg-dark-900/80 border border-dark-750 self-start sm:self-center">
          <button
            onClick={() => setViewMode('all')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'all'
                ? 'bg-primary-500/20 text-primary-400 border border-primary-500/40 shadow-sm'
                : 'text-dark-400 hover:text-white'
            }`}
          >
            <span>All Counterparties</span>
            <span className="px-1.5 py-0.2 rounded text-[10px] bg-dark-800 text-dark-400 font-mono">
              {counterparties.length}
            </span>
          </button>
          <button
            onClick={() => setViewMode('watchlist')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'watchlist'
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-sm'
                : 'text-dark-400 hover:text-white'
            }`}
          >
            <Star size={12} className={viewMode === 'watchlist' ? 'fill-amber-400 text-amber-400' : ''} />
            <span>My Watchlist</span>
            <span className="px-1.5 py-0.2 rounded text-[10px] bg-dark-800 text-amber-400/80 font-mono">
              {watchlist.length}
            </span>
          </button>
        </div>
      </div>

      {/* Active Target Card */}
      <div className="glass-card p-4 border border-primary-500/20 bg-primary-500/5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10px] text-primary-400 uppercase font-bold mb-1 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-primary-400 animate-pulse" />
              <span>Active Investigation Target</span>
            </div>
            <code className="text-sm text-white mono font-bold">{activeTargetAddress}</code>
            <div className="flex items-center gap-3 mt-2 text-xs text-dark-400">
              <span>Balance: <strong className="text-white">{summary ? `${summary.formattedBalance} ${summary.coinSymbol}` : '—'}</strong></span>
              <span>Txns: <strong className="text-white">{summary?.txCount?.toLocaleString() || '—'}</strong></span>
              <span>Type: <strong className="text-white">{summary?.scriptType || '—'}</strong></span>
            </div>
          </div>
          <div className="text-right">
            <div className={`text-2xl font-bold ${riskLevel === 'critical' ? 'text-accent-red' : riskLevel === 'high' ? 'text-accent-gold' : riskLevel === 'medium' ? 'text-primary-400' : 'text-accent-green'}`}>
              {riskScore}%
            </div>
            <div className="text-[10px] text-dark-400 uppercase font-semibold">Risk Score</div>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar with Direction Counts */}
      <div className="glass-card p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 border border-dark-750">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search counterparty addresses or aliases..."
            className="w-full pl-9 pr-8 py-2 bg-dark-900/80 border border-dark-700 rounded-lg text-xs text-white placeholder:text-dark-500 focus:border-primary-500/60 focus:outline-none"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-dark-400 hover:text-white"
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* Direction Filter Pills with Computed Counts */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-thin">
          {[
            { dir: 'all', label: 'All', count: dirCounts.all },
            { dir: 'inbound', label: 'Inbound', count: dirCounts.inbound },
            { dir: 'outbound', label: 'Outbound', count: dirCounts.outbound },
            { dir: 'both', label: 'Both', count: dirCounts.both },
          ].map(({ dir, label, count }) => (
            <button
              key={dir}
              onClick={() => setDirFilter(dir as any)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                dirFilter === dir
                  ? 'bg-primary-500/20 text-primary-400 border border-primary-500/40 shadow-sm'
                  : 'bg-dark-900/60 text-dark-400 border border-dark-800 hover:text-white hover:border-dark-700'
              }`}
            >
              <span>{label}</span>
              <span className="text-[10px] font-mono opacity-80">({count})</span>
            </button>
          ))}
        </div>

        <div className="text-[11px] text-dark-400 shrink-0 font-medium">
          Showing <strong className="text-white">{filteredRows.length}</strong> matching
        </div>
      </div>

      {/* Floating / Sticky Bulk Action Bar */}
      {selectedAddresses.size > 0 && (
        <div className="glass-card p-3 border border-primary-500/40 bg-dark-900/95 flex flex-wrap items-center justify-between gap-3 shadow-2xl animate-scale-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-primary-400" />
            <span className="text-xs font-bold text-white">
              {selectedAddresses.size} address{selectedAddresses.size !== 1 ? 'es' : ''} selected
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleBulkAddToWatchlist}
              disabled={isBulkAdding}
              className="px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              {isBulkAdding ? <Loader2 size={13} className="animate-spin" /> : <Star size={13} className="fill-amber-400" />}
              <span>Add {selectedAddresses.size} to Watchlist</span>
            </button>
            <button
              onClick={handleExportSelectedCsv}
              className="px-3 py-1.5 rounded-lg bg-primary-500/20 text-primary-300 border border-primary-500/40 hover:bg-primary-500/30 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Download size={13} />
              <span>Export Selected (CSV)</span>
            </button>
            <button
              onClick={() => setSelectedAddresses(new Set())}
              className="px-2.5 py-1.5 rounded-lg bg-dark-800 text-dark-300 hover:text-white text-xs font-medium transition-colors cursor-pointer"
            >
              Deselect All
            </button>
          </div>
        </div>
      )}

      {/* Counterparties & Watchlist Table */}
      <div className="glass-card overflow-hidden border border-dark-750">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-700/60 bg-dark-900/70">
                {/* Select All Checkbox */}
                <th className="p-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={isAllVisibleSelected}
                    onChange={handleToggleSelectAllVisible}
                    className="rounded bg-dark-800 border-dark-700 text-primary-500 focus:ring-0 cursor-pointer"
                    title="Select all visible on this page"
                  />
                </th>

                {/* Address */}
                <th
                  onClick={() => handleSortClick('address')}
                  className="text-left text-[10px] text-dark-400 font-semibold uppercase p-3 cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Address</span>
                    {sortColumn === 'address' && (
                      sortDirection === 'asc' ? <ChevronUp size={11} className="text-primary-400" /> : <ChevronDown size={11} className="text-primary-400" />
                    )}
                  </div>
                </th>

                {/* Direction */}
                <th
                  onClick={() => handleSortClick('direction')}
                  className="text-left text-[10px] text-dark-400 font-semibold uppercase p-3 cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Direction</span>
                    {sortColumn === 'direction' && (
                      sortDirection === 'asc' ? <ChevronUp size={11} className="text-primary-400" /> : <ChevronDown size={11} className="text-primary-400" />
                    )}
                  </div>
                </th>

                {/* Real Risk Column */}
                <th
                  onClick={() => handleSortClick('risk')}
                  className="text-left text-[10px] text-dark-400 font-semibold uppercase p-3 cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Risk Status</span>
                    {sortColumn === 'risk' && (
                      sortDirection === 'asc' ? <ChevronUp size={11} className="text-primary-400" /> : <ChevronDown size={11} className="text-primary-400" />
                    )}
                  </div>
                </th>

                {/* Received From */}
                <th
                  onClick={() => handleSortClick('totalIn')}
                  className="text-right text-[10px] text-dark-400 font-semibold uppercase p-3 cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Received From</span>
                    {sortColumn === 'totalIn' && (
                      sortDirection === 'asc' ? <ChevronUp size={11} className="text-primary-400" /> : <ChevronDown size={11} className="text-primary-400" />
                    )}
                  </div>
                </th>

                {/* Sent To */}
                <th
                  onClick={() => handleSortClick('totalOut')}
                  className="text-right text-[10px] text-dark-400 font-semibold uppercase p-3 cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Sent To</span>
                    {sortColumn === 'totalOut' && (
                      sortDirection === 'asc' ? <ChevronUp size={11} className="text-primary-400" /> : <ChevronDown size={11} className="text-primary-400" />
                    )}
                  </div>
                </th>

                {/* Txns */}
                <th
                  onClick={() => handleSortClick('txCount')}
                  className="text-right text-[10px] text-dark-400 font-semibold uppercase p-3 cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Txns</span>
                    {sortColumn === 'txCount' && (
                      sortDirection === 'asc' ? <ChevronUp size={11} className="text-primary-400" /> : <ChevronDown size={11} className="text-primary-400" />
                    )}
                  </div>
                </th>

                {/* Last Seen */}
                <th
                  onClick={() => handleSortClick('lastSeen')}
                  className="text-left text-[10px] text-dark-400 font-semibold uppercase p-3 cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Last Seen</span>
                    {sortColumn === 'lastSeen' && (
                      sortDirection === 'asc' ? <ChevronUp size={11} className="text-primary-400" /> : <ChevronDown size={11} className="text-primary-400" />
                    )}
                  </div>
                </th>

                {/* Actions */}
                <th className="text-right text-[10px] text-dark-400 font-semibold uppercase p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRows.map(cp => {
                const lowerAddr = cp.address.toLowerCase();
                const isWatchlisted = watchlistedMap.has(lowerAddr);
                const isRowSelected = selectedAddresses.has(cp.address);
                const sanctionsData = sanctionsCache[lowerAddr];

                return (
                  <tr
                    key={cp.address}
                    onClick={() => handleToggleSelectRow(cp.address, { stopPropagation: () => {} } as any)}
                    className={`border-b border-dark-800/50 hover:bg-dark-800/40 transition-colors cursor-pointer ${
                      isRowSelected ? 'bg-primary-500/10' : ''
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="p-3 text-center" onClick={e => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isRowSelected}
                        onChange={e => handleToggleSelectRow(cp.address, e as any)}
                        className="rounded bg-dark-800 border-dark-700 text-primary-500 focus:ring-0 cursor-pointer"
                      />
                    </td>

                    {/* Address & Watchlist Tag */}
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <code className="text-xs text-white mono font-medium">
                          {cp.address.slice(0, 14)}…{cp.address.slice(-6)}
                        </code>
                        {cp.isWatchlistOnly && (
                          <span className="px-1.5 py-0.2 rounded text-[8px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase">
                            Watchlist Archive
                          </span>
                        )}
                        {cp.alias && (
                          <span className="text-[10px] text-primary-300 font-semibold truncate max-w-[100px]">
                            ({cp.alias})
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Direction */}
                    <td className="p-3">
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase border flex items-center gap-1 w-fit ${dirColor(cp.direction)}`}>
                        {dirIcon(cp.direction)} {cp.direction}
                      </span>
                    </td>

                    {/* Lazy Real Risk & Sanctions Badge */}
                    <td className="p-3">
                      {sanctionsData?.status === 'loading' ? (
                        <div className="flex items-center gap-1.5 text-[10px] text-dark-400 font-mono">
                          <Loader2 size={10} className="animate-spin text-primary-400" />
                          <span>Screening...</span>
                        </div>
                      ) : sanctionsData?.status === 'sanctioned' ? (
                        <span className="px-2 py-0.5 rounded text-[9px] font-extrabold uppercase border bg-rose-500/20 text-rose-400 border-rose-500/40 shadow-[0_0_8px_rgba(244,63,94,0.3)] flex items-center gap-1 w-fit">
                          <AlertTriangle size={10} /> Sanctioned
                        </span>
                      ) : sanctionsData?.status === 'flagged' ? (
                        <span className="px-2 py-0.5 rounded text-[9px] font-extrabold uppercase border bg-amber-500/20 text-amber-400 border-amber-500/40 shadow-[0_0_8px_rgba(245,158,11,0.3)] flex items-center gap-1 w-fit">
                          <AlertCircle size={10} /> Flagged
                        </span>
                      ) : sanctionsData?.status === 'clear' ? (
                        <span className="px-2 py-0.5 rounded text-[9px] font-extrabold uppercase border bg-emerald-500/20 text-emerald-400 border-emerald-500/40 flex items-center gap-1 w-fit">
                          <CheckCircle2 size={10} /> Clear
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[9px] font-medium border bg-dark-800 text-dark-400 border-dark-750 flex items-center gap-1 w-fit">
                          Unchecked
                        </span>
                      )}
                    </td>

                    {/* Received From */}
                    <td className="p-3 text-right">
                      <span className="text-xs text-accent-green font-mono">
                        {cp.totalIn > 0 ? `${(cp.totalIn / 1e8).toFixed(4)} ${summary?.coinSymbol || 'BTC'}` : '—'}
                      </span>
                    </td>

                    {/* Sent To */}
                    <td className="p-3 text-right">
                      <span className="text-xs text-accent-red font-mono">
                        {cp.totalOut > 0 ? `${(cp.totalOut / 1e8).toFixed(4)} ${summary?.coinSymbol || 'BTC'}` : '—'}
                      </span>
                    </td>

                    {/* Txns */}
                    <td className="p-3 text-right">
                      <span className="text-xs text-white font-mono">{cp.txCount > 0 ? cp.txCount : '—'}</span>
                    </td>

                    {/* Last Seen */}
                    <td className="p-3">
                      <span className="text-[10px] text-dark-400">
                        {cp.lastSeen ? new Date(cp.lastSeen).toLocaleDateString() : '—'}
                      </span>
                    </td>

                    {/* Actions: Watchlist Star Button + Explore Link */}
                    <td className="p-3 text-right" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={e => handleToggleWatchlist(cp.address, e)}
                          title={isWatchlisted ? 'Remove from Watchlist' : 'Add to Watchlist'}
                          className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                            isWatchlisted
                              ? 'bg-amber-500/20 border-amber-500/40 text-amber-400 hover:bg-amber-500/30'
                              : 'bg-dark-800 border-dark-700 text-dark-400 hover:text-amber-400 hover:border-amber-500/40'
                          }`}
                        >
                          <Star size={12} className={isWatchlisted ? 'fill-amber-400 text-amber-400' : ''} />
                        </button>

                        <a
                          href={cp.address.startsWith('0x') ? `https://etherscan.io/address/${cp.address}` : `https://mempool.space/address/${cp.address}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2 py-1 rounded bg-primary-500/10 hover:bg-primary-500/20 text-[10px] font-bold text-primary-400 border border-primary-500/20 flex items-center gap-1 transition-colors"
                        >
                          <ExternalLink size={10} />
                          <span>Explore</span>
                        </a>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Empty States */}
        {sortedRows.length === 0 && (
          <div className="p-12 text-center text-dark-500 italic text-sm">
            {viewMode === 'watchlist' ? (
              <div className="space-y-2">
                <Star size={24} className="mx-auto text-dark-600 mb-1" />
                <div className="font-semibold text-dark-300">Your Watchlist is empty.</div>
                <div className="text-xs">Click the star icon next to any counterparty to pin it to your personal watchlist.</div>
              </div>
            ) : counterparties.length === 0 ? (
              'No counterparties detected. Analyze a wallet to discover connected addresses.'
            ) : (
              'No counterparties match the current search and direction filters.'
            )}
          </div>
        )}

        {/* PART 2 — PAGINATION CONTROLS */}
        {totalItems > 0 && (
          <div className="p-3.5 border-t border-dark-800/80 bg-dark-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-xs text-dark-400">
              Showing <span className="text-white font-semibold">{(validCurrentPage - 1) * PAGE_SIZE + 1}</span> to{' '}
              <span className="text-white font-semibold">{Math.min(validCurrentPage * PAGE_SIZE, totalItems)}</span> of{' '}
              <span className="text-primary-400 font-bold">{totalItems}</span> addresses
            </div>

            <div className="flex items-center gap-1.5 self-end sm:self-center">
              {/* First Page */}
              <button
                onClick={() => setCurrentPage(1)}
                disabled={validCurrentPage === 1}
                className="p-1.5 rounded-lg bg-dark-800 border border-dark-700 text-dark-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="First Page"
              >
                <ChevronsLeft size={13} />
              </button>

              {/* Prev Page */}
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={validCurrentPage === 1}
                className="px-2.5 py-1 rounded-lg bg-dark-800 border border-dark-700 text-xs font-bold text-dark-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
              >
                <ChevronLeft size={13} />
                <span>Prev</span>
              </button>

              {/* Page indicator */}
              <div className="px-3 py-1 rounded-lg bg-dark-950 border border-dark-750 text-xs font-mono text-primary-400 font-bold">
                Page {validCurrentPage} of {totalPages}
              </div>

              {/* Next Page */}
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={validCurrentPage === totalPages}
                className="px-2.5 py-1 rounded-lg bg-dark-800 border border-dark-700 text-xs font-bold text-dark-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
              >
                <span>Next</span>
                <ChevronRight size={13} />
              </button>

              {/* Last Page */}
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={validCurrentPage === totalPages}
                className="p-1.5 rounded-lg bg-dark-800 border border-dark-700 text-dark-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Last Page"
              >
                <ChevronsRight size={13} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
