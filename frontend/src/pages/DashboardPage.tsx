import React from 'react';
import {
  FolderOpen, Eye, Shield, Bell, FileText, Users, TrendingUp, Activity,
  ArrowUpRight, AlertTriangle, Clock, RefreshCw
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { useNavStore, useAlertStore, useCaseStore, useWatchlistStore } from '../stores';
import { timeAgo, getPriorityColor } from '../utils/helpers';
import { apiGet } from '../utils/api';

// ─── Types ───────────────────────────────────────────────────────────────────

interface SocDashboard {
  active_cases: number;
  open_cases: number;
  total_wallets: number;
  total_evidence: number;
  high_risk_wallets: number;
  open_alerts: number;
  closed_cases: number;
  team_members: number;
  cases_this_month: number;
}

interface AuditEntry {
  id: string;
  action: string;
  username: string;
  status: string;
  created_at?: string;
  timestamp?: string;
  case_ref?: string;
}

const STATUS_COLORS: Record<string, string> = {
  Active:    '#00ff88',
  Open:      '#00d4ff',
  Suspended: '#ffd700',
  Closed:    '#a855f7',
};

const tlIcon: Record<string, React.ReactNode> = {
  alert:    <Bell size={14} />,
  trace:    <Activity size={14} />,
  evidence: <Shield size={14} />,
  case:     <FolderOpen size={14} />,
  report:   <FileText size={14} />,
};

const tlColor: Record<string, string> = {
  alert:    'text-accent-red bg-accent-red/15',
  trace:    'text-primary-400 bg-primary-500/15',
  evidence: 'text-accent-green bg-accent-green/15',
  case:     'text-accent-gold bg-accent-gold/15',
  report:   'text-accent-purple bg-accent-purple/15',
};

// ─── Component ───────────────────────────────────────────────────────────────

export const DashboardPage: React.FC = () => {
  const { setPage }   = useNavStore();
  const { alerts }    = useAlertStore();
  const { cases, loadCases } = useCaseStore();
  const { entries }   = useWatchlistStore();

  const [dashboard, setDashboard]   = React.useState<SocDashboard | null>(null);
  const [timeline,  setTimeline]    = React.useState<AuditEntry[]>([]);
  const [activityData, setActivityData] = React.useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading]       = React.useState(false);
  const [lastRefresh, setLastRefresh] = React.useState<Date>(new Date());

  // ── Fetch dashboard stats from real API ─────────────────────────────────
  const fetchDashboard = React.useCallback(async () => {
    try {
      const data = await apiGet<SocDashboard>('/api/soc/dashboard');
      setDashboard(data);
    } catch {
      // If SOC endpoint unavailable, compute from local store state
      setDashboard(null);
    }
  }, []);

  // ── Fetch audit timeline ─────────────────────────────────────────────────
  const fetchTimeline = React.useCallback(async () => {
    try {
      const data = await apiGet<AuditEntry[]>('/api/audit/logs');
      setTimeline(Array.isArray(data) ? data.slice(0, 5) : []);
    } catch {
      setTimeline([]);
    }
  }, []);

  // ── Fetch weekly activity (audit log aggregation by day) ─────────────────
  const fetchActivity = React.useCallback(async () => {
    try {
      const data = await apiGet<Array<Record<string, unknown>>>('/api/soc/activity');
      if (Array.isArray(data) && data.length > 0) setActivityData(data);
    } catch {
      // Activity chart stays empty — no fabricated fallback
      setActivityData([]);
    }
  }, []);

  // ── Initial load ─────────────────────────────────────────────────────────
  React.useEffect(() => {
    void fetchDashboard();
    void fetchTimeline();
    void fetchActivity();
    void loadCases();
  }, [fetchDashboard, fetchTimeline, fetchActivity, loadCases]);

  // ── Auto-refresh every 30 seconds (real polling, no random jitter) ────────
  React.useEffect(() => {
    const interval = setInterval(() => {
      void fetchDashboard();
      void fetchTimeline();
      setLastRefresh(new Date());
    }, 30_000);
    return () => clearInterval(interval);
  }, [fetchDashboard, fetchTimeline]);

  // ── Compute stats — prefer API data, fall back to store state ────────────
  const activeCases      = dashboard?.active_cases    ?? cases.filter(c => c.status.toLowerCase() === 'active').length;
  const watchedWallets   = dashboard?.total_wallets   ?? entries.length;
  const evidenceItems    = dashboard?.total_evidence  ?? cases.reduce((s, c) => s + c.evidenceCount, 0);
  const activeAlerts     = dashboard?.open_alerts     ?? alerts.filter(a => !a.isRead).length;
  const casesThisMonth   = dashboard?.cases_this_month ?? 0;
  const teamMembers      = dashboard?.team_members    ?? Math.max(1, new Set(cases.map(c => c.investigatorName)).size);

  // ── Case status distribution from real case store ────────────────────────
  const caseStatusData = React.useMemo(() => {
    const counts: Record<string, number> = {};
    cases.forEach(c => {
      const key = c.status.charAt(0).toUpperCase() + c.status.slice(1);
      counts[key] = (counts[key] ?? 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({
      name,
      value,
      color: STATUS_COLORS[name] ?? '#78819a',
    }));
  }, [cases]);

  const statCards = [
    { label: 'Active Cases',     value: activeCases,    icon: FolderOpen, color: 'from-primary-500/20 to-primary-500/5',  iconColor: 'text-primary-400' },
    { label: 'Watched Wallets',  value: watchedWallets, icon: Eye,        color: 'from-accent-green/20 to-accent-green/5', iconColor: 'text-accent-green' },
    { label: 'Evidence Items',   value: evidenceItems,  icon: Shield,     color: 'from-accent-purple/20 to-accent-purple/5', iconColor: 'text-accent-purple' },
    { label: 'Active Alerts',    value: activeAlerts,   icon: Bell,       color: 'from-accent-red/20 to-accent-red/5',    iconColor: 'text-accent-red' },
    { label: 'Cases This Month', value: casesThisMonth, icon: TrendingUp, color: 'from-accent-gold/20 to-accent-gold/5',  iconColor: 'text-accent-gold' },
    { label: 'Team Members',     value: teamMembers,    icon: Users,      color: 'from-cyber-teal/20 to-cyber-teal/5',    iconColor: 'text-cyber-teal' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3 text-dark-400">
          <RefreshCw size={18} className="animate-spin" />
          <span className="text-sm">Loading dashboard…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Banner */}
      <div className="glass-card p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary-500/5 via-transparent to-accent-purple/5" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2 flex-wrap text-[10px] font-semibold tracking-widest uppercase">
              <div className="flex items-center gap-1.5 text-accent-green">
                <div className="w-1.5 h-1.5 rounded-full bg-accent-green animate-pulse" />
                <span>System Online — All Services Operational</span>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">Intelligence Overview</h1>
            <p className="text-sm text-dark-400">Real-time blockchain investigation metrics and case intelligence</p>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-dark-500 mt-1">
            <RefreshCw size={11} />
            <span>Updated {timeAgo(lastRefresh.toISOString())}</span>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="glass-card-hover p-4 relative overflow-hidden group cursor-pointer">
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
              <div className="relative">
                <div className="flex items-center justify-between mb-3">
                  <Icon size={18} className={stat.iconColor} />
                </div>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-[11px] text-dark-400 mt-1">{stat.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Chart */}
        <div className="lg:col-span-2 glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white">Investigation Activity</h3>
              <p className="text-[11px] text-dark-400">Weekly trace, alert, and evidence activity</p>
            </div>
            <div className="flex items-center gap-4 text-[10px]">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary-400" /> Traces</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-accent-red" /> Alerts</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-accent-green" /> Evidence</span>
            </div>
          </div>
          {activityData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={activityData}>
                <defs>
                  <linearGradient id="colorTraces" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#00d4ff" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorAlerts" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ff3366" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ff3366" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorEvidence" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00ff88" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#00ff88" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a1f36" />
                <XAxis dataKey="day" tick={{ fill: '#78819a', fontSize: 11 }} axisLine={false} />
                <YAxis tick={{ fill: '#78819a', fontSize: 11 }} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#1a1f36', border: '1px solid #2a3253', borderRadius: 8, fontSize: 12, color: '#fff' }} />
                <Area type="monotone" dataKey="traces"   stroke="#00d4ff" fillOpacity={1} fill="url(#colorTraces)"   strokeWidth={2} />
                <Area type="monotone" dataKey="alerts"   stroke="#ff3366" fillOpacity={1} fill="url(#colorAlerts)"   strokeWidth={2} />
                <Area type="monotone" dataKey="evidence" stroke="#00ff88" fillOpacity={1} fill="url(#colorEvidence)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[220px] text-dark-500 text-xs">
              No activity data available yet.
            </div>
          )}
        </div>

        {/* Case Status Pie — derived from real case store */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Case Distribution</h3>
          {caseStatusData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={caseStatusData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={5} dataKey="value">
                    {caseStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#1a1f36', border: '1px solid #2a3253', borderRadius: 8, fontSize: 12, color: '#fff' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {caseStatusData.map((item) => (
                  <div key={item.name} className="flex items-center gap-2 text-[11px]">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-dark-300">{item.name}</span>
                    <span className="text-white font-semibold ml-auto">{item.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-[180px] text-dark-500 text-xs">
              No cases loaded.
            </div>
          )}
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Alerts */}
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">Recent Alerts</h3>
            <button onClick={() => setPage('alerts')} className="text-[11px] text-primary-400 hover:text-primary-300">View All</button>
          </div>
          <div className="space-y-3">
            {alerts.slice(0, 4).map((alert) => (
              <div key={alert.id} className={`flex items-start gap-3 p-3 rounded-lg border transition-colors
                ${!alert.isRead ? 'bg-dark-800/50 border-dark-700/50' : 'bg-transparent border-transparent'}`}>
                <div className={`mt-0.5 ${
                  alert.severity === 'critical' ? 'text-accent-red' :
                  alert.severity === 'high' ? 'text-accent-gold' : 'text-primary-400'
                }`}>
                  <AlertTriangle size={14} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-dark-200 line-clamp-2">{alert.message}</p>
                  <span className="text-[10px] text-dark-500 mt-1 block">{timeAgo(alert.createdAt)}</span>
                </div>
              </div>
            ))}
            {alerts.length === 0 && (
              <p className="text-xs text-dark-500 text-center py-4">No alerts.</p>
            )}
          </div>
        </div>

        {/* Active Cases */}
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">Active Cases</h3>
            <button onClick={() => setPage('cases')} className="text-[11px] text-primary-400 hover:text-primary-300">View All</button>
          </div>
          <div className="space-y-3">
            {cases.filter(c => c.status.toLowerCase() === 'active').slice(0, 4).map((c) => (
              <div key={c.id} className="p-3 rounded-lg bg-dark-800/30 hover:bg-dark-800/50 transition-colors cursor-pointer border border-transparent hover:border-dark-700/50">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] mono text-dark-400">{c.caseNumber}</span>
                  <span className={getPriorityColor(c.priority)}>{c.priority}</span>
                </div>
                <p className="text-sm text-white font-medium truncate">{c.title}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[10px] text-dark-400">{c.investigatorName}</span>
                  <div className="flex items-center gap-2 text-[10px] text-dark-500">
                    <span>{c.walletCount} wallets</span>
                    <span>{c.evidenceCount} evidence</span>
                  </div>
                </div>
              </div>
            ))}
            {cases.filter(c => c.status.toLowerCase() === 'active').length === 0 && (
              <p className="text-xs text-dark-500 text-center py-4">No active cases.</p>
            )}
          </div>
        </div>

        {/* Activity Timeline — from real audit log */}
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">Activity Timeline</h3>
            <Clock size={14} className="text-dark-400" />
          </div>
          <div className="space-y-4">
            {timeline.map((entry) => {
              const type = entry.status === 'failure' ? 'alert' : 'case';
              return (
                <div key={entry.id} className="flex items-start gap-3">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${tlColor[type] ?? 'text-dark-400 bg-dark-700/50'}`}>
                    {tlIcon[type]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-white truncate">{entry.action}</p>
                    <p className="text-[11px] text-dark-400">Recorded by {entry.username}</p>
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-dark-500">
                      {entry.case_ref && <span className="mono text-primary-500/60">{entry.case_ref}</span>}
                      <span className="ml-auto">{timeAgo(entry.created_at ?? entry.timestamp ?? new Date().toISOString())}</span>
                    </div>
                  </div>
                </div>
              );
            })}
            {timeline.length === 0 && (
              <p className="text-xs text-dark-500 text-center py-4">No recent activity.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
