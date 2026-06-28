import React, { useState, useEffect } from 'react';
import { useBlockchainStore, useNavStore } from '../stores';
import { Search, Wallet, ArrowUpRight, ArrowDownRight, ExternalLink, AlertTriangle, TrendingUp, Activity, Copy, Eye, Shield, Cpu, ShieldCheck, X, FileText, CheckCircle2 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { mockWalletProfile, mockTransactions } from '../data/mockData';
import { formatAddress, formatETH, formatUSD, formatDate, getRiskColor, getRiskBg, timeAgo, detectBlockchainFromAddress } from '../utils/helpers';

const txVolumeData = [
  { month: 'Jan', inflow: 1200, outflow: 980 },
  { month: 'Feb', inflow: 1800, outflow: 1650 },
  { month: 'Mar', inflow: 2100, outflow: 1900 },
  { month: 'Apr', inflow: 1500, outflow: 2200 },
  { month: 'May', inflow: 3200, outflow: 2800 },
  { month: 'Jun', inflow: 2800, outflow: 2400 },
];

export const BlockchainPage: React.FC = () => {
  const { searchAddress, setSearchAddress } = useBlockchainStore();
  const { setPage } = useNavStore();

  const [address, setAddress] = useState('0x742d35Cc6634C0532925a3b844Bc9e7595f2bD28');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [wallet, setWallet] = useState(mockWalletProfile);
  const [showProfile, setShowProfile] = useState(true);
  const [copied, setCopied] = useState(false);

  // Transaction Dedicated Panel state
  const [selectedTx, setSelectedTx] = useState<any | null>(null);

  // Sync address input with store searchAddress
  useEffect(() => {
    if (searchAddress) {
      setAddress(searchAddress);
      // Automatically trigger analysis
      setWallet({
        ...mockWalletProfile,
        address: searchAddress
      });
      setShowProfile(true);
    }
  }, [searchAddress]);

  const handleAnalyze = async () => {
    if (!address) return;
    setIsAnalyzing(true);
    await new Promise((r) => setTimeout(r, 1200));
    setWallet({
      ...mockWalletProfile,
      address: address
    });
    setSearchAddress(address);
    setShowProfile(true);
    setIsAnalyzing(false);
  };

  const copyAddr = () => {
    navigator.clipboard.writeText(wallet.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Search Section */}
      <div className="glass-card p-6 border-dark-700/50">
        <div className="flex items-center gap-3 mb-4">
          <Search size={20} className="text-primary-400" />
          <div>
            <h2 className="text-lg font-semibold text-white">Wallet & Transaction Intelligence</h2>
            <p className="text-xs text-dark-400">Search on-chain wallets or hashes to analyze behavior patterns and trace hop paths</p>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Enter public wallet address (e.g. 0x742d...)"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="input-field py-2 text-xs"
            />
          </div>
          <button 
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="btn-primary py-2 px-6 text-xs font-semibold flex items-center gap-2"
          >
            {isAnalyzing ? 'Analyzing Node...' : 'Analyze Address'}
          </button>
        </div>
      </div>

      {showProfile && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main profile statistics */}
          <div className="lg:col-span-2 space-y-6">
            {/* Overview Card */}
            <div className="glass-card p-5 border-dark-700/50">
              {(() => {
                const detected = detectBlockchainFromAddress(wallet.address);
                return (
                  <>
                    <div className="flex items-center justify-between mb-3 border-b border-dark-800 pb-3">
                      <div className="flex items-center gap-2">
                        <Wallet size={18} className="text-primary-400" />
                        <h3 className="text-xs font-bold text-dark-300 uppercase tracking-wider">Wallet Metadata Identity</h3>
                        <span className="px-2 py-0.5 rounded text-[9px] bg-primary-500/10 border border-primary-500/20 text-primary-400 font-mono font-bold">
                          {detected.coin}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {wallet.tags.map((tag) => (
                          <span key={tag} className="badge-red text-[9px] uppercase font-bold">{tag}</span>
                        ))}
                        <span className="px-2 py-0.5 rounded text-[9px] bg-accent-green/10 border border-accent-green/20 text-accent-green font-bold">
                          Publicly Verified
                        </span>
                      </div>
                    </div>

                    {/* Identity details */}
                    <div className="flex items-start gap-4 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <code className="text-sm font-semibold text-white font-mono block select-all truncate">{wallet.address}</code>
                        <div className="flex items-center gap-2.5 mt-2 text-[10px] text-dark-400">
                          <span>Label: <span className="text-white font-medium">GainChain Scam Target</span></span>
                          <span>•</span>
                          <span>Alias: <span className="text-white font-medium">Suspect Primary Node #1</span></span>
                          <span>•</span>
                          <span>Chain: <span className="text-white font-medium">{detected.displayName}</span></span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button 
                          onClick={copyAddr}
                          className="p-1.5 rounded-lg hover:bg-dark-700/50 text-dark-400 hover:text-white transition-colors"
                          title="Copy Address"
                        >
                          <Copy size={14} />
                        </button>
                      </div>
                    </div>
                  </>
                );
              })()}

              {/* Behavior indicators */}
              <div className="mt-4 pt-3 border-t border-dark-850 space-y-2">
                <span className="text-[10px] font-bold text-dark-400 uppercase tracking-wider block">On-Chain Behavior Observations</span>
                <div className="flex flex-wrap gap-2">
                  <span className="px-2.5 py-0.5 rounded bg-dark-800 border border-dark-700 text-[10px] text-dark-300">
                    High Transaction Frequency (47 txs/day)
                  </span>
                  <span className="px-2.5 py-0.5 rounded bg-dark-800 border border-dark-700 text-[10px] text-dark-300">
                    Exchange Inflows (Huobi deposit matched)
                  </span>
                  <span className="px-2.5 py-0.5 rounded bg-dark-800 border border-dark-700 text-[10px] text-dark-300">
                    Bridge Intermediary interaction
                  </span>
                </div>
              </div>
            </div>

            {/* Volume chart */}
            <div className="glass-card p-5 border-dark-700/50">
              <h3 className="text-xs font-bold text-dark-300 uppercase tracking-wider mb-4">Historical Flow Volume (ETH)</h3>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={txVolumeData}>
                  <defs>
                    <linearGradient id="inflow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00ff88" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#00ff88" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="outflow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ff3366" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#ff3366" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1a1f36" />
                  <XAxis dataKey="month" tick={{ fill: '#78819a', fontSize: 10 }} axisLine={false} />
                  <YAxis tick={{ fill: '#78819a', fontSize: 10 }} axisLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#161b30', border: '1px solid #2a3253', borderRadius: 8, fontSize: 11, color: '#fff' }} />
                  <Area type="monotone" dataKey="inflow" stroke="#00ff88" fillOpacity={1} fill="url(#inflow)" strokeWidth={1.5} name="Inflow (ETH)" />
                  <Area type="monotone" dataKey="outflow" stroke="#ff3366" fillOpacity={1} fill="url(#outflow)" strokeWidth={1.5} name="Outflow (ETH)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Transaction History Table */}
            <div className="glass-card p-5 border-dark-700/50">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold text-dark-300 uppercase tracking-wider">Transaction Activity History</h3>
                <span className="text-[10px] text-dark-400">{mockTransactions.length} indexed transactions</span>
              </div>
              <div className="overflow-x-auto">
                <table className="data-table text-xs">
                  <thead>
                    <tr className="bg-dark-850">
                      <th>TX Hash</th>
                      <th>Direction</th>
                      <th>From / To</th>
                      <th>Value</th>
                      <th>Time</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockTransactions.map((tx) => {
                      const isOut = tx.from.toLowerCase() === wallet.address.toLowerCase();
                      return (
                        <tr 
                          key={tx.hash} 
                          onClick={() => setSelectedTx(tx)}
                          className="hover:bg-dark-800/40 transition-colors cursor-pointer"
                        >
                          <td>
                            <code className="text-xs font-bold text-primary-400 font-mono">{formatAddress(tx.hash, 8)}</code>
                          </td>
                          <td>
                            <span className={`flex items-center gap-1 font-semibold ${isOut ? 'text-accent-red' : 'text-accent-green'}`}>
                              {isOut ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                              {isOut ? 'OUT' : 'IN'}
                            </span>
                          </td>
                          <td>
                            <code className="text-xs font-mono text-dark-300">
                              {isOut ? formatAddress(tx.to, 6) : formatAddress(tx.from, 6)}
                            </code>
                          </td>
                          <td>
                            <div>
                              <span className="font-semibold text-white">{formatETH(tx.value)}</span>
                              <span className="text-[9px] text-dark-500 block">{formatUSD(tx.valueUSD)}</span>
                            </div>
                          </td>
                          <td><span className="text-dark-300">{timeAgo(tx.timestamp)}</span></td>
                          <td>
                            <span className={tx.status === 'success' ? 'badge-green' : 'badge-red'}>
                              {tx.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Panel: Risk Summary & Target Overview */}
          <div className="lg:col-span-1 space-y-6">
            {/* Risk Assessment Card */}
            <div className="glass-card p-5 border-dark-700/50 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-dark-300 uppercase tracking-wider">Risk Profile Evaluation</h3>
                <span className="text-[9px] text-accent-red bg-accent-red/10 border border-accent-red/20 px-2 py-0.5 rounded font-extrabold">
                  CRITICAL LEVEL
                </span>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-4xl font-black text-accent-red font-mono">
                  {wallet.riskScore}%
                </div>
                <div>
                  <span className="text-[9px] text-dark-400 font-bold block uppercase">Confidence Index</span>
                  <span className="text-xs font-bold text-white">92% (High Confidence)</span>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-dark-800">
                <span className="text-[10px] font-bold text-dark-400 uppercase tracking-wider block">Risk Factors Checklist</span>
                {wallet.riskIndicators.map((indicator, idx) => (
                  <div key={idx} className="flex gap-2 p-2 bg-dark-800/40 border border-dark-700/30 rounded text-[11px]">
                    <AlertTriangle size={12} className="text-accent-red flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-white font-medium">{indicator.description}</p>
                      <span className="text-[9px] text-dark-500 font-mono block mt-0.5">Score Impact: +{indicator.score}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Asset Distribution */}
            <div className="glass-card p-5 border-dark-700/50 space-y-3">
              <h3 className="text-xs font-bold text-dark-300 uppercase tracking-wider">Asset Distribution</h3>
              <div className="space-y-2.5 text-xs">
                <div className="space-y-1">
                  <div className="flex justify-between font-semibold">
                    <span>Ethereum (ETH)</span>
                    <span className="font-mono text-white">4,215.42 ETH</span>
                  </div>
                  <div className="h-1.5 bg-dark-850 rounded overflow-hidden">
                    <div className="h-full bg-primary-500" style={{ width: '85%' }} />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between font-semibold">
                    <span>Tether (USDT)</span>
                    <span className="font-mono text-white">124,500.00 USDT</span>
                  </div>
                  <div className="h-1.5 bg-dark-850 rounded overflow-hidden">
                    <div className="h-full bg-accent-green" style={{ width: '12%' }} />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between font-semibold">
                    <span>USD Coin (USDC)</span>
                    <span className="font-mono text-white">34,200.00 USDC</span>
                  </div>
                  <div className="h-1.5 bg-dark-850 rounded overflow-hidden">
                    <div className="h-full bg-accent-purple" style={{ width: '3%' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Transaction Details Inspector Dialog */}
      {selectedTx && (
        <div className="fixed inset-y-0 right-0 w-[500px] bg-dark-950 border-l border-dark-750/70 shadow-2xl z-50 p-6 flex flex-col justify-between animate-slide-in">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-dark-700/50 pb-4 mb-4">
            <div className="flex items-center gap-2">
              <FileText size={16} className="text-primary-400" />
              <h3 className="text-sm font-bold text-white">Transaction Inspector</h3>
            </div>
            <button 
              onClick={() => setSelectedTx(null)}
              className="p-1 rounded text-dark-400 hover:text-white hover:bg-dark-800 transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Details Scroll Content */}
          <div className="flex-1 overflow-y-auto space-y-5 pr-1 text-xs">
            {/* Overview parameters */}
            <div className="bg-dark-900 border border-dark-800 p-4 rounded-xl space-y-3 font-mono">
              <div className="flex justify-between border-b border-dark-800/60 pb-1.5">
                <span className="text-dark-500 uppercase text-[10px]">TX Hash</span>
                <span className="text-primary-400 font-semibold truncate max-w-[240px] select-all">{selectedTx.hash}</span>
              </div>
              <div className="flex justify-between border-b border-b-dark-800/60 pb-1.5">
                <span className="text-dark-500 uppercase text-[10px]">Timestamp</span>
                <span className="text-white">{formatDate(selectedTx.timestamp)}</span>
              </div>
              <div className="flex justify-between border-b border-b-dark-800/60 pb-1.5">
                <span className="text-dark-500 uppercase text-[10px]">Block Height</span>
                <span className="text-white">19234567</span>
              </div>
              <div className="flex justify-between border-b border-b-dark-800/60 pb-1.5">
                <span className="text-dark-500 uppercase text-[10px]">Classification</span>
                <span className="px-2 py-0.5 rounded bg-accent-purple/10 border border-accent-purple/20 text-accent-purple font-extrabold text-[9px] uppercase">
                  Token Transfer
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-dark-500 uppercase text-[10px]">Gas Price</span>
                <span className="text-white">23.4 Gwei</span>
              </div>
            </div>

            {/* Interactive Hop Flow visual diagram */}
            <div className="bg-dark-900 border border-dark-800 p-4 rounded-xl space-y-3">
              <span className="text-[10px] font-bold text-dark-400 uppercase tracking-wider block">Transaction Hop Flow Tracing</span>
              
              <div className="space-y-4 pt-1 font-mono text-[11px]">
                {/* Node 1 */}
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-accent-green flex items-center justify-center text-[9px] font-extrabold text-black">S</div>
                  <span className="text-dark-300 truncate max-w-[150px]">{selectedTx.from}</span>
                  <span className="text-dark-500">(Source Suspect)</span>
                </div>
                
                {/* Connector */}
                <div className="h-6 border-l border-dashed border-dark-700 ml-2 relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[9px] text-dark-500 font-extrabold">Hop 1 ({formatETH(selectedTx.value)})</span>
                </div>

                {/* Node 2 */}
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-accent-gold flex items-center justify-center text-[9px] font-extrabold text-black">I</div>
                  <span className="text-dark-300 truncate max-w-[150px]">{selectedTx.to}</span>
                  <span className="text-dark-500">(Intermediary Layer)</span>
                </div>

                {/* Connector */}
                <div className="h-6 border-l border-dashed border-dark-700 ml-2 relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[9px] text-dark-500 font-extrabold">Hop 2 (DEX Swap)</span>
                </div>

                {/* Node 3 */}
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-accent-red flex items-center justify-center text-[9px] font-extrabold text-black">D</div>
                  <span className="text-white font-semibold">Tornado.Cash Mixer</span>
                  <span className="text-accent-red">(Sanctioned Pool)</span>
                </div>
              </div>
            </div>

            {/* Smart Contract Interaction Logs */}
            <div className="bg-dark-900 border border-dark-800 p-4 rounded-xl space-y-3">
              <span className="text-[10px] font-bold text-dark-400 uppercase tracking-wider block">Decoded Smart Contract Event Logs</span>
              <div className="bg-dark-950 p-3 rounded border border-dark-850 font-mono text-[10px] text-dark-300 space-y-1.5">
                <span className="text-primary-400 block font-bold">Event transfer(address from, address to, uint256 value)</span>
                <p>• from: <span className="text-white">{selectedTx.from}</span></p>
                <p>• to: <span className="text-white">{selectedTx.to}</span></p>
                <p>• value: <span className="text-accent-green font-bold">{selectedTx.value} ETH</span></p>
              </div>
            </div>

            {/* Facts vs Hypotheses tags */}
            <div className="space-y-2">
              <div className="p-3 bg-accent-green/5 border border-accent-green/20 rounded-lg space-y-1 text-[11px]">
                <span className="text-[9px] text-accent-green font-bold uppercase tracking-wider block">Verified Facts</span>
                <p className="text-dark-200">Ledger confirms successful transfer block transaction confirmed with {selectedTx.status} status.</p>
              </div>

              <div className="p-3 bg-accent-gold/5 border border-accent-gold/20 rounded-lg space-y-1 text-[11px]">
                <span className="text-[9px] text-accent-gold font-bold uppercase tracking-wider block">Investigative Hypothesis [Confidence: High]</span>
                <p className="text-dark-200">Fund flow matches Lazarus layering exploit profile designed to seed mixers with clean funds.</p>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-dark-750/70 flex gap-3">
            <button 
              onClick={() => setSelectedTx(null)}
              className="btn-ghost flex-1 py-2 text-xs"
            >
              Close Inspector
            </button>
            <button 
              onClick={() => { setPage('graph'); setSelectedTx(null); }}
              className="btn-primary flex-1 py-2 text-xs font-semibold flex items-center justify-center gap-1.5"
            >
              <Activity size={14} /> Open in Graph
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
