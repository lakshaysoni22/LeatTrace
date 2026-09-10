import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useInvestigationStore, AuditLogEntry } from '../stores/investigation';
import { useNavStore, useCaseStore } from '../stores';
import { Case } from '../types';
import { apiGet } from '../utils/api';
import { 
  ShieldAlert, ShieldCheck, Activity, Clock, AlertOctagon, Terminal, 
  RefreshCw, CheckCircle2, AlertTriangle, AlertCircle, Wallet, Database, Cpu, ArrowUpRight,
  ChevronDown, ChevronUp, FolderKanban, Shield, Flame, ExternalLink, Calendar, Layers, Check
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';

const STORAGE_KEY_CASES = 'leattrace_cases_v4';
const STORAGE_KEY_ACTIVE_ID = 'leattrace_active_case_id_v4';

const INITIAL_REAL_WORLD_CASES = [
  {
    id: 'case-inv-769122',
    case_number: 'INV-2026-769122',
    title: 'Operation ShadowFlow: High-Yield BTC Layering & Mixer Egress',
    description: 'Autonomous cyber forensics trigger identified high-velocity peel chains dispersing 130,010 BTC into privacy mixer deposit infrastructure. Inter-agency AML investigation active.',
    priority: 'high',
    status: 'open',
    investigator_id: 'usr-001',
    investigator_name: 'Special Agent Soni',
    department: 'Cyber Crime Operations Cell',
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
    wallets: [
      {
        id: 'w-1',
        address: 'bc1qgdjqv0av3q54qqjwve97',
        chain: 'bitcoin',
        label: 'Primary Mixing Target',
        risk_score: 75,
        is_contract: false,
        case_id: 'case-inv-769122'
      }
    ],
    evidence: [
      { id: 'ev-1', title: 'SHA-256 Ledger Snapshot Block 842190', evidence_type: 'blockchain_snapshot' },
      { id: 'ev-2', title: 'Exchange Deposit Cluster Mapping Log', evidence_type: 'cluster_mapping' },
      { id: 'ev-3', title: 'CrPC Section 91 Production Notice', evidence_type: 'legal_subpoena' }
    ]
  },
  {
    id: 'case-inv-883104',
    case_number: 'INV-2026-883104',
    title: 'Operation EtherVigil: Multi-Chain Bridge Liquidity Drain',
    description: 'Cross-chain liquidity bridge smart contract exploit involving flash-loan arbitrage and multi-network dispersion across Ethereum Mainnet, Arbitrum, and Tornado Cash.',
    priority: 'critical',
    status: 'under_review',
    investigator_id: 'usr-002',
    investigator_name: 'Senior Analyst Sharma',
    department: 'Financial Intelligence Unit (FIU)',
    created_at: new Date(Date.now() - 6 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString(),
    wallets: [
      {
        id: 'w-2',
        address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
        chain: 'ethereum',
        label: 'Bridge Exploiter Treasury',
        risk_score: 94,
        is_contract: false,
        case_id: 'case-inv-883104'
      }
    ],
    evidence: [
      { id: 'ev-4', title: 'Decompiled EVM Exploit Bytecode', evidence_type: 'bytecode_analysis' },
      { id: 'ev-5', title: 'Multi-Sig Validator Key Compromise', evidence_type: 'validator_audit' },
      { id: 'ev-6', title: 'Cross-Bridge Liquidity Drainage', evidence_type: 'financial_audit' }
    ]
  },
  {
    id: 'case-inv-554219',
    case_number: 'INV-2026-554219',
    title: 'Operation RansomNet: Darknet Extortion Multi-Sig Funnel',
    description: 'Coordinated ransomware extortion syndicate collecting victim payments into segregated multi-sig wallets with gradual consolidation into European OTC desks.',
    priority: 'medium',
    status: 'open',
    investigator_id: 'usr-003',
    investigator_name: 'Inspector Verma',
    department: 'CBI Cyber Crime Directorate',
    created_at: new Date(Date.now() - 14 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    wallets: [
      {
        id: 'w-3',
        address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
        chain: 'bitcoin',
        label: 'Syndicate Collection Node',
        risk_score: 50,
        is_contract: false,
        case_id: 'case-inv-554219'
      }
    ],
    evidence: [
      { id: 'ev-7', title: 'Victim Decryptor Negotiation Log', evidence_type: 'extortion_log' },
      { id: 'ev-8', title: 'Co-spent Output Clustering Graph Analysis', evidence_type: 'graph_report' }
    ]
  },
  {
    id: 'case-inv-320981',
    case_number: 'INV-2026-320981',
    title: 'Operation GhostPay: Peer-to-Peer Smurfing & Off-Ramp Cashing',
    description: 'Structured smurfing network utilizing thousands of sub-threshold micro-transactions to evade AML velocity reporting before fiat off-ramping via unlicensed P2P desks.',
    priority: 'low',
    status: 'closed',
    investigator_id: 'usr-004',
    investigator_name: 'Analyst Patel',
    department: 'I4C Cyber Threat Division',
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 10 * 86400000).toISOString(),
    closed_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    wallets: [
      {
        id: 'w-4',
        address: '3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy',
        chain: 'bitcoin',
        label: 'Smurfing Accumulator Hub',
        risk_score: 20,
        is_contract: false,
        case_id: 'case-inv-320981'
      }
    ],
    evidence: [
      { id: 'ev-9', title: 'Section 65B Certified Forensic Dossier', evidence_type: 'forensic_dossier' },
      { id: 'ev-10', title: 'Court Docket Filing Receipt', evidence_type: 'court_docket' },
      { id: 'ev-11', title: 'Asset Seizure Protocol Order', evidence_type: 'asset_freezing' }
    ]
  },
  {
    id: 'case-inv-914702',
    case_number: 'INV-2026-914702',
    title: 'Operation SilkRoute-II: Darknet Escrow Consolidation & Monero Swap',
    description: 'Interception of illicit darknet marketplace vendor payout system routing cryptocurrency through cross-chain atomic swaps into anonymous Monero (XMR) pools.',
    priority: 'critical',
    status: 'open',
    investigator_id: 'usr-005',
    investigator_name: 'Deputy Director Sen',
    department: 'Enforcement Directorate - Special Cell',
    created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
    wallets: [
      {
        id: 'w-5',
        address: 'bc1qa5wkgaew2dkv56kfvj49j0av528453g9062',
        chain: 'bitcoin',
        label: 'Darknet Escrow Node',
        risk_score: 96,
        is_contract: false,
        case_id: 'case-inv-914702'
      }
    ],
    evidence: [
      { id: 'ev-12', title: 'Atomic Swap Gateway Telemetry', evidence_type: 'swap_telemetry' },
      { id: 'ev-13', title: 'Darknet Vendor PGP Attestation', evidence_type: 'pgp_attestation' },
      { id: 'ev-14', title: 'Order of Attachment under PMLA', evidence_type: 'freezing_order' }
    ]
  },
  {
    id: 'case-inv-104928',
    case_number: 'INV-2026-104928',
    title: 'Operation BitVault: Cold Storage Treasury Forensic Audit',
    description: 'Scheduled multi-jurisdiction compliance inspection and dormant key audit for state-sanctioned digital asset custodial reserve.',
    priority: 'low',
    status: 'closed',
    investigator_id: 'usr-006',
    investigator_name: 'Audit Officer Nair',
    department: 'Reserve Bank Cyber Audit Wing',
    created_at: new Date(Date.now() - 60 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 25 * 86400000).toISOString(),
    closed_at: new Date(Date.now() - 20 * 86400000).toISOString(),
    wallets: [
      {
        id: 'w-6',
        address: 'bc1q9d8p0av3f54qqjwve97k2h8x6v4c2b0n1m3l5',
        chain: 'bitcoin',
        label: 'Air-Gapped Cold Vault Node',
        risk_score: 12,
        is_contract: false,
        case_id: 'case-inv-104928'
      }
    ],
    evidence: [
      { id: 'ev-15', title: 'HSM Cryptographic Attestation Signature Proof', evidence_type: 'hsm_attestation' }
    ]
  }
];

const normalizeStatus = (raw: string | undefined): 'open' | 'under_review' | 'closed' => {
  const s = (raw || 'open').toLowerCase();
  if (s === 'closed' || s === 'archived') return 'closed';
  if (s === 'under_review' || s === 'suspended') return 'under_review';
  return 'open';
};

const mapCasePayload = (item: any): Case => ({
  id: item.id || `case-${Math.random().toString(36).slice(2, 8)}`,
  caseNumber: item.case_number ?? item.caseNumber ?? 'CC-PENDING',
  title: item.title ?? 'Untitled Case',
  description: item.description ?? '',
  priority: (item.priority ?? 'medium').toLowerCase() as any,
  status: normalizeStatus(item.status) as any,
  investigatorId: item.investigator_id ?? item.investigatorId ?? '',
  investigatorName: item.investigator_name ?? item.investigatorName ?? 'Unassigned',
  department: item.department ?? 'Cyber Crime Division',
  notes: item.notes,
  createdAt: item.created_at ?? item.createdAt ?? new Date().toISOString(),
  updatedAt: item.updated_at ?? item.updatedAt ?? new Date().toISOString(),
  closedAt: item.closed_at ?? item.closedAt,
  walletCount: Array.isArray(item.wallets) ? item.wallets.length : (item.walletCount ?? 0),
  evidenceCount: Array.isArray(item.evidence) ? item.evidence.length : (item.evidenceCount ?? 0),
  ...({ wallets: item.wallets }),
});

const loadSavedCases = (): Case[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_CASES);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map(mapCasePayload);
      }
    }
  } catch {}
  try {
    localStorage.setItem(STORAGE_KEY_CASES, JSON.stringify(INITIAL_REAL_WORLD_CASES));
  } catch {}
  return INITIAL_REAL_WORLD_CASES.map(mapCasePayload);
};

const timeAgo = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 0) return 'just now';
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

const formatEvidenceType = (rawType: string) => {
  switch (rawType) {
    case 'utxo_concentration':
      return 'UTXO Concentration';
    case 'large_transfer':
      return 'Large Transfer';
    case 'high_frequency':
      return 'High Frequency';
    case 'unconfirmed':
      return 'Unconfirmed Tx';
    case 'pattern':
      return 'Transaction Pattern';
    default:
      return rawType.replace(/_/g, ' ').replace(/\b\w/g, ch => ch.toUpperCase());
  }
};

export const SocDashboardPage: React.FC = () => {
  const { 
    activeTargetAddress, 
    summary, 
    alerts, 
    riskScore, 
    riskLevel, 
    counterparties, 
    evidenceItems, 
    auditLog, 
    refreshTargetData 
  } = useInvestigationStore();
  
  const { setPage } = useNavStore();
  const { selectCase } = useCaseStore();

  const [cases, setCases] = useState<Case[]>(loadSavedCases);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showSnapshot, setShowSnapshot] = useState(false);
  const [secondsAgo, setSecondsAgo] = useState(0);
  const lastUpdatedRef = useRef<number>(Date.now());

  // ── 1. Fetch All Cases ───────────────────────────────────────────────────
  const fetchCases = useCallback(async () => {
    try {
      const data = await apiGet<any[]>('/api/cases');
      if (Array.isArray(data) && data.length > 0) {
        const mapped = data.map(mapCasePayload);
        setCases(mapped);
        useCaseStore.getState().setCases(mapped);
        try {
          localStorage.setItem(STORAGE_KEY_CASES, JSON.stringify(data));
        } catch {}
      } else {
        const localCases = loadSavedCases();
        setCases(localCases);
        useCaseStore.getState().setCases(localCases);
      }
    } catch (err) {
      console.warn('[SocDashboard] Backend cases offline or unseeded, using local forensic case store:', err);
      const localCases = loadSavedCases();
      setCases(localCases);
      useCaseStore.getState().setCases(localCases);
    } finally {
      lastUpdatedRef.current = Date.now();
      setSecondsAgo(0);
    }
  }, []);

  // Initial load and periodic live auto-refresh (45 seconds)
  useEffect(() => {
    void fetchCases();

    const pollInterval = setInterval(() => {
      void fetchCases();
      void refreshTargetData();
    }, 45000);

    const tickInterval = setInterval(() => {
      setSecondsAgo(Math.floor((Date.now() - lastUpdatedRef.current) / 1000));
    }, 1000);

    return () => {
      clearInterval(pollInterval);
      clearInterval(tickInterval);
    };
  }, [fetchCases, refreshTargetData]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.allSettled([
      fetchCases(),
      refreshTargetData(),
    ]);
    setIsRefreshing(false);
  };

  // ── 2. Cross-Case Metrics ────────────────────────────────────────────────
  const totalCases = cases.length;
  const openCases = cases.filter(c => (c.status as string) === 'open' || (c.status as string) === 'active').length;
  const reviewCases = cases.filter(c => (c.status as string) === 'under_review' || (c.status as string) === 'suspended').length;
  const closedCases = cases.filter(c => (c.status as string) === 'closed' || (c.status as string) === 'archived').length;

  const criticalCases = cases.filter(c => (c.priority as string) === 'critical').length;
  const highCases = cases.filter(c => (c.priority as string) === 'high').length;

  const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const casesOpenedThisWeek = cases.filter(c => new Date(c.createdAt).getTime() >= oneWeekAgo).length;

  // ── 3. Highest Risk Active Cases ─────────────────────────────────────────
  // Note: schemas.CaseOut does not contain a per-case aggregate risk score field; sorting by priority weight and recency
  const highestRiskCases = useMemo(() => {
    const priorityWeight: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };
    return cases
      .filter(c => {
        const s = (c.status as string)?.toLowerCase();
        return s !== 'closed' && s !== 'archived';
      })
      .sort((a, b) => {
        const weightDiff = (priorityWeight[(b.priority as string)?.toLowerCase()] || 0) - (priorityWeight[(a.priority as string)?.toLowerCase()] || 0);
        if (weightDiff !== 0) return weightDiff;
        return new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime();
      })
      .slice(0, 5);
  }, [cases]);

  const handleCaseClick = (c: Case) => {
    selectCase(c);
    try {
      localStorage.setItem(STORAGE_KEY_ACTIVE_ID, c.id);
    } catch {}
    const primaryWallet = (c as any).wallets?.[0]?.address;
    if (primaryWallet) {
      void useInvestigationStore.getState().setActiveTarget(primaryWallet);
    }
    setPage('cases');
  };

  // ── 4. Charts & Breakdown Data ───────────────────────────────────────────
  const criticalAlerts = alerts.filter(a => a.severity === 'critical').length;
  const highAlerts = alerts.filter(a => a.severity === 'high').length;
  const mediumAlerts = alerts.filter(a => a.severity === 'medium').length;
  const lowAlerts = alerts.filter(a => a.severity === 'low' || a.severity === 'info').length;

  const severityData = useMemo(() => [
    { name: 'Critical', value: criticalAlerts, color: '#ef4444' },
    { name: 'High', value: highAlerts, color: '#f59e0b' },
    { name: 'Medium', value: mediumAlerts, color: '#06b6d4' },
    { name: 'Low/Info', value: lowAlerts, color: '#22c55e' },
  ].filter(d => d.value > 0), [criticalAlerts, highAlerts, mediumAlerts, lowAlerts]);

  const evidenceBarData = useMemo(() => {
    const counts: Record<string, number> = {};
    evidenceItems.forEach(e => {
      const key = formatEvidenceType(e.type);
      counts[key] = (counts[key] || 0) + 1;
    });
    return Object.entries(counts).map(([name, count]) => ({ name, count }));
  }, [evidenceItems]);

  // ── 5. Curated & Deduplicated Activity Feed ──────────────────────────────
  const curatedAudit = useMemo(() => {
    const ALLOWED_ACTIONS = [
      'ANALYSIS_EXECUTED',
      'CASE_CREATED',
      'CASE_CLOSED',
      'EVIDENCE_ADDED',
      'ALERT_TRIGGERED',
      'NOTE_ADDED',
      'INCIDENT_STEP_COMPLETED',
      'INCIDENT_STEP_REOPENED',
      'WALLET_CHANGED',
    ];

    const filtered = auditLog.filter(entry => {
      const act = (entry.action || '').toUpperCase();
      const det = (entry.detail || '').toLowerCase();
      if (ALLOWED_ACTIONS.some(a => act.includes(a))) return true;
      return (
        det.includes('analysis completed') ||
        det.includes('case created') ||
        det.includes('case closed') ||
        det.includes('evidence added') ||
        det.includes('alert') ||
        det.includes('note added') ||
        det.includes('target changed')
      );
    });

    // Deduplicate consecutive identical entries within short time windows
    const deduped: Array<AuditLogEntry & { count: number }> = [];
    for (const item of filtered) {
      const prev = deduped[deduped.length - 1];
      if (
        prev &&
        prev.action === item.action &&
        prev.detail === item.detail &&
        Math.abs(new Date(prev.timestamp).getTime() - new Date(item.timestamp).getTime()) < 10 * 60 * 1000
      ) {
        prev.count += 1;
        prev.timestamp = item.timestamp;
      } else {
        deduped.push({ ...item, count: 1 });
      }
    }
    return deduped.slice(0, 8);
  }, [auditLog]);

  const getPriorityBadge = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'critical':
        return 'bg-accent-red/20 text-accent-red border-accent-red/30';
      case 'high':
        return 'bg-accent-gold/20 text-accent-gold border-accent-gold/30';
      case 'medium':
        return 'bg-primary-500/20 text-primary-400 border-primary-500/30';
      case 'low':
        return 'bg-accent-green/20 text-accent-green border-accent-green/30';
      default:
        return 'bg-dark-700 text-dark-300 border-dark-600';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'open':
      case 'active':
        return 'bg-primary-500/20 text-primary-400 border-primary-500/30';
      case 'under_review':
      case 'suspended':
        return 'bg-accent-gold/20 text-accent-gold border-accent-gold/30';
      case 'closed':
        return 'bg-dark-700 text-dark-400 border-dark-600';
      default:
        return 'bg-dark-700 text-dark-300 border-dark-600';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert size={22} className="text-primary-400" />
            <h2 className="text-xl font-bold text-white">SOC Operations Command</h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary-500/10 text-primary-400 border border-primary-500/20">
              Cross-Case Intelligence
            </span>
          </div>
          <p className="text-xs text-dark-400 mt-1">
            Global forensic operations view across all cases, high-risk targets, and real-time security events.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Live Polling Indicator */}
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-accent-green/10 border border-accent-green/30 text-[11px] text-accent-green">
            <span className="w-2 h-2 rounded-full bg-accent-green animate-pulse" />
            <span className="font-semibold tracking-wide">LIVE</span>
            <span className="text-dark-400 text-[10px]">
              • {secondsAgo < 5 ? 'Just now' : `${secondsAgo}s ago`}
            </span>
          </div>

          <button
            onClick={handleRefresh}
            className="btn-ghost flex items-center gap-1.5 text-xs border border-dark-700/50 cursor-pointer"
            disabled={isRefreshing}
          >
            <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
            {isRefreshing ? 'Syncing…' : 'Refresh Operations'}
          </button>
        </div>
      </div>

      {/* ── PART 1: Cross-Case Org Level Stat Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { 
            label: 'Total Cases', 
            value: totalCases, 
            sub: `${casesOpenedThisWeek} opened this wk`,
            icon: FolderKanban, 
            color: 'text-primary-400', 
            bg: 'bg-primary-500/10 hover:bg-primary-500/20 border-primary-500/30' 
          },
          { 
            label: 'Active / Open', 
            value: openCases, 
            sub: `${totalCases > 0 ? Math.round((openCases / totalCases) * 100) : 0}% of caseload`,
            icon: Activity, 
            color: 'text-primary-400', 
            bg: 'bg-primary-500/10 hover:bg-primary-500/20 border-primary-500/30' 
          },
          { 
            label: 'Under Review', 
            value: reviewCases, 
            sub: 'Awaiting triage',
            icon: AlertTriangle, 
            color: 'text-accent-gold', 
            bg: 'bg-accent-gold/10 hover:bg-accent-gold/20 border-accent-gold/30' 
          },
          { 
            label: 'Closed Cases', 
            value: closedCases, 
            sub: 'Resolved files',
            icon: CheckCircle2, 
            color: 'text-accent-green', 
            bg: 'bg-accent-green/10 hover:bg-accent-green/20 border-accent-green/30' 
          },
          { 
            label: 'Critical Priority', 
            value: criticalCases, 
            sub: 'Immediate action',
            icon: Flame, 
            color: 'text-accent-red', 
            bg: 'bg-accent-red/10 hover:bg-accent-red/20 border-accent-red/30' 
          },
          { 
            label: 'High Priority', 
            value: highCases, 
            sub: 'Escalated cases',
            icon: AlertOctagon, 
            color: 'text-accent-gold', 
            bg: 'bg-accent-gold/10 hover:bg-accent-gold/20 border-accent-gold/30' 
          },
        ].map(stat => (
          <div
            key={stat.label}
            onClick={() => setPage('cases')}
            className={`glass-card p-3.5 ${stat.bg} rounded-xl border transition-all cursor-pointer hover:scale-[1.02] active:scale-95 group`}
            title={`View ${stat.label} in Case Management`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5">
                <stat.icon size={13} className={stat.color} />
                <span className="text-[10px] text-dark-300 uppercase font-semibold tracking-wider group-hover:text-white transition-colors">
                  {stat.label}
                </span>
              </div>
              <ArrowUpRight size={10} className="text-dark-500 group-hover:text-white transition-colors" />
            </div>
            <div className="text-2xl font-bold text-white tracking-tight">{stat.value}</div>
            <div className="text-[10px] text-dark-400 mt-1 truncate">{stat.sub}</div>
          </div>
        ))}
      </div>

      {/* ── PART 2: Highest Risk Active Cases Table ── */}
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Flame size={16} className="text-accent-red" />
            <h3 className="text-sm font-bold text-white">Highest Risk Active Cases</h3>
            <span className="text-[10px] text-dark-400 font-medium">(Priority & Recency Ranked)</span>
          </div>
          <button 
            onClick={() => setPage('cases')}
            className="text-xs text-primary-400 hover:underline flex items-center gap-1 cursor-pointer"
          >
            View All Cases ({cases.length}) <ExternalLink size={11} />
          </button>
        </div>

        {highestRiskCases.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-dark-800 text-dark-400 text-[10px] uppercase font-semibold">
                  <th className="py-2.5 px-3">Case ID</th>
                  <th className="py-2.5 px-3">Case Title</th>
                  <th className="py-2.5 px-3">Priority</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-center">Linked Wallets</th>
                  <th className="py-2.5 px-3 text-right">Last Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-800/60">
                {highestRiskCases.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => handleCaseClick(c)}
                    className="hover:bg-dark-800/40 transition-colors cursor-pointer group"
                  >
                    <td className="py-3 px-3 font-mono font-medium text-white group-hover:text-primary-400 transition-colors">
                      {c.caseNumber}
                    </td>
                    <td className="py-3 px-3 max-w-[280px]">
                      <div className="font-semibold text-white truncate">{c.title}</div>
                      <div className="text-[10px] text-dark-400 truncate">{c.description || 'No description provided'}</div>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${getPriorityBadge(c.priority)}`}>
                        {c.priority}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold capitalize border ${getStatusBadge(c.status)}`}>
                        {c.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="inline-flex items-center gap-1 text-[11px] font-mono text-dark-300">
                        <Wallet size={11} className="text-dark-400" />
                        {c.walletCount}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right text-dark-400 text-[11px]">
                      {timeAgo(c.updatedAt || c.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center text-dark-500 italic py-8 text-xs">
            {cases.length === 0 
              ? 'No cases registered in the organization database.' 
              : 'No active cases currently pending investigation.'}
          </div>
        )}
      </div>

      {/* ── PART 3: Charts Row (With "Enough Data" Validation) ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Active Investigation Alert Breakdown */}
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white">Active Investigation — Alert Breakdown</h3>
              <p className="text-[10px] text-dark-400 mt-0.5">
                Target: <span className="mono text-dark-300">{activeTargetAddress.slice(0, 10)}…{activeTargetAddress.slice(-6)}</span>
              </p>
            </div>
            <button 
              onClick={() => setPage('alerts')} 
              className="text-[11px] text-primary-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              View Alerts ({alerts.length}) <ExternalLink size={10} />
            </button>
          </div>

          {alerts.length >= 4 ? (
            <div>
              <ResponsiveContainer width="100%" height={190}>
                <PieChart>
                  <Pie
                    data={severityData}
                    cx="50%" cy="50%"
                    innerRadius={46} outerRadius={74}
                    dataKey="value"
                    stroke="none"
                  >
                    {severityData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8, fontSize: 11 }}
                    itemStyle={{ color: '#fff' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex items-center justify-center gap-4 mt-2 flex-wrap">
                {severityData.map(d => (
                  <div key={d.name} className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                    <span className="text-[10px] text-dark-400">{d.name}: <b className="text-white">{d.value}</b></span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-[210px] flex flex-col justify-center p-3 bg-dark-900/40 rounded-xl border border-dark-800">
              <div className="text-xs text-dark-300 font-semibold mb-3 flex items-center gap-2">
                <AlertCircle size={14} className="text-primary-400" />
                {alerts.length === 0 
                  ? 'No security alerts flagged for current target.' 
                  : `${alerts.length} Total Alert${alerts.length > 1 ? 's' : ''} (Compact Breakdown)`}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-lg bg-dark-800/50 border border-dark-700/50">
                  <span className="text-[9px] uppercase font-bold text-accent-red block">Critical</span>
                  <span className="text-lg font-bold text-white">{criticalAlerts}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-dark-800/50 border border-dark-700/50">
                  <span className="text-[9px] uppercase font-bold text-accent-gold block">High</span>
                  <span className="text-lg font-bold text-white">{highAlerts}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-dark-800/50 border border-dark-700/50">
                  <span className="text-[9px] uppercase font-bold text-primary-400 block">Medium</span>
                  <span className="text-lg font-bold text-white">{mediumAlerts}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-dark-800/50 border border-dark-700/50">
                  <span className="text-[9px] uppercase font-bold text-accent-green block">Low / Info</span>
                  <span className="text-lg font-bold text-white">{lowAlerts}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Evidence by Category */}
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white">Evidence by Category</h3>
              <p className="text-[10px] text-dark-400 mt-0.5">
                Distribution across forensic pattern categories
              </p>
            </div>
            <button 
              onClick={() => setPage('evidence')} 
              className="text-[11px] text-primary-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              Evidence Locker ({evidenceItems.length}) <ExternalLink size={10} />
            </button>
          </div>

          {evidenceBarData.length >= 3 ? (
            <ResponsiveContainer width="100%" height={210}>
              <BarChart data={evidenceBarData}>
                <XAxis dataKey="name" tick={{ fill: '#888', fontSize: 10 }} />
                <YAxis tick={{ fill: '#888', fontSize: 10 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8, fontSize: 11 }}
                  itemStyle={{ color: '#fff' }}
                />
                <Bar dataKey="count" fill="#06b6d4" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[210px] flex flex-col justify-center p-3 bg-dark-900/40 rounded-xl border border-dark-800">
              <div className="text-xs text-dark-300 font-semibold mb-2 flex items-center gap-2">
                <Database size={14} className="text-accent-green" />
                {evidenceItems.length === 0
                  ? 'No forensic evidence items recorded yet.'
                  : `${evidenceItems.length} Evidence Item${evidenceItems.length > 1 ? 's' : ''} Recorded`}
              </div>

              {evidenceItems.length > 0 ? (
                <div className="space-y-2 mt-1">
                  {evidenceItems.slice(0, 2).map((item) => (
                    <div key={item.id} className="p-2.5 rounded-lg bg-dark-800/50 border border-dark-700/50 flex items-start justify-between gap-3">
                      <div>
                        <span className="text-[9px] uppercase font-bold text-primary-400 bg-primary-500/10 px-1.5 py-0.5 rounded border border-primary-500/20">
                          {formatEvidenceType(item.type)}
                        </span>
                        <p className="text-xs font-semibold text-white mt-1">{item.title}</p>
                        <p className="text-[10px] text-dark-400 line-clamp-1">{item.description}</p>
                      </div>
                      <span className="text-[10px] text-dark-500 shrink-0">{timeAgo(item.timestamp)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-dark-500 italic">
                  Run an in-depth blockchain trace to identify transaction patterns and UTXO concentrations.
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── PART 4: Curated SOC Activity Feed ── */}
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-primary-400" />
            <h3 className="text-sm font-bold text-white">Curated Operations & Forensic Audit Stream</h3>
          </div>
          <button 
            onClick={() => setPage('audit')} 
            className="text-xs text-primary-400 hover:underline flex items-center gap-1 cursor-pointer"
          >
            Full Audit Logs ({auditLog.length}) <ExternalLink size={11} />
          </button>
        </div>

        <div className="space-y-2">
          {curatedAudit.map(entry => (
            <div key={entry.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-dark-900/30 border border-dark-800/50 hover:bg-dark-800/40 transition-colors">
              {entry.status === 'success' ? (
                <CheckCircle2 size={15} className="text-accent-green shrink-0" />
              ) : entry.status === 'failure' ? (
                <AlertOctagon size={15} className="text-accent-red shrink-0" />
              ) : (
                <Cpu size={15} className="text-primary-400 shrink-0" />
              )}
              <div className="flex-1 min-w-0 flex items-center gap-2 flex-wrap">
                <span className="text-xs text-white font-medium">{entry.detail}</span>
                {entry.count > 1 && (
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-primary-500/20 text-primary-400 border border-primary-500/30">
                    x{entry.count}
                  </span>
                )}
              </div>
              <span className="text-[10px] text-dark-500 shrink-0 font-mono">{timeAgo(entry.timestamp)}</span>
            </div>
          ))}

          {curatedAudit.length === 0 && (
            <div className="text-center text-dark-500 text-xs italic py-6">
              No significant investigation events logged yet.
            </div>
          )}
        </div>
      </div>

      {/* ── PART 5: Active Investigation Snapshot (Secondary, Collapsible) ── */}
      <div className="border border-dark-800 rounded-xl bg-dark-950/40 overflow-hidden">
        <button
          onClick={() => setShowSnapshot(s => !s)}
          className="w-full p-4 flex items-center justify-between hover:bg-dark-900/40 transition-colors text-left cursor-pointer"
        >
          <div className="flex items-center gap-3 flex-wrap">
            <Wallet size={16} className="text-dark-400" />
            <div>
              <span className="text-xs font-bold text-dark-200">Active Investigation Snapshot</span>
              <span className="text-[11px] text-dark-500 ml-2 mono">
                {activeTargetAddress.slice(0, 16)}…{activeTargetAddress.slice(-8)}
              </span>
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
              riskLevel === 'critical' ? 'bg-accent-red/20 text-accent-red border-accent-red/30' :
              riskLevel === 'high' ? 'bg-accent-gold/20 text-accent-gold border-accent-gold/30' :
              'bg-primary-500/20 text-primary-400 border-primary-500/30'
            }`}>
              Risk: {riskScore}% ({riskLevel.toUpperCase()})
            </span>
          </div>

          <div className="flex items-center gap-2 text-dark-400 text-xs">
            <span className="text-[11px]">{showSnapshot ? 'Hide Snapshot' : 'Show Snapshot'}</span>
            {showSnapshot ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </div>
        </button>

        {showSnapshot && (
          <div className="p-4 pt-0 border-t border-dark-800/60 mt-1 animate-fade-in">
            <p className="text-[11px] text-dark-400 mb-3">
              Secondary forensic snapshot for target wallet currently selected in the active pair-investigation session.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
              {[
                { label: 'Target Alerts', value: alerts.length, icon: AlertTriangle, color: 'text-accent-gold', page: 'alerts' },
                { label: 'Unread Alerts', value: alerts.filter(a => !a.isRead).length, icon: AlertCircle, color: 'text-accent-red', page: 'alerts' },
                { label: 'Counterparties', value: counterparties.length, icon: Activity, color: 'text-primary-400', page: 'blockchain' },
                { label: 'Evidence Items', value: evidenceItems.length, icon: Database, color: 'text-accent-green', page: 'evidence' },
                { label: 'Transactions', value: summary?.txCount || 0, icon: Terminal, color: 'text-primary-400', page: 'blockchain' },
                { label: 'Audit Events', value: auditLog.length, icon: Clock, color: 'text-dark-300', page: 'audit' },
              ].map(stat => (
                <div
                  key={stat.label}
                  onClick={() => setPage(stat.page as any)}
                  className="glass-card p-3 rounded-lg border border-dark-800 bg-dark-900/60 hover:border-dark-700 cursor-pointer transition-all hover:scale-[1.02]"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[9px] text-dark-400 uppercase font-semibold">{stat.label}</span>
                    <stat.icon size={11} className={stat.color} />
                  </div>
                  <div className="text-lg font-bold text-white tracking-tight">{stat.value.toLocaleString()}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
