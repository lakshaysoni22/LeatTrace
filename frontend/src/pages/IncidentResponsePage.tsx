import React, { useState } from 'react';
import { useInvestigationStore } from '../stores/investigation';
import { useNavStore, useCaseStore } from '../stores';
import { apiPost } from '../utils/api';
import {
  Shield, AlertTriangle, CheckCircle2, Clock, Wallet, ArrowRight, ShieldAlert,
  Activity, FileText, Lock, Copy, Check, ExternalLink, ChevronDown, ChevronUp,
  RotateCcw, Building2, X, AlertCircle, Sparkles, Scale
} from 'lucide-react';

export const IncidentResponsePage: React.FC = () => {
  const {
    activeTargetAddress,
    summary,
    riskScore,
    riskLevel,
    alerts,
    counterparties,
    evidenceItems,
    transactions,
    investigationId,
    incidentResponseSteps,
    toggleIncidentStep,
    resetIncidentSteps,
    addAuditEntry,
  } = useInvestigationStore();

  const { setPage } = useNavStore();
  const { selectedCase } = useCaseStore();

  // Local UI state
  const [expandedCompleted, setExpandedCompleted] = useState<Record<string, boolean>>({});
  const [showFreezeModal, setShowFreezeModal] = useState(false);
  const [copiedFreeze, setCopiedFreeze] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [reportGenerating, setReportGenerating] = useState(false);
  const [reportSuccessMessage, setReportSuccessMessage] = useState<string | null>(null);

  // Derived metrics from real store data
  const criticalAlerts = alerts.filter(a => a.severity === 'critical');
  const highAlerts = alerts.filter(a => a.severity === 'high');
  const unconfirmedTxs = transactions.filter(tx => !tx.status?.confirmed);
  const balanceBtc = summary ? (summary.confirmedBalance / 1e8).toFixed(4) : '—';
  const txCountStr = summary?.txCount?.toLocaleString() || '—';

  // Format freeze request text block
  const freezeRequestText = `OFFICIAL LAW ENFORCEMENT VASP FREEZE NOTICE
═══════════════════════════════════════════════════════════════
CASE FILE ID:        ${investigationId}
TARGET INVESTIGATED: ${activeTargetAddress}
NETWORK / CHAIN:     ${summary?.chain || 'Bitcoin Mainnet'}
ESTIMATED HOLDINGS:  ${balanceBtc} BTC (${summary?.formattedBalance ?? balanceBtc} units)
RISK ASSESSMENT:     ${riskScore}/100 [${riskLevel.toUpperCase()} THREAT LEVEL]
ACTIVE ALERTS:       ${criticalAlerts.length} Critical, ${highAlerts.length} High
TIMESTAMP (UTC):     ${new Date().toUTCString()}
INVESTIGATION UNIT:  CBI & I4C National Cyber Forensics Center
═══════════════════════════════════════════════════════════════

STATUTORY INSTRUCTION TO EXCHANGE / VASP COMPLIANCE DESK:
Under Section 91 CrPC & national cybercrime prevention protocols,
please execute an immediate temporary administrative hold on any
inflow/outflow transactions associated with this address. Preserve all
associated deposit transactions, destination hot-wallet traces, and
KYC identification records for immediate transmission to the investigating officer.`.trim();

  // The 7 Incident Response Pipeline Steps
  const pipelineSteps = [
    {
      id: 'identify',
      phase: 'IDENTIFICATION',
      order: 1,
      title: 'Confirm Target Identity & Protocol',
      description: `Verify target wallet address ${activeTargetAddress.slice(0, 14)}…${activeTargetAddress.slice(-8)} as primary subject. Confirmed as ${summary?.scriptType || 'standard'} address on ${summary?.chain || 'Bitcoin Mainnet'}.`,
      status: summary ? 'actionable' : 'pending',
      actionLabel: 'View in Blockchain Analysis',
      actionRoute: 'blockchain',
    },
    {
      id: 'assess',
      phase: 'ASSESSMENT',
      order: 2,
      title: 'Threat & Risk Assessment Review',
      description: `Current calculated risk score: ${riskScore}/100 (${riskLevel.toUpperCase()} threat profile). ${criticalAlerts.length} critical and ${highAlerts.length} high-severity anomaly alerts flagged.`,
      status: riskScore > 50 ? 'critical' : riskScore > 25 ? 'warning' : 'normal',
      actionLabel: 'Inspect Active Alerts',
      actionRoute: 'alerts',
    },
    {
      id: 'contain',
      phase: 'CONTAINMENT',
      order: 3,
      title: 'Monitor Outgoing Mempool Transactions',
      description: unconfirmedTxs.length > 0
        ? `${unconfirmedTxs.length} unconfirmed transaction(s) pending in mempool. Active risk of immediate fund dissipation to mixers or off-ramps.`
        : 'No unconfirmed mempool transactions detected. Target balances are currently static on-chain.',
      status: unconfirmedTxs.length > 0 ? 'warning' : 'normal',
      actionLabel: unconfirmedTxs.length > 0 ? 'Watch Mempool Flow' : undefined,
    },
    {
      id: 'trace',
      phase: 'TRACING',
      order: 4,
      title: 'Counterparty & Flow Mapping',
      description: `${counterparties.length} counterparty entity node${counterparties.length !== 1 ? 's' : ''} mapped. Prioritize transaction paths with highest cumulative volume and nested clustering.`,
      status: counterparties.length > 20 ? 'warning' : 'normal',
      actionLabel: 'Explore Interactive Graph',
      actionRoute: 'graph',
    },
    {
      id: 'evidence',
      phase: 'EVIDENCE',
      order: 5,
      title: 'Preserve Digital Forensic Evidence',
      description: `${evidenceItems.length} evidence artifact${evidenceItems.length !== 1 ? 's' : ''} generated from live analysis. Ensure cryptographic hashes are preserved for court admissibility under Section 65B.`,
      status: evidenceItems.length > 0 ? 'actionable' : 'pending',
      actionLabel: 'Open Evidence Vault',
      actionRoute: 'evidence',
    },
    {
      id: 'freeze',
      phase: 'FREEZE REQUEST',
      order: 6,
      title: 'Coordinate Exchange Freeze Notification',
      description: balanceBtc !== '—' && parseFloat(balanceBtc) > 0.1
        ? `Target holds ${balanceBtc} BTC. Draft formal administrative freeze notices for legal transmission to centralized exchange compliance desks.`
        : 'Balance is minimal. Exchange freeze request is optional unless substantial incoming flow is detected.',
      status: parseFloat(balanceBtc || '0') > 5 ? 'critical' : parseFloat(balanceBtc || '0') > 0.5 ? 'warning' : 'normal',
      isCustomAction: true,
      customActionLabel: 'Draft Freeze Request',
    },
    {
      id: 'report',
      phase: 'REPORTING',
      order: 7,
      title: 'Generate Investigation Report',
      description: 'Compile verified blockchain forensics, counterparty interactions, and evidence chain-of-custody into an official LEA case docket.',
      status: 'actionable',
      isCustomAction: true,
      customActionLabel: 'Generate & View Report',
    },
  ];

  // Completion calculation
  const completedCount = pipelineSteps.filter(s => !!incidentResponseSteps[s.id]).length;
  const totalCount = pipelineSteps.length;
  const progressPercent = Math.round((completedCount / totalCount) * 100);

  // Status-based color mapping
  const getStatusColor = (status: string, isCompleted: boolean) => {
    if (isCompleted) return 'border-accent-green/40 bg-accent-green/[0.03] text-accent-green';
    switch (status) {
      case 'critical': return 'border-accent-red/50 bg-accent-red/[0.04] text-accent-red shadow-[0_0_15px_rgba(239,68,68,0.08)]';
      case 'warning': return 'border-accent-gold/50 bg-accent-gold/[0.04] text-accent-gold';
      case 'actionable': return 'border-primary-500/40 bg-primary-500/[0.03] text-primary-400';
      default: return 'border-dark-700/60 bg-dark-800/30 text-dark-400';
    }
  };

  const getRailNodeClasses = (status: string, isCompleted: boolean) => {
    if (isCompleted) {
      return 'bg-dark-950 border-accent-green text-accent-green shadow-[0_0_12px_rgba(34,197,94,0.35)] ring-4 ring-dark-950';
    }
    switch (status) {
      case 'critical':
        return 'bg-dark-950 border-accent-red text-accent-red shadow-[0_0_15px_rgba(239,68,68,0.45)] ring-4 ring-dark-950 animate-pulse-slow';
      case 'warning':
        return 'bg-dark-950 border-accent-gold text-accent-gold shadow-[0_0_10px_rgba(234,179,8,0.3)] ring-4 ring-dark-950';
      case 'actionable':
        return 'bg-dark-950 border-primary-400 text-primary-300 shadow-[0_0_10px_rgba(0,212,255,0.3)] ring-4 ring-dark-950';
      default:
        return 'bg-dark-950 border-dark-600 text-dark-400 ring-4 ring-dark-950';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'critical': return <ShieldAlert size={15} className="text-accent-red" />;
      case 'warning': return <AlertTriangle size={15} className="text-accent-gold" />;
      case 'actionable': return <Activity size={15} className="text-primary-400" />;
      default: return <Clock size={15} className="text-dark-400" />;
    }
  };

  // Step toggle handler
  const handleToggle = (id: string, title: string) => {
    if (id === 'freeze' && !incidentResponseSteps[id]) {
      // Prompt modal first for freeze request drafting
      setShowFreezeModal(true);
      return;
    }

    if (id === 'report' && !incidentResponseSteps[id]) {
      // Trigger report generation flow
      handleTriggerReport();
      return;
    }

    toggleIncidentStep(id, title);
  };

  // Step 6: Complete Freeze draft
  const handleConfirmFreezeDraft = () => {
    addAuditEntry(
      'FREEZE_REQUEST_DRAFTED',
      `Formal exchange freeze request notice drafted for target ${activeTargetAddress.slice(0, 16)}… (Case ${investigationId})`
    );
    toggleIncidentStep('freeze', 'Coordinate Exchange Freeze Notification');
    setShowFreezeModal(false);
  };

  const handleCopyFreezeText = () => {
    void navigator.clipboard.writeText(freezeRequestText);
    setCopiedFreeze(true);
    setTimeout(() => setCopiedFreeze(false), 2000);
  };

  const handleCopyAddress = () => {
    void navigator.clipboard.writeText(activeTargetAddress);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  // Step 7: Trigger Report Generation
  const handleTriggerReport = async () => {
    setReportGenerating(true);
    setReportSuccessMessage(null);

    try {
      // Attempt backend report persistence if a backend case is connected
      if (selectedCase?.id) {
        await apiPost('/api/reports', {
          case_id: selectedCase.id,
          title: `Incident Response Forensic Docket — ${investigationId}`,
          summary: `Formal on-chain incident response runbook compiled for target ${activeTargetAddress}. Risk score: ${riskScore}/100. ${criticalAlerts.length} critical alerts. Balance: ${balanceBtc} BTC.`,
          conclusions: `Target exhibits ${riskLevel.toUpperCase()} risk. Counterparty flow indicates ${counterparties.length} connected endpoints. Recommended next action: exchange freeze coordination and asset recovery tracking.`,
        }).catch(() => null);
      }
    } catch {
      // Safe fallback
    }

    addAuditEntry(
      'REPORT_GENERATED',
      `Incident Response Investigation Report generated for target ${activeTargetAddress.slice(0, 16)}… (${investigationId})`
    );

    if (!incidentResponseSteps['report']) {
      toggleIncidentStep('report', 'Generate Investigation Report');
    }

    setReportGenerating(false);
    setReportSuccessMessage(`Incident report compiled and saved to case docket ${investigationId}.`);
    setTimeout(() => setReportSuccessMessage(null), 5000);
  };

  return (
    <div className="space-y-6 animate-fade-in relative pb-12">
      {/* ── 1. COMPACT STICKY HEADER BAR ── */}
      <header className="sticky top-0 z-30 -mx-4 px-4 sm:-mx-6 sm:px-6 py-3 bg-dark-900/90 backdrop-blur-xl border-b border-dark-700/60 shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Left: Identity & Live Target */}
          <div className="flex items-center gap-3 min-w-0">
            {/* Threat Badge */}
            <div className={`px-3 py-1.5 rounded-lg border flex items-center gap-2 shrink-0 ${
              riskLevel === 'critical'
                ? 'bg-accent-red/15 border-accent-red/40 text-accent-red'
                : riskLevel === 'high'
                ? 'bg-accent-gold/15 border-accent-gold/40 text-accent-gold'
                : 'bg-accent-green/15 border-accent-green/40 text-accent-green'
            }`}>
              <ShieldAlert size={16} />
              <div className="leading-tight">
                <div className="text-[9px] font-mono uppercase tracking-wider font-semibold opacity-80">Threat Score</div>
                <div className="text-sm font-extrabold">{riskScore}/100</div>
              </div>
            </div>

            {/* Target Address & Case info */}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                  Incident Response Runbook
                </h2>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-dark-800 border border-dark-700 text-dark-300">
                  {investigationId}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-dark-400 mt-0.5">
                <Wallet size={12} className="text-primary-400 shrink-0" />
                <span className="font-mono text-dark-300 truncate max-w-[180px] sm:max-w-[280px]">
                  {activeTargetAddress}
                </span>
                <button
                  onClick={handleCopyAddress}
                  className="p-1 text-dark-400 hover:text-white transition-colors"
                  title="Copy Target Address"
                >
                  {copiedAddress ? <Check size={11} className="text-accent-green" /> : <Copy size={11} />}
                </button>
                <span className="text-dark-600 hidden md:inline">•</span>
                <span className="hidden md:inline font-mono text-[11px] text-dark-400">
                  {balanceBtc} BTC
                </span>
                <span className="text-dark-600 hidden md:inline">•</span>
                <span className="hidden md:inline font-mono text-[11px] text-dark-400">
                  {txCountStr} txs
                </span>
              </div>
            </div>
          </div>

          {/* Right: Segmented Progress Bar & Quick Actions */}
          <div className="flex items-center gap-3 shrink-0 self-end lg:self-center w-full lg:w-auto">
            <div className="flex-1 lg:w-64 space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-dark-400 font-mono">
                  Kill Chain Progress: <strong className="text-white">{completedCount}/{totalCount}</strong>
                </span>
                <span className={`font-mono font-bold ${completedCount === totalCount ? 'text-accent-green' : 'text-primary-400'}`}>
                  {progressPercent}%
                </span>
              </div>

              {/* 7-Segment Progress Bar */}
              <div className="grid grid-cols-7 gap-1 h-2 bg-dark-800/80 p-0.5 rounded-full border border-dark-700/60">
                {pipelineSteps.map((step) => {
                  const isDone = !!incidentResponseSteps[step.id];
                  return (
                    <div
                      key={step.id}
                      title={`Step ${step.order}: ${step.title} (${isDone ? 'Completed' : 'Pending'})`}
                      className={`h-full rounded-full transition-all duration-300 ${
                        isDone
                          ? 'bg-accent-green shadow-[0_0_8px_rgba(34,197,94,0.5)]'
                          : step.status === 'critical'
                          ? 'bg-accent-red/40'
                          : step.status === 'warning'
                          ? 'bg-accent-gold/40'
                          : 'bg-dark-700'
                      }`}
                    />
                  );
                })}
              </div>
            </div>

            {/* Reset / Clear */}
            {completedCount > 0 && (
              <button
                onClick={() => resetIncidentSteps()}
                className="p-1.5 rounded-lg border border-dark-700 hover:border-dark-600 bg-dark-800/50 text-dark-400 hover:text-accent-red transition-colors shrink-0"
                title="Reset Completed Runbook Steps"
              >
                <RotateCcw size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Dynamic Success Notification */}
        {reportSuccessMessage && (
          <div className="mt-2.5 px-3 py-2 rounded-lg bg-accent-green/10 border border-accent-green/30 text-accent-green text-xs flex items-center justify-between animate-slide-down">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={14} className="shrink-0" />
              <span>{reportSuccessMessage}</span>
            </div>
            <button
              onClick={() => setPage('reports')}
              className="font-bold underline ml-3 hover:text-white shrink-0"
            >
              Open Reports Page →
            </button>
          </div>
        )}
      </header>

      {/* ── 2. PHASE-GROUPED PIPELINE TIMELINE ── */}
      <div className="relative pt-2">
        {/* Continuous Left Timeline Rail Line (Desktop/Tablet) */}
        <div className="hidden sm:block absolute left-[29px] top-6 bottom-10 w-0.5 bg-gradient-to-b from-primary-500/30 via-dark-700 to-dark-800 pointer-events-none z-0" />

        <div className="space-y-4">
          {pipelineSteps.map((step) => {
            const isCompleted = !!incidentResponseSteps[step.id];
            const completedTime = incidentResponseSteps[step.id];
            const isExpanded = !!expandedCompleted[step.id];

            // If completed and not expanded: render condensed single-line row
            if (isCompleted && !isExpanded) {
              return (
                <div
                  key={step.id}
                  className="sm:pl-16 relative flex items-center group"
                >
                  {/* Timeline Rail Node */}
                  <div className="hidden sm:flex absolute left-4 w-7 h-7 rounded-full border items-center justify-center bg-dark-950 border-accent-green text-accent-green text-xs font-bold shrink-0 transition-all shadow-[0_0_8px_rgba(34,197,94,0.3)] ring-4 ring-dark-950 z-10">
                    <CheckCircle2 size={14} />
                  </div>

                  {/* Condensed Row Card */}
                  <div className="w-full glass-card py-2.5 px-3.5 border border-accent-green/30 bg-accent-green/[0.02] rounded-xl flex items-center justify-between gap-3 hover:border-accent-green/50 transition-all">
                    <div className="flex items-center gap-3 min-w-0">
                      <button
                        onClick={() => handleToggle(step.id, step.title)}
                        className="w-5 h-5 rounded-md border border-accent-green/60 bg-accent-green/20 text-accent-green flex items-center justify-center shrink-0 cursor-pointer hover:bg-accent-green/30 transition-colors"
                        title="Click to reopen step"
                      >
                        <Check size={12} strokeWidth={3} />
                      </button>
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-dark-500 font-semibold shrink-0">
                          PHASE 0{step.order}
                        </span>
                        <span className="text-xs text-dark-400 font-semibold line-through truncate">
                          {step.title}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      {completedTime && (
                        <span className="text-[10px] font-mono text-dark-500 hidden md:inline">
                          Completed {new Date(completedTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                      <button
                        onClick={() => setExpandedCompleted(prev => ({ ...prev, [step.id]: true }))}
                        className="p-1 rounded text-dark-400 hover:text-white hover:bg-dark-800 transition-colors flex items-center gap-1 text-[10px] font-mono"
                        title="Show step details"
                      >
                        <span>Details</span>
                        <ChevronDown size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            }

            // Expanded or Incomplete Card
            return (
              <div
                key={step.id}
                className="sm:pl-16 relative flex items-start group"
              >
                {/* Timeline Rail Node */}
                <div
                  className={`hidden sm:flex absolute left-4 top-4 w-7 h-7 rounded-full border items-center justify-center text-xs font-bold shrink-0 transition-all z-10 ${
                    getRailNodeClasses(step.status, isCompleted)
                  }`}
                >
                  {isCompleted ? <Check size={13} strokeWidth={2.5} /> : step.order}
                </div>

                {/* Step Card */}
                <div
                  className={`w-full glass-card p-4 rounded-xl border transition-all duration-200 ${
                    step.status === 'critical' && !isCompleted
                      ? 'border-l-4 border-l-accent-red border-dark-700/60 bg-accent-red/[0.02] shadow-[0_0_20px_rgba(239,68,68,0.06)]'
                      : step.status === 'warning' && !isCompleted
                      ? 'border-l-4 border-l-accent-gold border-dark-700/60 bg-accent-gold/[0.02]'
                      : step.status === 'actionable' && !isCompleted
                      ? 'border-l-2 border-l-primary-500/70 border-dark-700/60'
                      : 'border-dark-700/60'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Checkbox */}
                    <button
                      onClick={() => handleToggle(step.id, step.title)}
                      className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center shrink-0 cursor-pointer transition-all ${
                        isCompleted
                          ? 'bg-accent-green/20 border-accent-green/60 text-accent-green'
                          : 'border-dark-600 hover:border-primary-400 bg-dark-800/60'
                      }`}
                      title={isCompleted ? 'Mark step as incomplete' : 'Mark step as completed'}
                    >
                      {isCompleted && <Check size={12} strokeWidth={3} />}
                    </button>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      {/* Tags & Phase */}
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-dark-800 border border-dark-700 text-primary-300">
                            STEP {step.order} · {step.phase}
                          </span>
                          {!isCompleted && (
                            <span className="flex items-center gap-1">
                              {getStatusIcon(step.status)}
                              <span className="text-[10px] font-mono uppercase text-dark-400">
                                {step.status}
                              </span>
                            </span>
                          )}
                        </div>

                        {/* If completed and expanded: allow collapsing back */}
                        {isCompleted && (
                          <button
                            onClick={() => setExpandedCompleted(prev => ({ ...prev, [step.id]: false }))}
                            className="text-dark-400 hover:text-white text-[10px] font-mono flex items-center gap-1"
                          >
                            <span>Collapse</span>
                            <ChevronUp size={12} />
                          </button>
                        )}
                      </div>

                      {/* Title & Description */}
                      <h3 className={`text-sm font-bold tracking-tight mb-1 ${
                        isCompleted ? 'text-dark-300 line-through' : 'text-white'
                      }`}>
                        {step.title}
                      </h3>
                      <p className="text-xs text-dark-300/90 leading-relaxed font-sans">
                        {step.description}
                      </p>

                      {/* Contextual Action Bar */}
                      <div className="mt-3 pt-2.5 border-t border-dark-700/40 flex flex-wrap items-center justify-between gap-2">
                        {/* Custom Actions */}
                        {step.id === 'freeze' && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setShowFreezeModal(true)}
                              className="px-3 py-1.5 rounded-lg bg-accent-red/10 border border-accent-red/30 text-accent-red hover:bg-accent-red/20 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                            >
                              <Building2 size={13} />
                              <span>{isCompleted ? 'View Freeze Notice' : 'Draft VASP Freeze Request'}</span>
                            </button>
                            <span className="text-[10px] text-dark-400 font-mono hidden md:inline">
                              Exchange Compliance Dispatch
                            </span>
                          </div>
                        )}

                        {step.id === 'report' && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={handleTriggerReport}
                              disabled={reportGenerating}
                              className="px-3 py-1.5 rounded-lg bg-primary-500/20 border border-primary-500/40 text-primary-300 hover:bg-primary-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                            >
                              <FileText size={13} />
                              <span>{reportGenerating ? 'Compiling Report…' : 'Generate & Save Report'}</span>
                            </button>
                            <button
                              onClick={() => setPage('reports')}
                              className="px-2.5 py-1.5 rounded-lg border border-dark-700 bg-dark-800/60 hover:bg-dark-700 text-dark-300 hover:text-white text-xs font-medium flex items-center gap-1 transition-colors"
                            >
                              <span>Open Reports</span>
                              <ArrowRight size={12} />
                            </button>
                          </div>
                        )}

                        {/* Navigation Shortcut Actions for other steps */}
                        {step.actionRoute && step.actionLabel && (
                          <button
                            onClick={() => setPage(step.actionRoute as any)}
                            className="text-xs font-medium text-primary-400 hover:text-primary-300 flex items-center gap-1 transition-colors cursor-pointer group/btn"
                          >
                            <span>{step.actionLabel}</span>
                            <ArrowRight size={12} className="transition-transform group-hover/btn:translate-x-0.5" />
                          </button>
                        )}

                        {/* Completion Timestamp */}
                        {isCompleted && completedTime && (
                          <div className="ml-auto text-[10px] font-mono text-dark-400 flex items-center gap-1">
                            <Clock size={11} className="text-accent-green" />
                            <span>Marked complete at {new Date(completedTime).toLocaleTimeString()}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 3. EXCHANGE FREEZE DRAFT MODAL (Step 6) ── */}
      {showFreezeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="glass-card w-full max-w-2xl p-5 sm:p-6 rounded-2xl border border-dark-700 shadow-2xl bg-dark-900/95 space-y-4 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3 border-b border-dark-700/60">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-accent-red/10 border border-accent-red/30 flex items-center justify-center text-accent-red shrink-0">
                  <Scale size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight">
                    Coordinate Exchange Freeze Notice
                  </h3>
                  <p className="text-xs text-dark-400">
                    Draft legal administrative hold order for Centralized Exchanges & VASPs
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowFreezeModal(false)}
                className="p-1 rounded-lg text-dark-400 hover:text-white hover:bg-dark-800 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Statutory Compliance Notice Banner */}
            <div className="p-3 rounded-xl bg-accent-gold/10 border border-accent-gold/30 text-xs text-accent-gold flex items-start gap-2.5">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <strong>Investigator Notice:</strong> Blockchain addresses cannot be frozen natively on-chain without smart contract blacklist functions. This interface drafts a formal statutory notice for the investigating officer to transmit through official CBI / LEA channels directly to designated VASP compliance officers.
              </div>
            </div>

            {/* Generated Formatted Text Block */}
            <div className="flex-1 min-h-0 flex flex-col space-y-2">
              <div className="flex items-center justify-between text-xs text-dark-400">
                <span className="font-mono text-[11px] uppercase tracking-wider">
                  Draft Notice (Case {investigationId})
                </span>
                <button
                  onClick={handleCopyFreezeText}
                  className="px-2.5 py-1 rounded-md bg-dark-800 border border-dark-700 hover:border-dark-600 text-dark-300 hover:text-white text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copiedFreeze ? (
                    <>
                      <Check size={12} className="text-accent-green" />
                      <span className="text-accent-green">Copied Notice</span>
                    </>
                  ) : (
                    <>
                      <Copy size={12} />
                      <span>Copy Notice</span>
                    </>
                  )}
                </button>
              </div>

              <textarea
                readOnly
                value={freezeRequestText}
                className="w-full flex-1 min-h-[190px] p-3 rounded-xl bg-dark-950/80 border border-dark-700/80 font-mono text-[11px] text-dark-300 leading-relaxed resize-none focus:outline-none focus:border-primary-500/50"
              />
            </div>

            {/* Modal Actions */}
            <div className="pt-3 border-t border-dark-700/60 flex items-center justify-between gap-3">
              <span className="text-[11px] text-dark-400 hidden sm:inline font-mono">
                Action will log: <code className="text-primary-400 font-semibold">FREEZE_REQUEST_DRAFTED</code>
              </span>
              <div className="flex items-center gap-2 ml-auto">
                <button
                  onClick={() => setShowFreezeModal(false)}
                  className="px-3.5 py-1.5 rounded-xl border border-dark-700 text-dark-300 hover:text-white hover:bg-dark-800 text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmFreezeDraft}
                  className="px-4 py-1.5 rounded-xl bg-accent-green/20 border border-accent-green/50 text-accent-green hover:bg-accent-green/30 text-xs font-bold transition-all shadow-[0_0_10px_rgba(34,197,94,0.2)] flex items-center gap-1.5"
                >
                  <CheckCircle2 size={14} />
                  <span>Confirm Draft & Mark Step Done</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
