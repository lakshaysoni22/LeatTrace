import React, { useState, useEffect } from 'react';
import { useBlockchainStore, useNavStore } from '../stores';
import { Search, Wallet, ArrowUpRight, ArrowDownRight, ExternalLink, AlertTriangle, TrendingUp, Activity, Copy, Eye, Shield, Cpu, ShieldCheck, X, FileText, CheckCircle2, RefreshCw, Key, HelpCircle } from 'lucide-react';
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

  // Tabs navigation
  const [activeSubTab, setActiveSubTab] = useState<'profile' | 'clustering' | 'cross-chain' | 'decoder'>('profile');

  // Transaction Dedicated Panel state
  const [selectedTx, setSelectedTx] = useState<any | null>(null);

  // Token Event Log Decoder State
  const [decoderTopics, setDecoderTopics] = useState<string[]>([
    '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
    '0x00000000000000000000000071c20e241775e5332f143715df332f143789a71b',
    '0x000000000000000000000000ab5801a7d398351b8be11c439e05c5b3259aec9b'
  ]);
  const [decoderData, setDecoderData] = useState('0x0000000000000000000000000000000000000000000000000de0b6b3a7640000');
  const [decodedResult, setDecodedResult] = useState<any | null>(null);
  const [decodingStatus, setDecodingStatus] = useState<'idle' | 'decoding' | 'error'>('idle');

  // Address Clustering details
  const [clusterData, setClusterData] = useState<any>({
    confidence: 'High',
    type: 'Multi-Input Heuristics & Common Co-Deposit Tags',
    size: 4,
    wallets: [
      '0x71c20e241775e5332f143715df332f143789a71b',
      '0xab5801a7d398351b8be11c439e05c5b3259aec9b',
      '0x3f5ce5fbfe3e9af3971dd833d26ba9b5c936f0be',
      '0x53d2b273e51111111a4cf13e8f8f8f8f8f8f8f8f'
    ],
    exchanges: ['Binance (Deposit Tag: 90218)', 'Kraken']
  });

  // Mixer exposure details
  const [mixerData, setMixerData] = useState<any>({
    exposurePercentage: 85.5,
    volumeUSD: 4971750.00,
    rating: 'Critical',
    involvedPools: ['Tornado.Cash: Proxy Router', 'Tornado.Cash: 10 ETH Pool'],
    interactions: [
      { hash: '0xfe3b5928d11c439e05c5b3259aec9be5fbfe3e9af3971dd833d26ba9b5c936f', time: '2026-06-20T10:00:00Z', action: 'DEPOSIT', amount: 10.0, pool: 'Tornado.Cash 10 ETH' },
      { hash: '0x53d2b273e5a3f5ce5fbfe3e9af3971dd833d26ba9b5c936f0be1a4cf13e8f8f', time: '2026-06-18T14:32:10Z', action: 'WITHDRAWAL', amount: 10.0, pool: 'Tornado.Cash 10 ETH' },
      { hash: '0xfa7b9c0d1e2f3a4b5b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b568a8e4e9b', time: '2026-06-15T09:12:05Z', action: 'DEPOSIT', amount: 1.0, pool: 'Tornado.Cash 1.0 ETH' },
      { hash: '0xbc1d3a4b5b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b568a8e4e9bcda9d9e4', time: '2026-06-12T11:00:30Z', action: 'WITHDRAWAL', amount: 1.0, pool: 'Tornado.Cash 1.0 ETH' }
    ]
  });

  // Cross-Chain Bridges Trace details
  const [crossChainHops, setCrossChainHops] = useState<any[]>([
    {
      step: 1,
      chain: 'Ethereum Mainnet',
      action: 'Lock Assets inside Bridge Contract',
      hash: '0xfe3b5928d11c439e05c5b3259aec9be5fbfe3e9af3971dd833d26ba9b5c936f',
      amount: 25.5,
      token: 'ETH',
      contract: 'Hop Protocol: Bridge Router',
      time: '2026-06-20T10:00:00Z'
    },
    {
      step: 2,
      chain: 'Binance Smart Chain (BSC)',
      action: 'Mint / Release Synthetic Assets',
      hash: '0x53d2b273e5a3f5ce5fbfe3e9af3971dd833d26ba9b5c936f0be1a4cf13e8f8f',
      amount: 25.48,
      token: 'WETH',
      contract: 'Hop Protocol: BSC Bridge Release',
      time: '2026-06-20T10:04:12Z'
    },
    {
      step: 3,
      chain: 'Binance Smart Chain (BSC)',
      action: 'Execute Swapping inside PancakeSwap Pool',
      hash: '0xfa7b9c0d1e2f3a4b5b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b568a8e4e9b',
      amount: 89200.0,
      token: 'USDT',
      contract: 'PancakeSwap: WETH/USDT Pool',
      time: '2026-06-20T10:12:30Z'
    },
    {
      step: 4,
      chain: 'Polygon PoS',
      action: 'Transfer Cross-Chain Swap release',
      hash: '0xbc1d3a4b5b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b568a8e4e9bcda9d9e4',
      amount: 89185.0,
      token: 'USDT',
      contract: 'AnySwap: Polygon Bridge Inbound',
      time: '2026-06-20T10:18:45Z'
    }
  ]);

  // Sync address input with store searchAddress
  useEffect(() => {
    if (searchAddress) {
      setAddress(searchAddress);
      
      // Auto scoring mock recalculations on search
      const isSuspect = searchAddress.toLowerCase().startsWith('0x71c') || searchAddress === '1LbcPeel5s9zARansom993vX78cDf';
      setWallet({
        ...mockWalletProfile,
        address: searchAddress,
        riskScore: isSuspect ? 89 : Math.abs(hashString(searchAddress)) % 60 + 10
      });
      
      // Update custom clusters & mixers mock data dynamically
      setClusterData({
        confidence: isSuspect ? 'High' : 'Medium',
        type: isSuspect ? 'Multi-Input Heuristics & Common Co-Deposit Tags' : 'Co-Spending Associated Transactions',
        size: isSuspect ? 4 : 3,
        wallets: isSuspect ? [
          '0x71c20e241775e5332f143715df332f143789a71b',
          '0xab5801a7d398351b8be11c439e05c5b3259aec9b',
          '0x3f5ce5fbfe3e9af3971dd833d26ba9b5c936f0be',
          '0x53d2b273e51111111a4cf13e8f8f8f8f8f8f8f8f'
        ] : [
          searchAddress,
          searchAddress.substring(0, 8) + '8be11c439e05c5b3259aec9b',
          searchAddress.substring(0, 8) + 'e9af3971dd833d26ba9b5c936'
        ],
        exchanges: isSuspect ? ['Binance (Deposit Tag: 90218)', 'Kraken'] : ['Unknown']
      });

      setMixerData({
        exposurePercentage: isSuspect ? 85.5 : Math.abs(hashString(searchAddress)) % 25,
        volumeUSD: isSuspect ? 4971750.00 : (Math.abs(hashString(searchAddress)) % 5) * 12500,
        rating: isSuspect ? 'Critical' : 'Low',
        involvedPools: ['Tornado.Cash: Proxy Router', 'Tornado.Cash: 1.0 ETH Pool'],
        interactions: isSuspect ? [
          { hash: '0xfe3b5928d11c439e05c5b3259aec9be5fbfe3e9af3971dd833d26ba9b5c936f', time: '2026-06-20T10:00:00Z', action: 'DEPOSIT', amount: 10.0, pool: 'Tornado.Cash 10 ETH' },
          { hash: '0x53d2b273e5a3f5ce5fbfe3e9af3971dd833d26ba9b5c936f0be1a4cf13e8f8f', time: '2026-06-18T14:32:10Z', action: 'WITHDRAWAL', amount: 10.0, pool: 'Tornado.Cash 10 ETH' }
        ] : []
      });

      setShowProfile(true);
    }
  }, [searchAddress]);

  const hashString = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return hash;
  };

  const handleAnalyze = async () => {
    if (!address) return;
    setIsAnalyzing(true);
    await new Promise((r) => setTimeout(r, 1000));
    setSearchAddress(address);
    setIsAnalyzing(false);
  };

  const handleDecodeEventLog = async () => {
    setDecodingStatus('decoding');
    setDecodedResult(null);
    await new Promise((r) => setTimeout(r, 1200));

    if (decoderTopics[0] !== '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef') {
      setDecodingStatus('error');
      return;
    }

    try {
      const fromAddr = '0x' + decoderTopics[1].substring(26);
      const toAddr = '0x' + decoderTopics[2].substring(26);
      const valHex = decoderData.startsWith('0x') ? decoderData : '0x' + decoderData;
      const rawVal = BigInt(valHex);
      const scaledVal = Number(rawVal) / 10**18; // Scale assuming 18 decimals

      setDecodedResult({
        type: 'ERC-20 Standard Transfer',
        signature: 'Transfer(address,address,uint256)',
        from: fromAddr,
        to: toAddr,
        value: scaledVal,
        symbol: 'WETH',
        decimals: 18,
        status: 'SUCCESS'
      });
      setDecodingStatus('idle');
    } catch (e) {
      setDecodingStatus('error');
    }
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
            <p className="text-xs text-dark-400">Search on-chain wallets or hashes to analyze behavior patterns, wallet clusters, and mixer paths</p>
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

      {/* Tabs */}
      {showProfile && (
        <div className="flex border-b border-dark-700/50 bg-dark-800/10 rounded-t-lg overflow-x-auto">
          <button
            onClick={() => setActiveSubTab('profile')}
            className={`px-5 py-3 border-b-2 text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 ${
              activeSubTab === 'profile' ? 'border-primary-500 text-white bg-dark-900/30' : 'border-transparent text-dark-400 hover:text-white'
            }`}
          >
            <Wallet size={14} /> Wallet Profile & Txs
          </button>
          <button
            onClick={() => setActiveSubTab('clustering')}
            className={`px-5 py-3 border-b-2 text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 ${
              activeSubTab === 'clustering' ? 'border-primary-500 text-white bg-dark-900/30' : 'border-transparent text-dark-400 hover:text-white'
            }`}
          >
            <Cpu size={14} /> Address Clustering & Mixers
          </button>
          <button
            onClick={() => setActiveSubTab('cross-chain')}
            className={`px-5 py-3 border-b-2 text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 ${
              activeSubTab === 'cross-chain' ? 'border-primary-500 text-white bg-dark-900/30' : 'border-transparent text-dark-400 hover:text-white'
            }`}
          >
            <TrendingUp size={14} /> Cross-Chain Bridge Trace
          </button>
          <button
            onClick={() => setActiveSubTab('decoder')}
            className={`px-5 py-3 border-b-2 text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 ${
              activeSubTab === 'decoder' ? 'border-primary-500 text-white bg-dark-900/30' : 'border-transparent text-dark-400 hover:text-white'
            }`}
          >
            <FileText size={14} /> Token Log Decoder
          </button>
        </div>
      )}

      {showProfile && activeSubTab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main profile statistics */}
          <div className="lg:col-span-2 space-y-6">
            {/* Overview Card */}
            <div className="glass-card p-5 border-dark-700/50">
              {(() => {
                const detected = detectBlockchainFromAddress(wallet.address);
                return (
                  <div className="flex items-center justify-between border-b border-dark-800 pb-4 mb-4 flex-wrap gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500/20 to-cyber-teal/20 border border-primary-500/30 flex items-center justify-center text-primary-400">
                        <Wallet size={20} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-xs font-bold text-white uppercase tracking-wider">{wallet.label}</h3>
                          <span className="px-2 py-0.5 rounded bg-primary-500/10 border border-primary-500/20 text-[9px] font-bold text-primary-400 uppercase tracking-wide">
                            {detected.displayName}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1">
                          <code className="text-xs text-dark-300 font-mono select-all">{wallet.address}</code>
                          <button onClick={copyAddr} className="text-dark-400 hover:text-white p-0.5" title="Copy Address">
                            {copied ? <ShieldCheck size={13} className="text-accent-green" /> : <Copy size={13} />}
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-dark-400 block uppercase">Balance Portfolio</span>
                      <span className="text-base font-bold text-white">{formatETH(wallet.balance)}</span>
                    </div>
                  </div>
                );
              })()}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 bg-dark-900/50 border border-dark-800 rounded-lg">
                  <span className="text-[10px] text-dark-500 uppercase block mb-1">Total Transactions</span>
                  <span className="text-sm font-bold text-white font-mono">{wallet.totalTransactions}</span>
                </div>
                <div className="p-3 bg-dark-900/50 border border-dark-800 rounded-lg">
                  <span className="text-[10px] text-dark-500 uppercase block mb-1">Inflow Tx Volume</span>
                  <span className="text-sm font-bold text-accent-green font-mono">{wallet.totalVolumeIn.toFixed(1)} ETH</span>
                </div>
                <div className="p-3 bg-dark-900/50 border border-dark-800 rounded-lg">
                  <span className="text-[10px] text-dark-500 uppercase block mb-1">Outflow Tx Volume</span>
                  <span className="text-sm font-bold text-accent-red font-mono">{wallet.totalVolumeOut.toFixed(1)} ETH</span>
                </div>
                <div className="p-3 bg-dark-900/50 border border-dark-800 rounded-lg">
                  <span className="text-[10px] text-dark-500 uppercase block mb-1">Decentralization Level</span>
                  <span className="text-sm font-bold text-primary-400 font-mono">89%</span>
                </div>
              </div>
            </div>

            {/* Historical Volume Chart */}
            <div className="glass-card p-5 border-dark-700/50">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold text-dark-300 uppercase tracking-wider">Volume Distribution Timeline</h3>
                <span className="text-[10px] text-dark-500">Last 6 Months (ETH)</span>
              </div>
              <div className="h-48 text-xs">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={txVolumeData}>
                    <defs>
                      <linearGradient id="inflowGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="outflowGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#EF4444" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                    <XAxis dataKey="month" stroke="#737373" />
                    <YAxis stroke="#737373" />
                    <Tooltip contentStyle={{ backgroundColor: '#171717', border: '1px solid #262626', color: '#fff' }} />
                    <Area type="monotone" dataKey="inflow" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#inflowGrad)" name="Inflow" />
                    <Area type="monotone" dataKey="outflow" stroke="#EF4444" strokeWidth={2} fillOpacity={1} fill="url(#outflowGrad)" name="Outflow" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Transaction Ledger Table */}
            <div className="glass-card p-5 border-dark-700/50 space-y-4">
              <div className="flex items-center justify-between border-b border-dark-800 pb-3">
                <h3 className="text-xs font-bold text-dark-300 uppercase tracking-wider">Historical Transaction Ledger</h3>
                <span className="text-[10px] text-dark-400">Showing {mockTransactions.length} events</span>
              </div>

              <div className="overflow-x-auto text-xs">
                <table className="data-table">
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

          {/* Right Panel: Risk & Target Overview */}
          <div className="lg:col-span-1 space-y-6">
            {/* Risk Assessment Card */}
            <div className="glass-card p-5 border-dark-700/50 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-dark-300 uppercase tracking-wider">Risk Profile Evaluation</h3>
                <span className={`text-[9px] px-2 py-0.5 rounded font-extrabold ${wallet.riskScore >= 75 ? 'bg-accent-red/10 border border-accent-red/20 text-accent-red' : 'bg-accent-gold/10 border border-accent-gold/20 text-accent-gold'}`}>
                  {wallet.riskScore >= 75 ? 'CRITICAL LEVEL' : 'WARNING LEVEL'}
                </span>
              </div>

              <div className="flex items-center gap-4">
                <div className={`text-4xl font-black font-mono ${wallet.riskScore >= 75 ? 'text-accent-red' : 'text-accent-gold'}`}>
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

      {showProfile && activeSubTab === 'clustering' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left panel: Clustered Addresses Directory & Mixer timeline */}
          <div className="lg:col-span-2 space-y-6">
            {/* Clustered Directory Card */}
            <div className="glass-card p-5 border-dark-700/50 space-y-4">
              <div className="flex items-center justify-between border-b border-dark-800 pb-3">
                <div className="flex items-center gap-2">
                  <Cpu size={16} className="text-primary-400" />
                  <h3 className="text-sm font-bold text-white">Address Clustering Directory</h3>
                </div>
                <span className="text-[10px] text-dark-500 uppercase tracking-wider font-mono">Algorithm: {clusterData.type}</span>
              </div>

              <div className="p-3.5 bg-primary-500/5 border border-primary-500/20 rounded-lg text-xs space-y-1.5 text-dark-300">
                <p>Clustering groups associated wallets controlled by the same entity based on **co-spending transaction inputs** and **shared exchange deposit tags**.</p>
                <div className="flex items-center gap-4 text-[10px] font-bold text-primary-400 uppercase pt-1">
                  <span>Confidence Level: {clusterData.confidence}</span>
                  <span>Total Group Mapped: {clusterData.size} Addresses</span>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-[10px] font-bold text-dark-400 uppercase tracking-wider block">Grouped Cluster Address List</span>
                {clusterData.wallets.map((w: string, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-2.5 bg-dark-900/40 border border-dark-850 rounded hover:border-dark-750 text-xs">
                    <code className="text-white font-mono select-all">{w}</code>
                    <div className="flex items-center gap-2">
                      {w.toLowerCase() === address.toLowerCase() && (
                        <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-primary-500/10 border border-primary-500/20 text-primary-400 uppercase">Target</span>
                      )}
                      <button
                        onClick={() => {
                          setSearchAddress(w);
                          setActiveSubTab('profile');
                        }}
                        className="px-2 py-0.5 bg-dark-800 hover:bg-dark-750 text-[10px] font-bold text-white rounded transition-colors"
                      >
                        Inspect
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Mixer interaction history */}
            <div className="glass-card p-5 border-dark-700/50 space-y-4">
              <div className="flex items-center justify-between border-b border-dark-800 pb-3">
                <h3 className="text-xs font-bold text-dark-300 uppercase tracking-wider">Mixer Transaction logs (Tornado Cash)</h3>
                <span className="text-[10px] text-accent-red font-bold font-mono">Involvement Detected</span>
              </div>

              <div className="overflow-x-auto text-xs">
                {mixerData.interactions.length > 0 ? (
                  <table className="data-table">
                    <thead>
                      <tr className="bg-dark-850">
                        <th>Event Hash</th>
                        <th>Action</th>
                        <th>Value</th>
                        <th>Target Mixing Pool</th>
                        <th>Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mixerData.interactions.map((mix: any, idx: number) => (
                        <tr key={idx} className="hover:bg-dark-800/10">
                          <td><code className="text-[11px] font-mono text-primary-400">{formatAddress(mix.hash, 10)}</code></td>
                          <td>
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${mix.action === 'DEPOSIT' ? 'bg-accent-red/10 border border-accent-red/20 text-accent-red' : 'bg-accent-green/10 border border-accent-green/20 text-accent-green'}`}>
                              {mix.action}
                            </span>
                          </td>
                          <td className="font-bold text-white font-mono">{mix.amount} ETH</td>
                          <td className="text-dark-300">{mix.pool}</td>
                          <td className="text-dark-400">{formatDate(mix.time)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="p-8 text-center bg-dark-900/30 border border-dark-800 rounded-lg text-dark-400 space-y-1">
                    <ShieldCheck size={24} className="text-accent-green mx-auto" />
                    <p className="font-bold text-white text-xs">No Mixer Interactions Mapped</p>
                    <p className="text-[11px]">No direct/1-hop transfers leading to Tornado Cash mixing contracts found.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right panel: Exposure assessment */}
          <div className="lg:col-span-1 space-y-6">
            <div className="glass-card p-5 border-dark-700/50 space-y-4">
              <div className="flex items-center justify-between border-b border-dark-800 pb-3">
                <h3 className="text-xs font-bold text-dark-300 uppercase tracking-wider">Mixer Exposure Rating</h3>
                <span className="text-[9px] text-accent-red bg-accent-red/15 border border-accent-red/25 px-1.5 py-0.5 rounded font-extrabold uppercase font-mono">
                  {mixerData.rating}
                </span>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-4xl font-black text-accent-red font-mono">
                  {mixerData.exposurePercentage}%
                </div>
                <div>
                  <span className="text-[9px] text-dark-400 font-bold block uppercase">Direct Exposure</span>
                  <span className="text-xs font-bold text-white">Critical Risk Level</span>
                </div>
              </div>

              <div className="p-3 bg-dark-900 border border-dark-800 rounded-lg space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-dark-500">Mixed Volume In:</span>
                  <span className="font-bold text-white font-mono">{formatUSD(mixerData.volumeUSD)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-dark-500">Identified Pool Hits:</span>
                  <span className="font-bold text-white">{mixerData.interactions.length} txs</span>
                </div>
              </div>

              <div className="space-y-2 text-xs border-t border-dark-850 pt-3">
                <span className="text-[10px] font-bold text-dark-400 uppercase tracking-wider block">Involved Contracts</span>
                {mixerData.involvedPools.map((pool: string, idx: number) => (
                  <div key={idx} className="p-2 bg-dark-900 border border-dark-850 rounded flex items-center justify-between font-mono text-[10px] text-dark-300">
                    <span>{pool}</span>
                    <span className="text-[8px] text-accent-red font-bold uppercase tracking-wider bg-accent-red/10 px-1 rounded">Mixer Contract</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-card p-5 border-dark-700/50 space-y-3">
              <h3 className="text-xs font-bold text-dark-300 uppercase tracking-wider">Exchange deposit linkages</h3>
              <div className="space-y-2 text-xs">
                <p className="text-dark-400 leading-snug">The clustered grouping has deposited mixed funds to the following centralized exchange deposit tag wallets:</p>
                {clusterData.exchanges.map((ex: string, idx: number) => (
                  <div key={idx} className="p-2 bg-dark-900 border border-dark-850 rounded text-xs font-bold text-white">
                    {ex}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {showProfile && activeSubTab === 'cross-chain' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left panel: Timeline hops */}
          <div className="lg:col-span-2 space-y-6">
            <div className="glass-card p-5 border-dark-700/50 space-y-4">
              <div className="flex items-center justify-between border-b border-dark-800 pb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp size={16} className="text-primary-400" />
                  <h3 className="text-sm font-bold text-white">Cross-Chain Bridge hop timeline</h3>
                </div>
                <span className="text-[10px] text-dark-500 uppercase tracking-wider font-mono">Trace Hop count: {crossChainHops.length}</span>
              </div>

              <div className="space-y-4 max-h-[450px] overflow-y-auto pr-1">
                {crossChainHops.map((hop: any, idx: number) => (
                  <div key={idx} className="flex gap-4 text-xs relative">
                    {idx !== crossChainHops.length - 1 && (
                      <div className="absolute left-[11px] top-6 bottom-[-20px] w-0.5 bg-dark-800" />
                    )}
                    <div className="w-6 h-6 rounded-full bg-dark-950 border border-primary-500 flex items-center justify-center text-[10px] text-primary-400 font-bold shrink-0 mt-1">
                      {hop.step}
                    </div>
                    <div className="space-y-2 py-1 flex-1 bg-dark-900/40 border border-dark-850 p-3 rounded-lg hover:border-dark-750 transition-colors">
                      <div className="flex items-center justify-between flex-wrap gap-1">
                        <span className="font-bold text-white uppercase text-[10px] bg-dark-900 px-2 py-0.5 rounded border border-dark-800">
                          {hop.chain}
                        </span>
                        <span className="text-[9px] text-dark-500">{formatDate(hop.time)}</span>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[11px] text-dark-200 font-bold">{hop.action}</p>
                        <p className="text-[10px] text-dark-400 flex justify-between">
                          <span>Amount Transferred: <span className="font-bold text-primary-400">{hop.amount} {hop.token}</span></span>
                          <span>Bridge Router: <span className="text-white font-medium">{hop.contract}</span></span>
                        </p>
                      </div>
                      <div className="flex items-center gap-1 border-t border-dark-850/80 pt-1.5 text-[9px] text-dark-400">
                        <span className="font-mono">Txid:</span>
                        <code className="text-primary-300 font-mono select-all truncate max-w-[320px]">{hop.hash}</code>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right panel: Bridge Risk stats */}
          <div className="lg:col-span-1 space-y-6">
            <div className="glass-card p-5 border-dark-700/50 space-y-4">
              <div className="flex items-center justify-between border-b border-dark-800 pb-3">
                <h3 className="text-xs font-bold text-dark-300 uppercase tracking-wider">Cross-Chain complexity</h3>
                <span className="text-[9px] text-accent-red bg-accent-red/10 border border-accent-red/25 px-1.5 py-0.5 rounded font-extrabold uppercase font-mono">
                  High Risk
                </span>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-4xl font-black text-accent-red font-mono">
                  95/100
                </div>
                <div>
                  <span className="text-[9px] text-dark-400 font-bold block uppercase">Complexity Score</span>
                  <span className="text-xs font-bold text-white">Bridge Hopping detected</span>
                </div>
              </div>

              <p className="text-[11px] text-dark-400 leading-relaxed">
                The investigator notes bridging activity across multiple Layer-1 and Layer-2 blockchains. This is a common peeling and asset masking technique to bypass single-network scanners.
              </p>

              <div className="space-y-2 text-xs border-t border-dark-850 pt-3">
                <span className="text-[10px] font-bold text-dark-400 uppercase tracking-wider block">Target Bridge Networks Mapped</span>
                <div className="grid grid-cols-2 gap-2 text-center text-[10px] font-bold text-white">
                  <span className="p-2 bg-dark-900 rounded border border-dark-800">Ethereum</span>
                  <span className="p-2 bg-dark-900 rounded border border-dark-800">Polygon</span>
                  <span className="p-2 bg-dark-900 rounded border border-dark-800 col-span-2">Binance Smart Chain</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showProfile && activeSubTab === 'decoder' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left panel: Log input and decoded results */}
          <div className="lg:col-span-2 space-y-6">
            <div className="glass-card p-5 border-dark-700/50 space-y-4">
              <div className="flex items-center gap-2 border-b border-dark-800 pb-3">
                <FileText size={16} className="text-primary-400" />
                <h3 className="text-sm font-bold text-white">ERC-20/721 Event Log Decoder Tool</h3>
              </div>

              <div className="p-3 bg-dark-900/60 border border-dark-800 rounded-lg text-xs space-y-1 text-dark-300">
                <p>Paste the raw topics and data logs of any transaction receipt. The decoder parses the inputs according to the standard ERC-20 log signatures.</p>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-xs font-medium text-dark-300 mb-1.5">Topic 0 (Event Signature hash)</label>
                  <input
                    type="text"
                    value={decoderTopics[0]}
                    onChange={(e) => setDecoderTopics([e.target.value, decoderTopics[1], decoderTopics[2]])}
                    className="input-field font-mono font-bold text-primary-300"
                    placeholder="0xddf252ad..."
                  />
                  <span className="text-[9px] text-dark-500 mt-1 block">Standard ERC-20 Transfer topic hash: `0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef`</span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-dark-300 mb-1.5">Topic 1 (Sender Address Parameter)</label>
                    <input
                      type="text"
                      value={decoderTopics[1]}
                      onChange={(e) => setDecoderTopics([decoderTopics[0], e.target.value, decoderTopics[2]])}
                      className="input-field font-mono text-dark-300"
                      placeholder="0x000000000000000000000000..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-dark-300 mb-1.5">Topic 2 (Recipient Address Parameter)</label>
                    <input
                      type="text"
                      value={decoderTopics[2]}
                      onChange={(e) => setDecoderTopics([decoderTopics[0], decoderTopics[1], e.target.value])}
                      className="input-field font-mono text-dark-300"
                      placeholder="0x000000000000000000000000..."
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-dark-300 mb-1.5">Data Payload (Hexadecimal Value)</label>
                  <textarea
                    value={decoderData}
                    onChange={(e) => setDecoderData(e.target.value)}
                    className="w-full h-16 p-2 text-xs bg-dark-900 border border-dark-800 rounded-lg text-dark-300 font-mono focus:outline-none focus:border-primary-500"
                    placeholder="0x0000..."
                  />
                </div>

                <div className="flex justify-between items-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setDecoderTopics([
                        '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
                        '0x00000000000000000000000071c20e241775e5332f143715df332f143789a71b',
                        '0x000000000000000000000000ab5801a7d398351b8be11c439e05c5b3259aec9b'
                      ]);
                      setDecoderData('0x0000000000000000000000000000000000000000000000000de0b6b3a7640000');
                      setDecodedResult(null);
                    }}
                    className="text-xs text-dark-400 hover:text-white transition-colors"
                  >
                    Reset Demo Values
                  </button>
                  <button
                    type="button"
                    onClick={handleDecodeEventLog}
                    disabled={decodingStatus === 'decoding'}
                    className="btn-primary py-2 px-6 text-xs font-semibold flex items-center gap-2"
                  >
                    {decodingStatus === 'decoding' ? (
                      <RefreshCw size={14} className="animate-spin" />
                    ) : (
                      'Decode Event Log'
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Decoded results card */}
            {decodedResult && (
              <div className="glass-card p-5 border-accent-green/30 bg-accent-green/5 space-y-4 animate-slide-up">
                <div className="flex items-center gap-2 text-accent-green font-bold text-xs">
                  <CheckCircle2 size={16} />
                  <span>EVENT LOG DECODED SUCCESSFULLY (STATUS: {decodedResult.status})</span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                  <div className="space-y-1">
                    <span className="text-dark-500 text-[10px] block uppercase">Standard Log Type</span>
                    <span className="font-bold text-white font-sans">{decodedResult.type}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-dark-500 text-[10px] block uppercase">Event Signature</span>
                    <span className="font-bold text-white font-sans">{decodedResult.signature}</span>
                  </div>
                  <div className="space-y-1 col-span-2 border-t border-dark-800 pt-2">
                    <span className="text-dark-500 text-[10px] block uppercase">Sender Address (Decoded from Topic 1)</span>
                    <span className="font-bold text-primary-400 select-all">{decodedResult.from}</span>
                  </div>
                  <div className="space-y-1 col-span-2 border-t border-dark-800 pt-2">
                    <span className="text-dark-500 text-[10px] block uppercase">Recipient Address (Decoded from Topic 2)</span>
                    <span className="font-bold text-primary-400 select-all">{decodedResult.to}</span>
                  </div>
                  <div className="space-y-1 col-span-2 border-t border-dark-800 pt-2 flex justify-between items-center">
                    <div>
                      <span className="text-dark-500 text-[10px] block uppercase">Decoded Value / Transfer Amount</span>
                      <span className="text-sm font-bold text-accent-green font-mono">{decodedResult.value} {decodedResult.symbol}</span>
                    </div>
                    <span className="text-[10px] text-dark-500 font-bold bg-dark-900 border border-dark-850 px-2 py-0.5 rounded">Decimals: {decodedResult.decimals}</span>
                  </div>
                </div>
              </div>
            )}

            {decodingStatus === 'error' && (
              <div className="p-4 bg-accent-red/10 border border-accent-red/20 text-accent-red text-xs rounded-lg flex items-center gap-2">
                <AlertTriangle size={16} />
                <span>Failed to decode event log. Please verify Topic 0 is a standard Transfer signature.</span>
              </div>
            )}
          </div>

          {/* Right panel: Standard definitions */}
          <div className="lg:col-span-1 space-y-6">
            <div className="glass-card p-5 border-dark-700/50 space-y-3">
              <h3 className="text-xs font-bold text-dark-300 uppercase tracking-wider flex items-center gap-1.5">
                <HelpCircle size={14} /> EVM Log structure guide
              </h3>
              <div className="space-y-3 text-xs leading-relaxed text-dark-400">
                <p>EVM transaction receipts output log logs when smart contracts trigger events. Standard ERC-20/721 contracts define a `Transfer` event to announce token movements.</p>
                
                <div className="space-y-2 border-t border-dark-850 pt-2">
                  <div className="flex flex-col">
                    <span className="font-bold text-white text-[10px]">Topic 0 (Event Signature)</span>
                    <span className="text-[9px] font-mono mt-0.5 break-all">0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef</span>
                  </div>
                  <div className="flex flex-col border-t border-dark-850/60 pt-1.5">
                    <span className="font-bold text-white text-[10px]">Topic 1 (Sender)</span>
                    <span className="text-[9px] mt-0.5 leading-snug">The sender address padded with leading zeros to match 32-bytes size.</span>
                  </div>
                  <div className="flex flex-col border-t border-dark-850/60 pt-1.5">
                    <span className="font-bold text-white text-[10px]">Topic 2 (Recipient)</span>
                    <span className="text-[9px] mt-0.5 leading-snug">The recipient address padded with leading zeros.</span>
                  </div>
                  <div className="flex flex-col border-t border-dark-850/60 pt-1.5">
                    <span className="font-bold text-white text-[10px]">Data Payload</span>
                    <span className="text-[9px] mt-0.5 leading-snug">Contains unindexed parameters (e.g. transfer value amount in hexadecimal representation).</span>
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
              <div className="flex justify-between border-b border-dark-800/60 pb-1.5">
                <span className="text-dark-500 uppercase text-[10px]">Sender (From)</span>
                <span className="text-white truncate max-w-[240px] select-all">{selectedTx.from}</span>
              </div>
              <div className="flex justify-between border-b border-dark-800/60 pb-1.5">
                <span className="text-dark-500 uppercase text-[10px]">Recipient (To)</span>
                <span className="text-white truncate max-w-[240px] select-all">{selectedTx.to}</span>
              </div>
              <div className="flex justify-between border-b border-dark-800/60 pb-1.5">
                <span className="text-dark-500 uppercase text-[10px]">Block Number</span>
                <span className="text-white font-semibold">{selectedTx.blockNumber || '18492025'}</span>
              </div>
              <div className="flex justify-between border-b border-dark-800/60 pb-1.5">
                <span className="text-dark-500 uppercase text-[10px]">Gas Fee Used</span>
                <span className="text-white">{selectedTx.gasUsed || '0.0034 ETH'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dark-500 uppercase text-[10px]">Confirmation count</span>
                <span className="text-accent-green font-bold flex items-center gap-1">
                  <ShieldCheck size={12} /> {selectedTx.confirmations || '84'} Blocks
                </span>
              </div>
            </div>

            {/* Smart contract Event Decoded logs */}
            <div className="space-y-3">
              <span className="text-[10px] font-bold text-dark-400 uppercase tracking-wider block">Decoded Smart Contract Event Logs</span>
              <div className="p-3 bg-dark-900 border border-dark-800 rounded-lg space-y-3">
                <div className="flex justify-between border-b border-dark-800/60 pb-1.5 font-mono">
                  <span className="text-dark-500 text-[10px]">Topic 0 (Signature)</span>
                  <span className="text-white truncate max-w-[240px]">0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef</span>
                </div>
                <div className="flex justify-between border-b border-dark-800/60 pb-1.5 font-mono">
                  <span className="text-dark-500 text-[10px]">Decoded Event</span>
                  <span className="text-accent-green font-bold">Transfer(address,address,uint256)</span>
                </div>
                <div className="space-y-1">
                  <span className="text-dark-500 text-[10px] block">Decoded Parameters:</span>
                  <div className="p-2 bg-dark-950 rounded border border-dark-850 font-mono text-[10px] space-y-1.5 text-dark-300">
                    <p>➔ from: <code className="text-primary-300 select-all font-mono">{selectedTx.from}</code></p>
                    <p>➔ to: <code className="text-primary-300 select-all font-mono">{selectedTx.to}</code></p>
                    <p>➔ value: <code className="text-accent-green font-bold font-mono">{formatETH(selectedTx.value)}</code></p>
                  </div>
                </div>
              </div>
            </div>

            {/* ASCII flow visualization */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-dark-400 uppercase tracking-wider block">ASCII Transaction Hop Flow</span>
              <div className="p-4 bg-dark-900 border border-dark-800 rounded-lg font-mono text-[9px] text-primary-400 text-center leading-tight whitespace-pre">
                {`[Sender Wallet] --( ${selectedTx.value} ETH )--> [Target Lock Contract]\n         |\n         +--> [Hop-1 Mixer Proxy] --( Tornado.Cash )--> [Anonymous Release]\n         |\n         +--> [Hop-2 Intermediate Address] --( Bridge Swap )--> [Destination Chain]`}
              </div>
            </div>
          </div>

          {/* Action button */}
          <div className="border-t border-dark-700/50 pt-4 flex gap-3">
            <button 
              onClick={() => {
                setSearchAddress(selectedTx.to);
                setSelectedTx(null);
              }}
              className="flex-1 btn-ghost py-2 text-xs"
            >
              Trace Recipient
            </button>
            <button 
              onClick={() => {
                setSearchAddress(selectedTx.from);
                setSelectedTx(null);
              }}
              className="flex-1 btn-primary py-2 text-xs"
            >
              Trace Sender
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
