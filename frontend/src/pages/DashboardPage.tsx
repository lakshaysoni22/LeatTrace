import React from 'react';
import {
  FolderOpen, Eye, Shield, Bell, FileText, Users, TrendingUp, Activity,
  ArrowUpRight, ArrowDownRight, AlertTriangle, Clock
} from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { mockDashboardStats, mockTimeline, mockAlerts, mockCases } from '../data/mockData';
import { useNavStore } from '../stores';
import { timeAgo, getStatusColor, getPriorityColor } from '../utils/helpers';

const activityData = [
  { day: 'Mon', traces: 12, alerts: 3, evidence: 5 },
  { day: 'Tue', traces: 18, alerts: 7, evidence: 8 },
  { day: 'Wed', traces: 15, alerts: 2, evidence: 12 },
  { day: 'Thu', traces: 25, alerts: 9, evidence: 6 },
  { day: 'Fri', traces: 22, alerts: 5, evidence: 15 },
  { day: 'Sat', traces: 8, alerts: 1, evidence: 3 },
  { day: 'Sun', traces: 30, alerts: 11, evidence: 9 },
];

const caseStatusData = [
  { name: 'Active', value: 4, color: '#00ff88' },
  { name: 'Open', value: 2, color: '#00d4ff' },
  { name: 'Suspended', value: 1, color: '#ffd700' },
  { name: 'Closed', value: 1, color: '#a855f7' },
];

const chainDistribution = [
  { chain: 'ETH', txns: 847, volume: 12450 },
  { chain: 'USDT', txns: 234, volume: 5670 },
  { chain: 'USDC', txns: 156, volume: 3420 },
  { chain: 'DAI', txns: 89, volume: 1230 },
];

const tlIcon: Record<string, React.ReactNode> = {
  alert: <Bell size={14} />,
  trace: <Activity size={14} />,
  evidence: <Shield size={14} />,
  case: <FolderOpen size={14} />,
  report: <FileText size={14} />,
};

const tlColor: Record<string, string> = {
  alert: 'text-accent-red bg-accent-red/15',
  trace: 'text-primary-400 bg-primary-500/15',
  evidence: 'text-accent-green bg-accent-green/15',
  case: 'text-accent-gold bg-accent-gold/15',
  report: 'text-accent-purple bg-accent-purple/15',
};

export const DashboardPage: React.FC = () => {
  const { setPage } = useNavStore();
  const stats = mockDashboardStats;

  const statCards = [
    { label: 'Active Cases', value: stats.activeCases, icon: FolderOpen, color: 'from-primary-500/20 to-primary-500/5', iconColor: 'text-primary-400', change: '+2', trend: 'up' },
    { label: 'Watched Wallets', value: stats.watchedWallets, icon: Eye, color: 'from-accent-green/20 to-accent-green/5', iconColor: 'text-accent-green', change: '+1', trend: 'up' },
    { label: 'Evidence Items', value: stats.totalEvidence, icon: Shield, color: 'from-accent-purple/20 to-accent-purple/5', iconColor: 'text-accent-purple', change: '+12', trend: 'up' },
    { label: 'Active Alerts', value: stats.recentAlerts, icon: Bell, color: 'from-accent-red/20 to-accent-red/5', iconColor: 'text-accent-red', change: '+3', trend: 'up' },
    { label: 'Cases This Month', value: stats.casesThisMonth, icon: TrendingUp, color: 'from-accent-gold/20 to-accent-gold/5', iconColor: 'text-accent-gold', change: '+1', trend: 'up' },
    { label: 'Team Members', value: stats.totalUsers, icon: Users, color: 'from-cyber-teal/20 to-cyber-teal/5', iconColor: 'text-cyber-teal', change: '0', trend: 'neutral' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Banner */}
      <div className="glass-card p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary-500/5 via-transparent to-accent-purple/5" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative">
          <div className="flex items-center gap-3 mb-2 flex-wrap text-[10px] font-semibold tracking-widest uppercase">
            <div className="flex items-center gap-1.5 text-accent-green">
              <div className="w-1.5 h-1.5 rounded-full bg-accent-green animate-pulse" />
              <span>System Online — All Services Operational</span>
            </div>
            <span className="text-dark-600">•</span>
            <div className="flex items-center gap-1.5 text-primary-400">
              <Shield size={11} className="animate-pulse" />
              <span>FAIIS Autonomous Loop: ACTIVE</span>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">Intelligence Overview</h1>
          <p className="text-sm text-dark-400">Real-time blockchain investigation metrics and case intelligence</p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="glass-card-hover p-4 relative overflow-hidden group cursor-pointer">
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
              <div className="relative">
                <div className="flex items-center justify-between mb-3">
                  <Icon size={18} className={stat.iconColor} />
                  {stat.trend === 'up' && (
                    <span className="flex items-center text-[10px] text-accent-green font-medium">
                      <ArrowUpRight size={12} /> {stat.change}
                    </span>
                  )}
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
              <Tooltip
                contentStyle={{ backgroundColor: '#1a1f36', border: '1px solid #2a3253', borderRadius: 8, fontSize: 12, color: '#fff' }}
                itemStyle={{ color: '#e2e8f0' }}
              />
              <Area type="monotone" dataKey="traces" stroke="#00d4ff" fillOpacity={1} fill="url(#colorTraces)" strokeWidth={2} />
              <Area type="monotone" dataKey="alerts" stroke="#ff3366" fillOpacity={1} fill="url(#colorAlerts)" strokeWidth={2} />
              <Area type="monotone" dataKey="evidence" stroke="#00ff88" fillOpacity={1} fill="url(#colorEvidence)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Case Status Pie */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Case Distribution</h3>
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
            {mockAlerts.slice(0, 4).map((alert) => (
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
          </div>
        </div>

        {/* Active Cases */}
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">Active Cases</h3>
            <button onClick={() => setPage('cases')} className="text-[11px] text-primary-400 hover:text-primary-300">View All</button>
          </div>
          <div className="space-y-3">
            {mockCases.filter((c) => c.status === 'active').slice(0, 4).map((c) => (
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
          </div>
        </div>

        {/* Activity Timeline */}
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">Activity Timeline</h3>
            <Clock size={14} className="text-dark-400" />
          </div>
          <div className="space-y-4">
            {mockTimeline.slice(0, 5).map((entry) => (
              <div key={entry.id} className="flex items-start gap-3">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${tlColor[entry.type] || 'text-dark-400 bg-dark-700/50'}`}>
                  {tlIcon[entry.type]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-white">{entry.title}</p>
                  <p className="text-[11px] text-dark-400 line-clamp-1">{entry.description}</p>
                  <div className="flex items-center gap-2 mt-1 text-[10px] text-dark-500">
                    <span>{entry.user}</span>
                    {entry.caseRef && <span className="mono text-primary-500/60">{entry.caseRef}</span>}
                    <span className="ml-auto">{timeAgo(entry.timestamp)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Chain Volume */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold text-white mb-4">Token Volume Distribution</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chainDistribution}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1a1f36" />
            <XAxis dataKey="chain" tick={{ fill: '#78819a', fontSize: 11 }} axisLine={false} />
            <YAxis tick={{ fill: '#78819a', fontSize: 11 }} axisLine={false} />
            <Tooltip contentStyle={{ backgroundColor: '#1a1f36', border: '1px solid #2a3253', borderRadius: 8, fontSize: 12, color: '#fff' }} />
            <Bar dataKey="txns" fill="#00d4ff" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
