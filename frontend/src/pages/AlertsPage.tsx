import React, { useState, useEffect } from 'react';
import { useNavStore, useBlockchainStore } from '../stores';
import { useInvestigationStore, InvestigationAlert } from '../stores/investigation';
import { Bell, Check, ShieldAlert, ArrowRight, Filter, AlertTriangle, Wallet, Activity, Layers } from 'lucide-react';

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

export const AlertsPage: React.FC = () => {
  const { setPage } = useNavStore();
  const { setSearchAddress } = useBlockchainStore();
  const { 
    activeTargetAddress, 
    alerts, 
    markAlertRead, 
    markAllAlertsRead, 
    fetchBackendAlerts, 
    setActiveTarget 
  } = useInvestigationStore();

  const [severityFilter, setSeverityFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  // Sync backend alerts on mount and merge with generated signals
  useEffect(() => {
    void fetchBackendAlerts();
  }, [fetchBackendAlerts]);

  const filteredAlerts = alerts.filter((a) => {
    const matchesSev = severityFilter === 'all' || a.severity === severityFilter;
    const matchesType = typeFilter === 'all' || a.type === typeFilter;
    return matchesSev && matchesType;
  });

  const unreadCount = alerts.filter(a => !a.isRead).length;

  const handleTraceAlert = (alert: InvestigationAlert) => {
    const targetToTrace = alert.flaggedAddress || alert.walletAddress || activeTargetAddress;
    setSearchAddress(targetToTrace);
    if (alert.type === 'mixer_exposure' || alert.type === 'sanctions_match') {
      if (alert.flaggedAddress && alert.flaggedAddress.toLowerCase() !== activeTargetAddress.toLowerCase()) {
        void setActiveTarget(alert.flaggedAddress);
      }
      setPage('graph');
    } else {
      setPage('blockchain');
    }
  };

  const getAlertIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <ShieldAlert size={16} className="text-accent-red animate-pulse" />;
      case 'high':
        return <AlertTriangle size={16} className="text-accent-gold" />;
      case 'medium':
        return <Activity size={16} className="text-primary-400" />;
      default:
        return <Bell size={16} className="text-dark-400" />;
    }
  };

  const getBgStyle = (severity: string, isRead: boolean) => {
    if (isRead) return 'bg-dark-800/20 border-dark-800 opacity-60';
    switch (severity) {
      case 'critical':
        return 'bg-accent-red/5 border-accent-red/20 shadow-glow-red/5 hover:border-accent-red/30';
      case 'high':
        return 'bg-accent-gold/5 border-accent-gold/20 hover:border-accent-gold/30';
      case 'medium':
        return 'bg-primary-500/5 border-primary-500/20 hover:border-primary-500/30';
      default:
        return 'bg-dark-800/30 border-dark-700/50 hover:border-dark-600';
    }
  };

  const getSeverityBadge = (severity: string) => {
    const colors: Record<string, string> = {
      critical: 'bg-accent-red/20 text-accent-red border-accent-red/30',
      high: 'bg-accent-gold/20 text-accent-gold border-accent-gold/30',
      medium: 'bg-primary-500/20 text-primary-400 border-primary-500/30',
      low: 'bg-accent-green/20 text-accent-green border-accent-green/30',
      info: 'bg-dark-700 text-dark-300 border-dark-600',
    };
    return colors[severity] || colors.info;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">Security Alerts</h2>
          <div className="flex items-center gap-2 mt-1">
            <Wallet size={12} className="text-primary-400" />
            <span className="text-xs text-dark-400 mono">{activeTargetAddress.slice(0, 16)}…{activeTargetAddress.slice(-8)}</span>
            <span className="text-[10px] text-dark-500">•</span>
            <span className="text-xs text-dark-400">{unreadCount} unread alert{unreadCount !== 1 ? 's' : ''}</span>
          </div>
        </div>
        <button 
          onClick={() => void markAllAlertsRead()}
          className="w-full sm:w-auto btn-ghost flex items-center justify-center gap-1 text-xs border border-dark-700/50 cursor-pointer"
        >
          <Check size={14} /> Mark all read
        </button>
      </div>

      {/* Filter Bar */}
      <div className="glass-card p-4 flex flex-col gap-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Severity Row */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 mr-1 text-dark-400">
              <Filter size={12} />
              <span className="text-xs text-dark-300 font-medium">Severity:</span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {['all', 'critical', 'high', 'medium', 'low', 'info'].map((sev) => (
                <button
                  key={sev}
                  onClick={() => setSeverityFilter(sev)}
                  className={`px-2.5 py-0.5 rounded text-[10px] font-bold capitalize transition-all cursor-pointer ${
                    severityFilter === sev
                      ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                      : 'bg-dark-800 text-dark-400 border border-transparent hover:border-dark-700'
                  }`}
                >
                  {sev}
                </button>
              ))}
            </div>
          </div>

          <div className="text-[10px] text-dark-500 self-end md:self-auto">
            {filteredAlerts.length} alert{filteredAlerts.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Type Filter Row */}
        <div className="flex items-center gap-2 flex-wrap border-t border-dark-800/60 pt-2.5">
          <div className="flex items-center gap-1.5 mr-1 text-dark-400">
            <Layers size={12} />
            <span className="text-xs text-dark-300 font-medium">Alert Type:</span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'all', label: 'All Types' },
              { id: 'mixer_exposure', label: 'Mixer Exposure' },
              { id: 'sanctions_match', label: 'Sanctions Match' },
              { id: 'large_transfer', label: 'Large Transfer' },
              { id: 'high_balance', label: 'High Balance' },
              { id: 'mempool_activity', label: 'Mempool Activity' },
              { id: 'target_profile', label: 'Profile' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTypeFilter(t.id)}
                className={`px-2.5 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                  typeFilter === t.id
                    ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                    : 'bg-dark-800 text-dark-400 border border-transparent hover:border-dark-700'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Alerts List */}
      <div className="space-y-3">
        {filteredAlerts.map((alert) => (
          <div 
            key={alert.id}
            className={`p-4 rounded-xl border transition-all duration-200 flex items-start justify-between gap-4 ${getBgStyle(alert.severity, alert.isRead)}`}
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex-shrink-0">
                {getAlertIcon(alert.severity)}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase border ${getSeverityBadge(alert.severity)}`}>
                    {alert.severity}
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-dark-800 border border-dark-700 text-dark-300">
                    {alert.type.replace(/_/g, ' ')}
                  </span>
                  <span className="text-[10px] text-dark-400">{timeAgo(alert.timestamp)}</span>
                  {!alert.isRead && (
                    <span className="w-1.5 h-1.5 bg-primary-400 rounded-full animate-ping" />
                  )}
                </div>

                <p className="text-sm font-medium text-white mb-2 leading-relaxed">
                  {alert.message}
                </p>

                {alert.flaggedAddress && (
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="text-[10px] text-dark-400">Flagged Entity:</span>
                    <span className="text-[10px] mono text-accent-gold bg-dark-900/80 px-2 py-0.5 rounded border border-dark-700/80">
                      {alert.flaggedAddress}
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-4 text-[10px] font-semibold text-primary-400">
                  <button 
                    onClick={() => handleTraceAlert(alert)}
                    className="hover:underline flex items-center gap-1.5 cursor-pointer"
                  >
                    {alert.type === 'mixer_exposure' || alert.type === 'sanctions_match'
                      ? 'Trace Evidence on Graph'
                      : 'Trace on Blockchain'} <ArrowRight size={10} />
                  </button>
                </div>
              </div>
            </div>

            {!alert.isRead && (
              <button 
                onClick={() => void markAlertRead(alert.id)}
                className="p-1 rounded text-dark-400 hover:text-accent-green hover:bg-dark-800 transition-colors flex-shrink-0 cursor-pointer"
                title="Mark Read"
              >
                <Check size={14} />
              </button>
            )}
          </div>
        ))}

        {filteredAlerts.length === 0 && (
          <div className="glass-card p-12 text-center text-dark-500 italic">
            {alerts.length === 0
              ? 'No alerts generated. Analyze a wallet address to generate security alerts.'
              : `No alerts matching selected filters (severity: "${severityFilter}", type: "${typeFilter}").`}
          </div>
        )}
      </div>
    </div>
  );
};
