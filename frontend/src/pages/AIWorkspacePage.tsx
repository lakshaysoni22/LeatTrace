import React, { useState, useRef, useEffect } from 'react';
import { useInvestigationStore } from '../stores/investigation';
import { 
  MessageSquare, Send, Sparkles, Wallet, Shield, Activity, 
  Database, Globe, Clock, AlertTriangle, ArrowUpRight, ArrowDownRight,
  Key, Check, ExternalLink, X, Bot, AlertCircle, RefreshCw
} from 'lucide-react';
import { 
  askGemini, getGeminiApiKey, setCustomGeminiApiKey, getGeminiModel, getEngineDisplayName,
  InvestigationContext 
} from '../utils/gemini';

export const AIWorkspacePage: React.FC = () => {
  const { activeTargetAddress, summary, transactions, counterparties, riskScore, riskLevel, alerts, evidenceItems, investigationId } = useInvestigationStore();

  const [chatLog, setChatLog] = useState<Array<{ sender: 'user' | 'ai'; text: string; isError?: boolean }>>([]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [apiKey, setApiKey] = useState<string>(getGeminiApiKey());
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [modalKeyInput, setModalKeyInput] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const rawModel = getGeminiModel();
  const engineModelName = getEngineDisplayName(rawModel);
  const hasLiveKey = Boolean(apiKey && apiKey !== 'YOUR_GEMINI_API_KEY_HERE' && apiKey.trim() !== '');

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatLog]);

  // Sync API key on load
  useEffect(() => {
    setApiKey(getGeminiApiKey());
  }, []);

  // Initialize with investigation context
  useEffect(() => {
    if (summary && chatLog.length === 0) {
      setChatLog([{
        sender: 'ai',
        text: `### 🛡️ Co-Investigator Workspace Ready\n\n* **Active Target**: \`${activeTargetAddress.slice(0, 20)}…\`\n* **Case Reference**: **${investigationId}**\n* **Risk Profile**: **${riskScore}/100** (${riskLevel.toUpperCase()})\n* **Confirmed Balance**: ${(summary.confirmedBalance / 1e8).toFixed(4)} BTC\n* **Transactions**: ${summary.txCount.toLocaleString()}\n* **Counterparties**: ${counterparties.length}\n\n${hasLiveKey ? `🟢 **Live LEAT-Neural Engine Active** (\`${engineModelName}\`). Ask any question regarding transaction flow, mixer peeling, sanctions screening, forensic methodologies, or general intelligence.` : `🟡 **Rule Engine Running**. Set your AI Key in \`.env.local\` to activate the live LEATrace Neural Core.`}`,
      }]);
    }
  }, [summary, hasLiveKey, engineModelName]);

  const generateAIResponse = (question: string): string => {
    const q = question.toLowerCase();

    if (q.includes('risk') || q.includes('threat')) {
      const critCount = alerts.filter(a => a.severity === 'critical').length;
      const highCount = alerts.filter(a => a.severity === 'high').length;
      return `**Risk Assessment for ${activeTargetAddress.slice(0, 16)}…**\n\n- Risk Score: **${riskScore}/100** (${riskLevel.toUpperCase()})\n- Critical Alerts: ${critCount}\n- High Alerts: ${highCount}\n- Total Alerts: ${alerts.length}\n\n${riskScore >= 50 ? '⚠️ This wallet shows elevated risk indicators. Review counterparty connections and large transfers.' : '✅ Risk level is within acceptable range.'}`;
    }

    if (q.includes('balance') || q.includes('fund') || q.includes('money')) {
      return `**Financial Summary**\n\n- Confirmed Balance: **${summary ? (summary.confirmedBalance / 1e8).toFixed(4) : '—'} BTC**\n- Total Received: ${summary ? (summary.totalReceived / 1e8).toFixed(4) : '—'} BTC\n- Total Sent: ${summary ? (summary.totalSent / 1e8).toFixed(4) : '—'} BTC\n- Net Flow: ${summary ? ((summary.totalReceived - summary.totalSent) / 1e8).toFixed(4) : '—'} BTC`;
    }

    if (q.includes('counterpart') || q.includes('connect') || q.includes('address')) {
      const top5 = counterparties.slice(0, 5);
      return `**Top Counterparties (${counterparties.length} total)**\n\n${top5.map((cp, i) => `${i + 1}. \`${cp.address.slice(0, 16)}…\` — ${cp.direction} — ${cp.txCount} txns — ${((cp.totalIn + cp.totalOut) / 1e8).toFixed(4)} BTC`).join('\n') || 'No counterparties detected.'}`;
    }

    if (q.includes('transaction') || q.includes('tx') || q.includes('activity')) {
      const recent = transactions.slice(0, 5);
      return `**Recent Transactions (${transactions.length} loaded)**\n\n${recent.map(tx => `- \`${tx.txid.slice(0, 16)}…\` | ${tx.status.confirmed ? 'Confirmed' : 'Pending'} | Fee: ${(tx.fee / 1e8).toFixed(6)} BTC`).join('\n') || 'No transactions available.'}`;
    }

    if (q.includes('evidence')) {
      return `**Evidence Summary (${evidenceItems.length} items)**\n\n${evidenceItems.slice(0, 5).map(ev => `- **${ev.title}** (${ev.severity}) — ${ev.description.slice(0, 80)}…`).join('\n') || 'No evidence items generated.'}`;
    }

    if (q.includes('summar') || q.includes('overview') || q.includes('report')) {
      return `**Investigation Overview — ${investigationId}**\n\n- Target: \`${activeTargetAddress}\`\n- Chain: ${summary?.chain || 'Bitcoin Mainnet'}\n- Script: ${summary?.scriptType || '—'}\n- Balance: ${summary ? (summary.confirmedBalance / 1e8).toFixed(4) : '—'} BTC\n- Txns: ${summary?.txCount?.toLocaleString() || '—'}\n- Risk: ${riskScore}/100 (${riskLevel.toUpperCase()})\n- Counterparties: ${counterparties.length}\n- Alerts: ${alerts.length}\n- Evidence: ${evidenceItems.length} items\n- First Seen: ${summary?.firstSeen ? new Date(summary.firstSeen).toLocaleDateString() : '—'}\n- Last Active: ${summary?.lastSeen ? new Date(summary.lastSeen).toLocaleDateString() : '—'}`;
    }

    return `I can help with forensic intelligence for **${activeTargetAddress.slice(0, 16)}…**\n\nTry asking about:\n- Risk assessment and mixer exposure\n- Balance and fund flow analysis\n- Counterparties & OTC cash-out routes\n- Recent transaction timeline\n- Evidence items & Section 65B summary\n- Or any general blockchain, crypto, or forensic question`;
  };

  const handleSend = async () => {
    if (!input.trim() || isThinking) return;
    const userMsg = input.trim();
    setChatLog(prev => [...prev, { sender: 'user', text: userMsg }]);
    setInput('');
    setIsThinking(true);

    const context: InvestigationContext = {
      activeTargetAddress,
      investigationId,
      summary,
      transactions,
      counterparties,
      riskScore,
      riskLevel,
      alerts,
      evidenceItems
    };

    if (hasLiveKey) {
      try {
        const response = await askGemini(userMsg, context, chatLog);
        setChatLog(prev => [...prev, { sender: 'ai', text: response }]);
      } catch (err: any) {
        console.error('[LEATrace Neural Engine Error]:', err);
        const fallback = generateAIResponse(userMsg);
        setChatLog(prev => [
          ...prev, 
          { 
            sender: 'ai', 
            text: `⚠️ **Neural Engine Notice**: ${err.message || 'Unable to contact neural endpoint.'}\n\n*Falling back to local rule engine:*\n\n${fallback}`,
            isError: true 
          }
        ]);
      } finally {
        setIsThinking(false);
      }
    } else {
      // Local heuristic fallback
      setTimeout(() => {
        const response = generateAIResponse(userMsg);
        const notice = `*(Running with local rule engine. Set your AI Key in \`.env.local\` to activate the live LEATrace Neural Core.)*\n\n`;
        setChatLog(prev => [...prev, { sender: 'ai', text: notice + response }]);
        setIsThinking(false);
      }, 500);
    }
  };

  const handleSaveCustomKey = () => {
    if (!modalKeyInput.trim()) return;
    setCustomGeminiApiKey(modalKeyInput.trim());
    setApiKey(modalKeyInput.trim());
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      setShowKeyModal(false);
      setModalKeyInput('');
    }, 1200);
  };

  return (
    <div className="flex flex-col md:flex-row gap-6 animate-fade-in h-[calc(100vh-140px)]">
      {/* Left: Context Panel */}
      <div className="w-full md:w-72 shrink-0 space-y-4 overflow-y-auto">
        {/* LEATrace Neural Engine Status Card */}
        <div className="glass-card p-4 border border-primary-500/20 bg-dark-900/60">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles size={14} className="text-primary-400" />
              <span className="text-xs font-bold text-white">Neural Engine</span>
            </div>
            <button
              onClick={() => setShowKeyModal(true)}
              className="p-1 rounded text-dark-400 hover:text-primary-400 hover:bg-dark-800/50 transition-colors cursor-pointer"
              title="Configure Neural Engine Key"
            >
              <Key size={13} />
            </button>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-dark-400">Status</span>
              {hasLiveKey ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live LEAT-Neural
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  Rule Heuristic
                </span>
              )}
            </div>
            
            <div className="flex items-center justify-between text-xs">
              <span className="text-dark-400">Model</span>
              <span className="mono text-[10px] text-primary-300 font-semibold">{engineModelName}</span>
            </div>

            {!hasLiveKey && (
              <button
                onClick={() => setShowKeyModal(true)}
                className="w-full mt-2 py-1.5 px-2 bg-primary-500/10 hover:bg-primary-500/20 text-primary-400 border border-primary-500/20 rounded-lg text-[11px] font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Key size={12} />
                Set Key in .env.local
              </button>
            )}
          </div>
        </div>

        <div className="glass-card p-4 border border-dark-700/50">
          <div className="flex items-center gap-2 mb-3">
            <Shield size={14} className="text-primary-400" />
            <span className="text-xs font-bold text-white">Investigation Context</span>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2">
              <Wallet size={12} className="text-primary-400" />
              <code className="text-dark-300 mono text-[10px]">{activeTargetAddress.slice(0, 18)}…</code>
            </div>
            <div className="flex justify-between">
              <span className="text-dark-400">Case</span>
              <span className="text-primary-400 font-bold">{investigationId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-dark-400">Balance</span>
              <span className="text-white">{summary ? `${(summary.confirmedBalance / 1e8).toFixed(4)} BTC` : '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-dark-400">Txns</span>
              <span className="text-white">{summary?.txCount?.toLocaleString() || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-dark-400">Risk</span>
              <span className={`font-bold ${riskLevel === 'critical' ? 'text-accent-red' : riskLevel === 'high' ? 'text-accent-gold' : 'text-accent-green'}`}>
                {riskScore}% ({riskLevel})
              </span>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="glass-card p-4 border border-dark-700/50">
          <span className="text-[10px] text-dark-400 uppercase font-semibold">Quick Metrics</span>
          <div className="mt-2 space-y-1.5">
            {[
              { icon: AlertTriangle, label: 'Alerts', value: alerts.length, color: 'text-accent-gold' },
              { icon: Globe, label: 'Counterparties', value: counterparties.length, color: 'text-primary-400' },
              { icon: Database, label: 'Evidence', value: evidenceItems.length, color: 'text-accent-green' },
              { icon: Shield, label: 'UTXOs', value: summary ? `${(summary.confirmedBalance / 1e8).toFixed(2)}` : '—', color: 'text-white' },
            ].map(m => (
              <div key={m.label} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <m.icon size={10} className={m.color} />
                  <span className="text-dark-400">{m.label}</span>
                </div>
                <span className="text-white font-bold">{m.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Suggested Prompts */}
        <div className="glass-card p-4 border border-dark-700/50">
          <span className="text-[10px] text-dark-400 uppercase font-semibold">Suggested Questions (Any Topic)</span>
          <div className="mt-2 space-y-1">
            {[
              'Give a full investigation assessment and next steps',
              'What is a Bitcoin peel chain and how do we trace it?',
              'Explain Tornado Cash mixer obfuscation techniques',
              'What evidence is required under Section 65B for crypto?',
              'Write a Python script to fetch Bitcoin address balance',
              'List top counterparties and analyze fund directions',
            ].map(prompt => (
              <button
                key={prompt}
                onClick={() => { setInput(prompt); }}
                className="w-full text-left px-2 py-1.5 rounded text-[10px] text-dark-300 hover:text-primary-400 hover:bg-dark-800/50 transition-colors cursor-pointer"
              >
                → {prompt}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Right: Chat Area */}
      <div className="flex-1 flex flex-col glass-card overflow-hidden border border-dark-700/50">
        {/* Chat Header */}
        <div className="p-4 border-b border-dark-700/50 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-primary-400" />
            <span className="text-sm font-bold text-white">Forensic AI Copilot</span>
            <span className="text-[10px] text-dark-500">• Powered by LEATrace Neural Core</span>
          </div>

          <div className="flex items-center gap-2">
            {hasLiveKey ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live LEAT-Neural Active
              </span>
            ) : (
              <button
                onClick={() => setShowKeyModal(true)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 transition-colors cursor-pointer"
              >
                <Key size={11} />
                Add AI Key (.env.local)
              </button>
            )}
            <button
              onClick={() => setChatLog([])}
              className="p-1.5 rounded-lg text-dark-400 hover:text-white hover:bg-dark-800/60 transition-colors text-xs flex items-center gap-1 cursor-pointer"
              title="Reset Chat History"
            >
              <RefreshCw size={12} />
              <span className="text-[10px]">Reset</span>
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {chatLog.map((msg, i) => (
            <div key={i} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] p-3.5 rounded-xl text-xs leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-primary-500/20 text-white border border-primary-500/30 rounded-br-sm'
                  : msg.isError
                    ? 'bg-amber-950/30 text-amber-200 border border-amber-500/30 rounded-bl-sm'
                    : 'bg-dark-850/80 text-dark-100 border border-dark-700/60 rounded-bl-sm shadow-sm'
              }`}>
                <div className="whitespace-pre-wrap font-sans space-y-1.5">{msg.text}</div>
              </div>
            </div>
          ))}
          {isThinking && (
            <div className="flex justify-start">
              <div className="bg-dark-800/50 border border-dark-700/50 p-3 rounded-xl rounded-bl-sm">
                <div className="flex items-center gap-2 text-xs text-dark-400">
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  {hasLiveKey ? 'LEATrace Neural Engine is reasoning…' : 'Analyzing heuristics…'}
                </div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-dark-700/50 bg-dark-900/40">
          <div className="flex gap-2">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="Ask the Forensic AI about this target, flows, mixers, or case actions..."
              className="flex-1 px-4 py-2.5 bg-dark-800/60 border border-dark-700 rounded-xl text-xs text-white placeholder:text-dark-500 focus:border-primary-500/50 focus:outline-none"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isThinking}
              className="px-4 py-2.5 bg-primary-500/20 text-primary-400 rounded-xl border border-primary-500/30 hover:bg-primary-500/30 disabled:opacity-30 transition-all cursor-pointer flex items-center gap-1"
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* API Key Modal */}
      {showKeyModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-md p-6 border-primary-500/30 shadow-glow-cyan animate-scale-in">
            <div className="flex items-center justify-between border-b border-dark-700/50 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Key size={18} className="text-primary-400" />
                <h3 className="text-sm font-bold text-white">LEATrace Neural Engine Configuration</h3>
              </div>
              <button
                onClick={() => setShowKeyModal(false)}
                className="p-1 rounded text-dark-400 hover:text-white hover:bg-dark-800 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="bg-dark-900/80 border border-dark-750 p-3 rounded-lg space-y-2">
                <span className="font-semibold text-white block">Option 1: In `.env.local` file (Recommended)</span>
                <p className="text-dark-400 text-[11px]">
                  Add your key in <code className="text-primary-300 font-mono">frontend/.env.local</code>:
                </p>
                <pre className="bg-dark-950 p-2.5 rounded border border-dark-800 font-mono text-[10px] text-cyan-300 overflow-x-auto">
                  VITE_GEMINI_API_KEY=AIzaSy...
                </pre>
                <p className="text-[10px] text-dark-500">
                  *Vite automatically detects changes in <code className="text-dark-400 font-mono">.env.local</code> without committing keys to git.
                </p>
              </div>

              <div className="bg-dark-900/80 border border-dark-750 p-3 rounded-lg space-y-2">
                <span className="font-semibold text-white block">Option 2: Enter Key Directly</span>
                <p className="text-dark-400 text-[11px]">
                  Paste your API key below to activate the LEATrace Neural Engine immediately:
                </p>
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={modalKeyInput}
                    onChange={e => setModalKeyInput(e.target.value)}
                    placeholder="Enter API key..."
                    className="flex-1 px-3 py-2 bg-dark-950 border border-dark-700 rounded-lg text-xs text-white placeholder:text-dark-600 focus:border-primary-500 focus:outline-none"
                  />
                  <button
                    onClick={handleSaveCustomKey}
                    disabled={!modalKeyInput.trim()}
                    className="px-3 py-2 bg-primary-500 text-black font-semibold rounded-lg hover:bg-primary-400 disabled:opacity-40 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    {saveSuccess ? <Check size={14} /> : 'Save'}
                  </button>
                </div>
                {saveSuccess && (
                  <p className="text-[11px] text-emerald-400 flex items-center gap-1 font-medium">
                    <Check size={12} /> Neural Engine key activated successfully!
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-dark-700/50 text-[11px]">
                <span className="text-dark-400">Need an API Key?</span>
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary-400 hover:text-primary-300 flex items-center gap-1 font-medium"
                >
                  Get free key from Google AI Studio <ExternalLink size={12} />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
