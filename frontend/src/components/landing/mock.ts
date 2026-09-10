// Realistic (fictional) mock data for the LEAtTrace investigator console.

export type Status = "active" | "pending" | "closed" | "escalated"
export type Severity = "critical" | "high" | "medium" | "low"

export const cases = [
  { id: "LT-2026-0491", title: "Operation Dark Ledger — QuadX exchange laundering", chain: "Bitcoin", status: "active" as Status, priority: "critical", officer: "Insp. R. Kulkarni", value: "₹142.6 Cr", updated: "2026-09-08", progress: 68 },
  { id: "LT-2026-0488", title: "Ransomware payout tracing — MedhaHosp", chain: "Ethereum", status: "escalated" as Status, priority: "critical", officer: "SI A. Fernandes", value: "₹38.2 Cr", updated: "2026-09-08", progress: 41 },
  { id: "LT-2026-0472", title: "P2P scam network — Telegram \"FastProfit\"", chain: "Tron", status: "active" as Status, priority: "high", officer: "Insp. S. Nair", value: "₹9.7 Cr", updated: "2026-09-07", progress: 55 },
  { id: "LT-2026-0455", title: "Darknet marketplace vendor payouts", chain: "Monero", status: "pending" as Status, priority: "high", officer: "DySP M. Chauhan", value: "₹21.4 Cr", updated: "2026-09-06", progress: 23 },
  { id: "LT-2026-0431", title: "NFT wash-trading ring — ArtVault", chain: "Ethereum", status: "active" as Status, priority: "medium", officer: "SI P. Deshmukh", value: "₹4.1 Cr", updated: "2026-09-05", progress: 77 },
  { id: "LT-2026-0410", title: "Cross-border hawala bridge conversion", chain: "Bitcoin", status: "closed" as Status, priority: "high", officer: "Insp. R. Kulkarni", value: "₹67.0 Cr", updated: "2026-09-02", progress: 100 },
  { id: "LT-2026-0398", title: "Investment fraud — GoldMineCoin", chain: "BSC", status: "active" as Status, priority: "medium", officer: "SI A. Fernandes", value: "₹12.9 Cr", updated: "2026-09-01", progress: 34 },
  { id: "LT-2026-0377", title: "Sextortion payment cluster", chain: "Bitcoin", status: "pending" as Status, priority: "low", officer: "SI P. Deshmukh", value: "₹0.8 Cr", updated: "2026-08-29", progress: 12 },
]

export const alerts = [
  { id: "AL-9921", severity: "critical" as Severity, title: "High-risk outflow to sanctioned mixer", detail: "bc1q9x…7f2 sent 12.4 BTC to Tornado-linked cluster", time: "2m ago", case: "LT-2026-0491" },
  { id: "AL-9918", severity: "high" as Severity, title: "Watchlisted address activated", detail: "0x4fa…c19 received first inflow in 94 days", time: "18m ago", case: "LT-2026-0488" },
  { id: "AL-9915", severity: "medium" as Severity, title: "Rapid peel-chain detected", detail: "31 hops in 4 min across Tron network", time: "41m ago", case: "LT-2026-0472" },
  { id: "AL-9910", severity: "high" as Severity, title: "Exchange cash-out attempt", detail: "Flagged funds reached KYC exchange QuadX", time: "1h ago", case: "LT-2026-0491" },
  { id: "AL-9902", severity: "low" as Severity, title: "Dormant wallet woke up", detail: "0x11e…8ab moved after 2 years", time: "3h ago", case: "LT-2026-0398" },
  { id: "AL-9897", severity: "critical" as Severity, title: "Ransomware wallet re-used", detail: "Address matches MedhaHosp incident IOC", time: "5h ago", case: "LT-2026-0488" },
]

export const transactions = [
  { hash: "9f2c…a71b", from: "bc1q9x…7f2", to: "1Ex…QuadX", amount: "12.40 BTC", value: "₹8.9 Cr", risk: 94, time: "10:42:11" },
  { hash: "4a8d…22e0", from: "bc1q9x…7f2", to: "bc1zp…04c", amount: "3.10 BTC", value: "₹2.2 Cr", risk: 61, time: "10:39:57" },
  { hash: "77b1…9fd3", from: "1Feed…mixer", to: "bc1q9x…7f2", amount: "15.50 BTC", value: "₹11.1 Cr", risk: 88, time: "10:12:03" },
  { hash: "c0e4…1a55", from: "3Hop…aa1", to: "1Feed…mixer", amount: "5.90 BTC", value: "₹4.2 Cr", risk: 72, time: "09:58:40" },
  { hash: "e91a…77bc", from: "3Hop…aa1", to: "3Hop…bb2", amount: "5.85 BTC", value: "₹4.2 Cr", risk: 45, time: "09:41:18" },
  { hash: "2db8…4c10", from: "1Vic…tim", to: "3Hop…aa1", amount: "6.00 BTC", value: "₹4.3 Cr", risk: 30, time: "08:20:55" },
]

export const entities = [
  { name: "QuadX Exchange", type: "Exchange (KYC)", jurisdiction: "Seychelles", risk: 55, addresses: 1420, tag: "Cash-out point" },
  { name: "Tornado Cluster A", type: "Mixer", jurisdiction: "Decentralised", risk: 96, addresses: 380, tag: "Sanctioned" },
  { name: "FastProfit Ring", type: "Threat Actor", jurisdiction: "Unknown", risk: 89, addresses: 214, tag: "Active scam" },
  { name: "MedhaHosp Attacker", type: "Ransomware Op", jurisdiction: "Unknown", risk: 98, addresses: 12, tag: "Priority IOC" },
  { name: "BridgeSwap", type: "Cross-chain Bridge", jurisdiction: "BVI", risk: 63, addresses: 640, tag: "Layering" },
  { name: "ArtVault Market", type: "NFT Marketplace", jurisdiction: "UAE", risk: 47, addresses: 92, tag: "Wash trading" },
]

export const watchlist = [
  { address: "bc1q9x2f0h8v3k…7f2", chain: "Bitcoin", label: "Dark Ledger primary", risk: 94, added: "2026-08-30", exposure: "₹8.9 Cr" },
  { address: "0x4fa93c7b1e…c19", chain: "Ethereum", label: "MedhaHosp payout", risk: 91, added: "2026-08-28", exposure: "₹38.2 Cr" },
  { address: "TVx9pQ2mLd…0ac", chain: "Tron", label: "FastProfit collector", risk: 77, added: "2026-08-25", exposure: "₹9.7 Cr" },
  { address: "0x11e6a2…8ab", chain: "Ethereum", label: "GoldMineCoin treasury", risk: 58, added: "2026-08-20", exposure: "₹12.9 Cr" },
  { address: "bc1zp0q…04c", chain: "Bitcoin", label: "Suspected peel node", risk: 61, added: "2026-08-18", exposure: "₹2.2 Cr" },
]

export const evidence = [
  { id: "EV-4471", name: "blockchain_trace_dark-ledger.pdf", type: "Trace Report", case: "LT-2026-0491", hash: "sha256:7d9f…", size: "4.2 MB", custody: "verified", by: "Insp. R. Kulkarni", time: "2026-09-08 10:55" },
  { id: "EV-4468", name: "quadx_kyc_response.eml", type: "MLAT Response", case: "LT-2026-0491", hash: "sha256:1b3a…", size: "820 KB", custody: "verified", by: "Legal Cell", time: "2026-09-08 09:12" },
  { id: "EV-4455", name: "medhahosp_ransom_note.png", type: "Digital Artifact", case: "LT-2026-0488", hash: "sha256:9c22…", size: "1.1 MB", custody: "sealed", by: "SI A. Fernandes", time: "2026-09-07 16:40" },
  { id: "EV-4441", name: "telegram_fastprofit_logs.json", type: "OSINT Capture", case: "LT-2026-0472", hash: "sha256:44de…", size: "12.6 MB", custody: "verified", by: "Insp. S. Nair", time: "2026-09-06 14:22" },
  { id: "EV-4430", name: "graph_snapshot_wave3.svg", type: "Analysis Export", case: "LT-2026-0455", hash: "sha256:0af1…", size: "640 KB", custody: "pending", by: "DySP M. Chauhan", time: "2026-09-05 11:03" },
]

export const auditLogs = [
  { time: "2026-09-08 11:02:41", actor: "r.kulkarni", role: "Investigator", action: "Exported trace report EV-4471", target: "LT-2026-0491", ip: "10.24.6.11" },
  { time: "2026-09-08 10:58:03", actor: "system", role: "Engine", action: "Auto-flagged tx 9f2c…a71b (risk 94)", target: "AL-9921", ip: "—" },
  { time: "2026-09-08 10:44:19", actor: "a.fernandes", role: "Investigator", action: "Added address to watchlist", target: "0x4fa…c19", ip: "10.24.6.28" },
  { time: "2026-09-08 09:31:50", actor: "m.chauhan", role: "Supervisor", action: "Escalated case", target: "LT-2026-0488", ip: "10.24.6.4" },
  { time: "2026-09-08 09:12:07", actor: "legal.cell", role: "Legal", action: "Uploaded MLAT response", target: "EV-4468", ip: "10.24.9.2" },
  { time: "2026-09-08 08:47:33", actor: "s.nair", role: "Investigator", action: "Ran blockchain analysis query", target: "bc1q9x…7f2", ip: "10.24.6.19" },
  { time: "2026-09-08 08:20:15", actor: "admin", role: "Administrator", action: "Modified RBAC policy \"Analyst-R\"", target: "policy#12", ip: "10.24.1.1" },
  { time: "2026-09-08 07:59:48", actor: "p.deshmukh", role: "Investigator", action: "Login (2FA) success", target: "session", ip: "10.24.6.31" },
]

export const incidents = [
  { id: "IR-208", title: "Live cash-out at QuadX", stage: "Contain", sla: "00:42", owner: "R. Kulkarni", sev: "critical" as Severity },
  { id: "IR-205", title: "Ransomware negotiation channel", stage: "Investigate", sla: "03:18", owner: "A. Fernandes", sev: "critical" as Severity },
  { id: "IR-201", title: "Scam funds bridging to BSC", stage: "Triage", sla: "01:05", owner: "S. Nair", sev: "high" as Severity },
  { id: "IR-198", title: "Dormant wallet reactivation", stage: "Investigate", sla: "06:40", owner: "P. Deshmukh", sev: "medium" as Severity },
  { id: "IR-190", title: "NFT wash-trade sweep", stage: "Recover", sla: "12:00", owner: "M. Chauhan", sev: "medium" as Severity },
  { id: "IR-184", title: "Sextortion cluster mapping", stage: "Closed", sla: "—", owner: "P. Deshmukh", sev: "low" as Severity },
]

// Time series for charts
export const casesTrend = [
  { m: "Mar", opened: 34, closed: 21 },
  { m: "Apr", opened: 41, closed: 28 },
  { m: "May", opened: 38, closed: 33 },
  { m: "Jun", opened: 52, closed: 40 },
  { m: "Jul", opened: 47, closed: 44 },
  { m: "Aug", opened: 61, closed: 49 },
  { m: "Sep", opened: 58, closed: 52 },
]

export const chainVolume = [
  { label: "Bitcoin", value: 42, color: "#f7931a" },
  { label: "Ethereum", value: 28, color: "#8b9cff" },
  { label: "Tron", value: 14, color: "#fb5a6f" },
  { label: "BSC", value: 9, color: "#f7b955" },
  { label: "Monero", value: 7, color: "#ff7b54" },
]

export const socEvents = [
  { t: "11:02", type: "AUTH", msg: "Privileged login from 10.24.1.1", level: "info" },
  { t: "11:00", type: "ENGINE", msg: "Risk model re-scored 1,204 addresses", level: "info" },
  { t: "10:58", type: "ALERT", msg: "Critical outflow to sanctioned mixer", level: "critical" },
  { t: "10:51", type: "API", msg: "Chainalysis feed sync complete", level: "ok" },
  { t: "10:44", type: "WATCH", msg: "New address watchlisted by a.fernandes", level: "info" },
  { t: "10:39", type: "ALERT", msg: "Peel-chain velocity threshold breached", level: "warn" },
  { t: "10:22", type: "INGEST", msg: "Bitcoin block 921,004 processed", level: "ok" },
]

export const socThroughput = [12, 18, 15, 22, 30, 26, 34, 41, 38, 47, 44, 52, 49, 58, 61, 55, 63, 60, 71, 68, 74, 70, 66, 72]

// Graph model for Graph Visualization page
export const graphNodes = [
  { id: "victim", label: "Victim", x: 90, y: 220, type: "victim", risk: 10 },
  { id: "n1", label: "3Hop…aa1", x: 250, y: 120, type: "wallet", risk: 45 },
  { id: "n2", label: "3Hop…bb2", x: 250, y: 320, type: "wallet", risk: 40 },
  { id: "mixer", label: "1Feed…mixer", x: 430, y: 200, type: "mixer", risk: 96 },
  { id: "primary", label: "bc1q9x…7f2", x: 610, y: 200, type: "suspect", risk: 94 },
  { id: "peel", label: "bc1zp…04c", x: 610, y: 360, type: "wallet", risk: 61 },
  { id: "quadx", label: "QuadX", x: 790, y: 200, type: "exchange", risk: 55 },
]

export const graphEdges = [
  { from: "victim", to: "n1", amount: "6.0 BTC" },
  { from: "n1", to: "n2", amount: "5.85 BTC" },
  { from: "n1", to: "mixer", amount: "5.9 BTC" },
  { from: "mixer", to: "primary", amount: "15.5 BTC" },
  { from: "primary", to: "quadx", amount: "12.4 BTC" },
  { from: "primary", to: "peel", amount: "3.1 BTC" },
]

export const reports = [
  { id: "RP-1180", title: "Dark Ledger — Interim tracing report", case: "LT-2026-0491", type: "Court-ready", author: "R. Kulkarni", date: "2026-09-08", status: "final" },
  { id: "RP-1174", title: "MedhaHosp ransomware financial flow", case: "LT-2026-0488", type: "Intelligence", author: "A. Fernandes", date: "2026-09-07", status: "review" },
  { id: "RP-1169", title: "FastProfit network attribution", case: "LT-2026-0472", type: "Attribution", author: "S. Nair", date: "2026-09-06", status: "draft" },
  { id: "RP-1160", title: "Monthly seizure summary — August", case: "—", type: "Executive", author: "M. Chauhan", date: "2026-09-01", status: "final" },
]

export const modules = [
  { key: "dashboard", label: "Dashboard", desc: "Unified command view of live cases, alerts and seizures." },
  { key: "cases", label: "Case Management", desc: "Track investigations end-to-end with custody and status." },
  { key: "analysis", label: "Blockchain Analysis", desc: "Trace wallets and transactions across 9 chains." },
  { key: "graph", label: "Graph Visualization", desc: "Map fund flows through interactive entity graphs." },
  { key: "evidence", label: "Evidence Vault", desc: "Tamper-evident storage with full chain of custody." },
  { key: "watchlist", label: "Watchlist", desc: "Monitor high-risk addresses in real time." },
  { key: "alerts", label: "Alerts", desc: "Automated risk detection and escalation." },
  { key: "reports", label: "Reports", desc: "Generate court-ready and intelligence reports." },
  { key: "workspace", label: "Cyber Workspace", desc: "Saved queries, tools and collaborative notes." },
  { key: "incident", label: "Incident Response", desc: "Coordinate live seizures with SLA playbooks." },
  { key: "soc", label: "SOC Dashboard", desc: "Security operations monitoring for the platform." },
]
