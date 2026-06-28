import React, { useState } from 'react';
import { mockAuditLogs } from '../data/mockData';
import { ClipboardList, Shield, Filter, Search, Calendar, FileCheck, RefreshCw } from 'lucide-react';
import { formatDate } from '../utils/helpers';

export const AuditPage: React.FC = () => {
  const [logs, setLogs] = useState(mockAuditLogs);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const filteredLogs = logs.filter((log) => {
    const operator = log.username || log.userName || '';
    const matchesSearch = 
      operator.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || log.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  const getStatusStyle = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
      case 'success':
        return 'bg-accent-green/10 text-accent-green border-accent-green/20';
      case 'warning':
        return 'bg-accent-gold/10 text-accent-gold border-accent-gold/20';
      case 'failure':
      case 'denied':
        return 'bg-accent-red/10 text-accent-red border-accent-red/20';
      default:
        return 'bg-dark-700/30 text-dark-300 border-dark-700/50';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Immutable Platform Audit Trail</h2>
          <p className="text-xs text-dark-400">Cryptographically logged record of all system queries, evidence uploads, and access authorizations</p>
        </div>
        
        <div className="flex items-center gap-2 text-xs text-dark-400 font-medium">
          <Shield size={14} className="text-accent-green animate-pulse" />
          NIST SP 800-53 compliant audit persistence active
        </div>
      </div>

      {/* Controls */}
      <div className="glass-card p-4 flex items-center justify-between flex-wrap gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
          <input
            type="text"
            placeholder="Search audit actions, operators..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-9 py-1.5 text-xs"
          />
        </div>

        {/* Filter */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter size={12} className="text-dark-400" />
            <span className="text-xs text-dark-300">Operator Role:</span>
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="input-field py-1.5 px-3 text-xs w-44 bg-dark-900 border-dark-700/50"
          >
            <option value="all">-- All Roles --</option>
            <option value="Compliance Officer">Compliance Officer</option>
            <option value="Lead Physicist">Lead Physicist</option>
            <option value="Speculative Theorist">Speculative Theorist</option>
            <option value="investigator">Investigator</option>
            <option value="supervisor">Supervisor</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-dark-800/40 border-b border-dark-700/40 text-dark-400 font-semibold uppercase tracking-wider">
                <th className="p-4">Timestamp</th>
                <th className="p-4">Action ID</th>
                <th className="p-4">Operator</th>
                <th className="p-4">Role / Department</th>
                <th className="p-4">Action Summary</th>
                <th className="p-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-800/50">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-dark-800/10 transition-colors">
                  <td className="p-4 text-dark-300 whitespace-nowrap">
                    {formatDate(log.timestamp || log.createdAt || '')}
                  </td>
                  <td className="p-4 text-primary-400 font-semibold mono whitespace-nowrap">
                    {log.id}
                  </td>
                  <td className="p-4 font-medium text-white whitespace-nowrap">
                    {log.username || log.userName || ''}
                  </td>
                  <td className="p-4 text-dark-400 whitespace-nowrap">
                    {log.role || 'operator'}
                  </td>
                  <td className="p-4 text-dark-100 max-w-md truncate">
                    {log.action}
                  </td>
                  <td className="p-4 text-center whitespace-nowrap">
                    <span className={`px-2 py-0.5 border rounded-full text-[10px] font-bold ${getStatusStyle(log.status || 'approved')}`}>
                      {log.status || 'Approved'}
                    </span>
                  </td>
                </tr>
              ))}

              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-dark-500 italic">
                    No matching audit records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
