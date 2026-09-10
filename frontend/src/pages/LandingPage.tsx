import { useRef, useState, type ReactNode } from "react"

import { Reveal, CountUp } from "../components/landing/motion"
import { Wordmark, Button } from "../components/landing/ui"
import { graphNodes, graphEdges, modules } from "../components/landing/mock"
import {
  IconArrow,
  IconChain,
  IconGraph,
  IconVault,
  IconEye,
  IconBell,
  IconReport,
  IconEntity,
  IconIncident,
  IconSoc,
  IconLogs,
  IconCase,
  IconLock,
  IconFingerprint,
  IconLayers,
  IconGlobe,
  IconBolt,
  IconCheck,
  IconExternal,
  IconWallet,
  IconTrendUp,
  IconClock,
  IconUsers,
  IconFlag,
  IconChevronDown,
  IconMenu,
  IconX,
} from "../components/landing/icons"


function Link({
  to,
  className,
  children,
  onClick,
}: {
  to: string
  className?: string
  children: ReactNode
  onClick?: () => void
}) {
  return (
    <a
      href={to.startsWith('#') ? to : `#${to}`}
      className={className}
      onClick={(e) => {
        if (onClick) {
          e.preventDefault()
          onClick()
        }
      }}
    >
      {children}
    </a>
  )
}

const moduleIcons: Record<string, any> = {
  dashboard: IconGraph,
  cases: IconCase,
  analysis: IconChain,
  graph: IconGraph,
  evidence: IconVault,
  watchlist: IconEye,
  alerts: IconBell,
  reports: IconReport,
  workspace: IconBolt,
  incident: IconIncident,
  soc: IconSoc,
}

/* Alternating detail row: copy on one side, a live-looking mock on the other */
function FeatureRow({
  eyebrow,
  title,
  desc,
  points,
  visual,
  flip = false,
}: {
  eyebrow: string
  title: string
  desc: string
  points: string[]
  visual: ReactNode
  flip?: boolean
}) {
  return (
    <div className="grid items-center gap-10 lg:grid-cols-2">
      <Reveal className={flip ? "lg:order-2" : ""}>
        <div className="mb-2 font-mono text-[11px] uppercase tracking-[0.2em] text-accent">{eyebrow}</div>
        <h3 className="font-display text-[26px] font-700 leading-tight tracking-tight text-ink lg:text-[30px]">{title}</h3>
        <p className="mt-3 max-w-lg text-[14.5px] leading-relaxed text-muted">{desc}</p>
        <ul className="mt-5 space-y-2.5">
          {points.map((p) => (
            <li key={p} className="flex items-start gap-3 text-[13.5px] text-ink2">
              <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-accent/12 text-accent">
                <IconCheck size={13} />
              </span>
              {p}
            </li>
          ))}
        </ul>
      </Reveal>
      <Reveal delay={120} className={flip ? "lg:order-1" : ""}>
        <div className="glass glass-hover rounded-lg p-4">{visual}</div>
      </Reveal>
    </div>
  )
}

function MockHeader({ label, tag, tagTone = "accent" }: { label: string; tag: string; tagTone?: string }) {
  const tone = tagTone === "danger" ? "text-danger" : tagTone === "ok" ? "text-ok" : "text-accent"
  return (
    <div className="mb-3 flex items-center justify-between px-1">
      <span className="font-mono text-[11px] uppercase tracking-wider text-faint">{label}</span>
      <span className={`flex items-center gap-1.5 font-mono text-[10.5px] ${tone}`}>
        <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-current" /> {tag}
      </span>
    </div>
  )
}

/* KYT real-time monitoring mock */
function KytMock() {
  const rows = [
    ["0x4fa…c19", "inflow", "12.4 ETH", 94, "danger"],
    ["bc1q…7f2", "peel", "3.10 BTC", 61, "warn"],
    ["TVx9…0ac", "swap", "48k USDT", 77, "warn"],
    ["0x11e…8ab", "deposit", "5.9 ETH", 30, "ok"],
  ] as const
  return (
    <div>
      <MockHeader label="know your transaction · live" tag="STREAMING" tagTone="ok" />
      <div className="space-y-1.5">
        {rows.map((r) => (
          <div key={r[0]} className="flex items-center gap-3 rounded-lg border border-line bg-surface/70 px-3 py-2.5 font-mono text-[12px]">
            <span className="text-accent">{r[0]}</span>
            <span className="rounded border border-line px-1.5 py-0.5 text-[10px] uppercase text-faint">{r[1]}</span>
            <span className="ml-auto text-ink2">{r[2]}</span>
            <span
              className={`rounded px-1.5 py-0.5 text-[10.5px] ${
                r[4] === "danger" ? "bg-danger/15 text-danger" : r[4] === "warn" ? "bg-warn/15 text-warn" : "bg-ok/15 text-ok"
              }`}
            >
              {r[3]}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* Wallet attribution / clustering mock */
function AttributionMock() {
  const rings = [
    { r: 58, n: 5, c: "#22d3ee" },
    { r: 40, n: 8, c: "#2dd4bf" },
  ]
  return (
    <div>
      <MockHeader label="entity clustering" tag="1,420 ADDRESSES" />
      <div className="grid-bg relative grid place-items-center rounded-md bg-base2/50" style={{ aspectRatio: "16/10" }}>
        <svg viewBox="0 0 260 180" className="h-full w-full">
          {rings.map((ring, ri) =>
            Array.from({ length: ring.n }).map((_, i) => {
              const a = (i / ring.n) * Math.PI * 2
              const x = 130 + Math.cos(a) * ring.r
              const y = 90 + Math.sin(a) * ring.r
              return (
                <g key={`${ri}-${i}`}>
                  <line x1="130" y1="90" x2={x} y2={y} stroke={ring.c} strokeOpacity="0.3" strokeWidth="1" />
                  <circle cx={x} cy={y} r="5" fill="#0c1421" stroke={ring.c} strokeWidth="1.6" />
                </g>
              )
            }),
          )}
          <circle cx="130" cy="90" r="16" fill="#22d3ee" fillOpacity="0.12" />
          <circle cx="130" cy="90" r="9" fill="#0c1421" stroke="#22d3ee" strokeWidth="2.4" />
          <text x="130" y="122" textAnchor="middle" fontSize="10" fontFamily="JetBrains Mono" className="fill-muted">
            QuadX Exchange
          </text>
        </svg>
      </div>
    </div>
  )
}

/* Sanctions & illicit-actor screening mock */
function SanctionsMock() {
  const items = [
    ["OFAC SDN list", "Sanctioned mixer match", "danger"],
    ["Ransomware IOC", "MedhaHosp wallet re-use", "danger"],
    ["Darknet market", "Vendor payout cluster", "warn"],
    ["High-risk jurisdiction", "Layering via BridgeSwap", "warn"],
  ] as const
  return (
    <div>
      <MockHeader label="sanctions & illicit screening" tag="4 HITS" tagTone="danger" />
      <div className="space-y-2">
        {items.map((it) => (
          <div key={it[0]} className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 ${it[2] === "danger" ? "border-danger/25 bg-danger/5" : "border-warn/25 bg-warn/5"}`}>
            <span className={`grid h-7 w-7 place-items-center rounded-md ${it[2] === "danger" ? "bg-danger/15 text-danger" : "bg-warn/15 text-warn"}`}>
              <IconFlag size={14} />
            </span>
            <div className="min-w-0">
              <div className="text-[12.5px] font-medium text-ink">{it[0]}</div>
              <div className="truncate font-mono text-[11px] text-muted">{it[1]}</div>
            </div>
            <IconArrow size={14} className="ml-auto text-faint" />
          </div>
        ))}
      </div>
    </div>
  )
}

/* Cross-chain bridge tracing mock */
function BridgeMock() {
  const legs = [
    ["Ethereum", "ETH", "#22d3ee", "8.20 ETH"],
    ["Wormhole bridge", "BRIDGE", "#f7b955", "wrapped"],
    ["Solana", "SOL", "#a78bfa", "612 SOL"],
    ["Tron", "USDT", "#fb5a6f", "184k USDT"],
  ] as const
  return (
    <div>
      <MockHeader label="cross-chain flow · reconstructed" tag="3 BRIDGES" tagTone="accent" />
      <div className="relative space-y-1.5">
        {legs.map((l, i) => (
          <div key={l[0]} className="relative">
            <div className="flex items-center gap-3 rounded-lg border border-line bg-surface/70 px-3 py-2.5">
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: l[2] }} />
              <span className="text-[12.5px] text-ink">{l[0]}</span>
              <span className="rounded border border-line px-1.5 py-0.5 font-mono text-[10px] uppercase text-faint">{l[1]}</span>
              <span className="ml-auto font-mono text-[11.5px] text-ink2">{l[3]}</span>
            </div>
            {i < legs.length - 1 && (
              <div className="ml-[7px] h-3 w-px bg-gradient-to-b from-accent/60 to-accent/10" />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

/* Automated playbook / triage mock */
function PlaybookMock() {
  const steps = [
    ["Trigger", "Risk score ≥ 85 on watched wallet", "ok"],
    ["Enrich", "Pull attribution + sanctions exposure", "accent"],
    ["Decide", "Auto-route to EOW case queue", "accent"],
    ["Act", "Freeze request drafted · analyst notified", "warn"],
  ] as const
  return (
    <div>
      <MockHeader label="playbook · auto-triage" tag="RUNNING" tagTone="ok" />
      <div className="space-y-2">
        {steps.map((s, i) => (
          <div key={s[0]} className="flex items-start gap-3 rounded-lg border border-line bg-surface/60 px-3 py-2.5">
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-accent/12 font-mono text-[11px] text-accent">
              {i + 1}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[12.5px] font-600 text-ink">{s[0]}</span>
                <span className={`h-1.5 w-1.5 rounded-full ${s[2] === "ok" ? "bg-ok" : s[2] === "warn" ? "bg-warn" : "bg-accent"} animate-pulse-dot`} />
              </div>
              <div className="mt-0.5 font-mono text-[11px] text-muted">{s[1]}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* Reactor-style investigation canvas preview (for the platform explorer) */
function ReactorMock() {
  return (
    <div className="grid-bg relative overflow-hidden rounded-md bg-base2/60" style={{ aspectRatio: "16/10" }}>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-16 animate-scan-x bg-gradient-to-r from-transparent via-accent/10 to-transparent" />
      <svg viewBox="0 0 320 200" className="h-full w-full">
        {[
          [50, 60, 150, 40],
          [150, 40, 250, 70],
          [150, 40, 160, 140],
          [160, 140, 260, 160],
          [50, 60, 90, 150],
        ].map((e, i) => (
          <line key={i} x1={e[0]} y1={e[1]} x2={e[2]} y2={e[3]} stroke="#22d3ee" strokeWidth="1.2" strokeOpacity="0.35" strokeDasharray="4 5" style={{ animation: "dash-flow 18s linear infinite" }} />
        ))}
        {[
          [50, 60, "#3ddc97", "victim"],
          [150, 40, "#fb5a6f", "mixer"],
          [250, 70, "#f7b955", "exchange"],
          [160, 140, "#22d3ee", "wallet"],
          [260, 160, "#fb5a6f", "suspect"],
          [90, 150, "#22d3ee", "hop"],
        ].map((n, i) => (
          <g key={i}>
            <circle cx={n[0] as number} cy={n[1] as number} r="14" fill={n[2] as string} fillOpacity="0.09" />
            <circle cx={n[0] as number} cy={n[1] as number} r="6.5" fill="#0c1421" stroke={n[2] as string} strokeWidth="1.8" />
            <text x={n[0] as number} y={(n[1] as number) + 22} textAnchor="middle" fontSize="8.5" fontFamily="JetBrains Mono" className="fill-faint">{n[3] as string}</text>
          </g>
        ))}
      </svg>
    </div>
  )
}

/* Address screening API panel (for the platform explorer) */
function ScreeningMock() {
  return (
    <div className="overflow-hidden rounded-md border border-line bg-base2/60">
      <div className="flex items-center gap-2 border-b border-line px-3 py-2">
        <span className="h-2 w-2 rounded-full bg-danger/70" />
        <span className="h-2 w-2 rounded-full bg-warn/70" />
        <span className="h-2 w-2 rounded-full bg-ok/70" />
        <span className="ml-1 font-mono text-[10.5px] text-faint">GET /v1/screening/0x4fa…c19</span>
      </div>
      <pre className="overflow-x-auto p-3 font-mono text-[11.5px] leading-relaxed text-ink2">
<span className="text-faint">{`{`}</span>{`
  "risk_score": `}<span className="text-danger">94</span>{`,
  "category": `}<span className="text-warn">"illicit"</span>{`,
  "entity": `}<span className="text-accent">"Tornado Cluster A"</span>{`,
  "exposure": [`}<span className="text-warn">"sanctioned_mixer"</span>{`],
  "chains": `}<span className="text-ink">7</span>{`
`}<span className="text-faint">{`}`}</span>
      </pre>
    </div>
  )
}

/* Interactive product explorer — switches the primary view + spec panel */
function PlatformExplorer() {
  const views = [
    {
      key: "Investigate",
      icon: IconGraph,
      title: "Reactor-grade investigation canvas",
      desc: "Expand any address into a live graph. Follow funds through mixers, peel chains and bridges with automatic path-finding and one-click entity expansion.",
      visual: <ReactorMock />,
      spec: [["Auto path-find", "6 hops"], ["Entity expand", "1-click"], ["Save state", "shared"]],
    },
    {
      key: "Monitor",
      icon: IconEye,
      title: "Continuous KYT transaction monitoring",
      desc: "Score every inflow, outflow and swap in real time against attribution and illicit-actor data. Tune behavioural rules to cut noise and auto-escalate critical exposure.",
      visual: <KytMock />,
      spec: [["Latency", "< 1.2s"], ["Assets", "10k+"], ["Rules", "custom"]],
    },
    {
      key: "Screen",
      icon: IconChain,
      title: "Address & wallet screening API",
      desc: "Pre-screen any address for risk before you engage. Sub-second risk scores, entity attribution and sanctions exposure over a hardened REST API inside your deployment.",
      visual: <ScreeningMock />,
      spec: [["Response", "< 400ms"], ["Uptime", "99.95%"], ["Auth", "mTLS"]],
    },
    {
      key: "Automate",
      icon: IconBolt,
      title: "Playbook automation & auto-triage",
      desc: "Codify the steps your best analysts take. Playbooks trigger on risk thresholds, enrich alerts, route cases and draft freeze requests — before a human opens the file.",
      visual: <PlaybookMock />,
      spec: [["Triggers", "score + rule"], ["Actions", "12 types"], ["Audit", "logged"]],
    },
  ]
  const [active, setActive] = useState(0)
  const v = views[active]
  const Icon = v.icon
  return (
    <div>
      <div className="mb-8 flex flex-wrap gap-2">
        {views.map((view, i) => {
          const TabIcon = view.icon
          return (
            <button
              key={view.key}
              onClick={() => setActive(i)}
              className={`group inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 font-mono text-[12px] uppercase tracking-wider transition-all duration-200 ${
                i === active
                  ? "border-accent/50 bg-accent/10 text-accent"
                  : "border-line bg-surface/50 text-muted hover:border-line2 hover:text-ink2"
              }`}
            >
              <TabIcon size={15} />
              {view.key}
            </button>
          )
        })}
      </div>
      <div key={active} className="animate-rise grid items-center gap-10 lg:grid-cols-2">
        <div>
          <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-lg border border-accent/30 bg-accent/10 text-accent">
            <Icon size={21} />
          </div>
          <h3 className="font-display text-[24px] font-700 leading-tight tracking-tight text-ink lg:text-[28px]">{v.title}</h3>
          <p className="mt-3 max-w-lg text-[14.5px] leading-relaxed text-muted">{v.desc}</p>
          <div className="mt-6 grid grid-cols-3 divide-x divide-line rounded-lg border border-line bg-surface/40">
            {v.spec.map((s) => (
              <div key={s[0]} className="px-4 py-3">
                <div className="font-display text-[16px] font-700 text-accent">{s[1]}</div>
                <div className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-faint">{s[0]}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="glass glass-hover rounded-lg p-4">{v.visual}</div>
      </div>
    </div>
  )
}

/* Spotlight card — transparent cursor-tracked tint, hairline ignite on hover */
function SpotCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement | null>(null)
  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    el.style.setProperty("--mx", `${e.clientX - r.left}px`)
    el.style.setProperty("--my", `${e.clientY - r.top}px`)
  }
  return (
    <div ref={ref} onMouseMove={onMove} className={`glass spotlight ring-hover h-full rounded-md ${className}`}>
      {children}
    </div>
  )
}

/* Interactive risk gauge that responds to a severity slider */
function RiskGauge() {
  const [score, setScore] = useState(78)
  const tone = score >= 80 ? "danger" : score >= 55 ? "warn" : "ok"
  const color = tone === "danger" ? "#fb5a6f" : tone === "warn" ? "#f7b955" : "#3ddc97"
  const label = score >= 80 ? "SEVERE" : score >= 55 ? "ELEVATED" : "LOW"
  const R = 52
  const C = 2 * Math.PI * R
  const dash = (score / 100) * C
  return (
    <div className="grid items-center gap-8 sm:grid-cols-[auto_1fr]">
      <div className="relative mx-auto grid h-[150px] w-[150px] place-items-center">
        <svg viewBox="0 0 140 140" className="h-full w-full -rotate-90">
          <circle cx="70" cy="70" r={R} fill="none" stroke="var(--color-line)" strokeWidth="9" />
          <circle
            cx="70"
            cy="70"
            r={R}
            fill="none"
            stroke={color}
            strokeWidth="9"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${C}`}
            style={{ transition: "stroke-dasharray 0.4s cubic-bezier(0.22,1,0.36,1), stroke 0.3s" }}
          />
        </svg>
        <div className="absolute grid place-items-center text-center">
          <span className="font-display text-[34px] font-800 leading-none" style={{ color }}>{score}</span>
          <span className="mt-1 font-mono text-[10px] uppercase tracking-[0.16em]" style={{ color }}>{label}</span>
        </div>
      </div>
      <div>
        <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-faint">Composite risk score</div>
        <p className="mt-2 text-[13.5px] leading-relaxed text-muted">
          Drag to see how weighted signals — sanctions exposure, mixer proximity, counterparty risk and behavioural
          typologies — roll up into a single explainable score.
        </p>
        <input
          type="range"
          min={0}
          max={100}
          value={score}
          onChange={(e) => setScore(Number(e.target.value))}
          className="mt-5 w-full accent-accent"
          aria-label="Adjust risk score"
        />
        <div className="mt-4 flex flex-wrap gap-2">
          {[
            ["Sanctions", "+34"],
            ["Mixer proximity", "+22"],
            ["Counterparty", "+15"],
            ["Typology", "+7"],
          ].map((s) => (
            <span key={s[0]} className="rounded-full border border-line bg-surface/60 px-2.5 py-1 font-mono text-[10.5px] text-ink2">
              {s[0]} <span className="text-accent">{s[1]}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

/* Decorative hero trace graph */
function HeroGraph() {
  const nx = (x: number) => (x / 880) * 100
  const ny = (y: number) => (y / 440) * 100
  const nodeById = (id: string) => graphNodes.find((n) => n.id === id)!
  const color = (t: string) =>
    t === "mixer" || t === "suspect" ? "#fb5a6f" : t === "exchange" ? "#f7b955" : t === "victim" ? "#3ddc97" : "#22d3ee"
  return (
    <svg viewBox="0 0 880 440" className="h-full w-full" preserveAspectRatio="xMidYMid meet">
      {graphEdges.map((e, i) => {
        const a = nodeById(e.from)
        const b = nodeById(e.to)
        return (
          <line
            key={i}
            x1={a.x}
            y1={a.y}
            x2={b.x}
            y2={b.y}
            stroke="#22d3ee"
            strokeWidth="1.4"
            strokeOpacity="0.4"
            strokeDasharray="5 6"
            style={{ animation: "dash-flow 22s linear infinite" }}
          />
        )
      })}
      {graphNodes.map((n) => {
        const hot = n.risk >= 80
        return (
          <g key={n.id}>
            {hot && (
              <circle cx={n.x} cy={n.y} r="8" fill="none" stroke={color(n.type)} strokeWidth="1.5">
                <animate attributeName="r" values="8;24" dur="2.4s" repeatCount="indefinite" />
                <animate attributeName="stroke-opacity" values="0.8;0" dur="2.4s" repeatCount="indefinite" />
              </circle>
            )}
            <circle cx={n.x} cy={n.y} r="20" fill={color(n.type)} fillOpacity="0.08" />
            <circle cx={n.x} cy={n.y} r="8" fill="#0c1421" stroke={color(n.type)} strokeWidth="2" />
            <circle cx={n.x} cy={n.y} r="2.6" fill={color(n.type)} />
            <text x={n.x} y={n.y + 32} textAnchor="middle" fontSize="11" fontFamily="JetBrains Mono" className="fill-muted">
              {n.label}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

function Header({
  onLogin,
  isOfficerLoggedIn,
  onReturnToConsole,
}: {
  onLogin?: () => void
  isOfficerLoggedIn?: boolean
  onReturnToConsole?: () => void
}) {
  const [open, setOpen] = useState(false)
  const links = [
    ["Capabilities", "#capabilities"],
    ["Platform", "#platform"],
    ["Workflow", "#workflow"],
    ["Security", "#security"],
    ["FAQ", "#faq"],
  ]
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-base/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1240px] items-center justify-between px-5 py-3.5">
        <Link to="/">
          <Wordmark subtitle="BLOCKCHAIN INTELLIGENCE" />
        </Link>
        <nav className="hidden items-center gap-8 md:flex">
          {links.map(([l, h]) => (
            <a
              key={l}
              href={h}
              className="font-mono text-[11.5px] uppercase tracking-wider text-muted transition-colors hover:text-ink"
            >
              {l}
            </a>
          ))}
        </nav>
        <div className="hidden items-center gap-2.5 md:flex">
          {isOfficerLoggedIn ? (
            <Button size="sm" onClick={onReturnToConsole}>
              Launch Console <IconArrow size={15} />
            </Button>
          ) : (
            <>
              <Button size="sm" variant="ghost" onClick={onLogin} className="border border-line hover:border-accent/40 text-ink">
                Officer Login
              </Button>
              <a href="#access">
                <Button size="sm">
                  Request access <IconArrow size={15} />
                </Button>
              </a>
            </>
          )}
        </div>
        <button className="text-ink2 md:hidden" onClick={() => setOpen(!open)} aria-label="Menu">
          {open ? <IconX size={20} /> : <IconMenu size={20} />}
        </button>
      </div>
      {open && (
        <div className="space-y-1 border-t border-line px-5 py-3 md:hidden">
          {links.map(([l, h]) => (
            <a
              key={l}
              href={h}
              onClick={() => setOpen(false)}
              className="block py-2 font-mono text-[12px] uppercase tracking-wider text-muted"
            >
              {l}
            </a>
          ))}
          {isOfficerLoggedIn ? (
            <Button size="sm" className="mt-2 w-full" onClick={() => { setOpen(false); onReturnToConsole?.(); }}>
              Launch Console <IconArrow size={15} />
            </Button>
          ) : (
            <div className="flex flex-col gap-2 pt-2">
              <Button size="sm" variant="outline" className="w-full" onClick={() => { setOpen(false); onLogin?.(); }}>
                Officer Login
              </Button>
              <a href="#access" onClick={() => setOpen(false)}>
                <Button size="sm" className="w-full">
                  Request access
                </Button>
              </a>
            </div>
          )}
        </div>
      )}
    </header>
  )
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="glass rounded-md">
      <button onClick={() => setOpen(!open)} className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left">
        <span className="font-display text-[15px] font-600 text-ink">{q}</span>
        <IconChevronDown size={18} className={`shrink-0 text-accent transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
      </button>
      <div className={`grid overflow-hidden px-5 transition-all duration-300 ${open ? "grid-rows-[1fr] pb-4" : "grid-rows-[0fr]"}`}>
        <div className="min-h-0 overflow-hidden">
          <p className="text-[13.5px] leading-relaxed text-muted">{a}</p>
        </div>
      </div>
    </div>
  )
}

export interface LandingPageProps {
  onLogin?: () => void
  isOfficerLoggedIn?: boolean
  onReturnToConsole?: () => void
  officerName?: string
}

export function LandingPage({
  onLogin,
  isOfficerLoggedIn,
  onReturnToConsole,
  officerName,
}: LandingPageProps) {
  return (
    <div className="min-h-full bg-base text-ink relative">
      {isOfficerLoggedIn && (
        <div className="sticky top-0 z-50 flex items-center justify-between bg-primary-500/15 border-b border-primary-500/30 px-4 py-2 backdrop-blur-md">
          <div className="flex items-center gap-2 text-xs font-mono text-primary-300">
            <span className="w-2 h-2 rounded-full bg-accent-green animate-pulse" />
            <span>Signed in as Officer: <strong className="text-white">{officerName || 'Investigator'}</strong></span>
          </div>
          <button
            onClick={onReturnToConsole}
            className="text-xs font-mono px-3 py-1 bg-primary-500/20 text-primary-300 hover:bg-primary-500/30 border border-primary-500/40 rounded transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <span>Return to Console</span>
            <span>→</span>
          </button>
        </div>
      )}
      <Header
        onLogin={onLogin}
        isOfficerLoggedIn={isOfficerLoggedIn}
        onReturnToConsole={onReturnToConsole}
      />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-line">
        <div className="grid-bg absolute inset-0" />
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(120% 90% at 50% -10%, color-mix(in srgb, var(--color-accent) 10%, transparent), transparent 55%)",
          }}
        />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent" />
        <div className="relative mx-auto grid max-w-[1240px] items-center gap-14 px-5 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:py-24">
          <div className="animate-rise">
            <div className="inline-flex items-center gap-2 rounded-sm border border-line bg-surface/80 px-2.5 py-1 font-mono text-[10.5px] uppercase tracking-[0.14em] text-ink2">
              <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-accent" />
              Restricted · Government of India
            </div>
            <h1 className="mt-6 font-display text-[44px] font-800 leading-[1.02] tracking-[-0.02em] text-ink lg:text-[58px]">
              Follow the money
              <br />
              across <span className="text-accent">every chain.</span>
            </h1>
            <p className="mt-6 max-w-lg text-[15px] leading-relaxed text-ink2">
              The unified blockchain intelligence platform for the CBI and the Indian Cybercrime Coordination Centre (I4C).
              Trace illicit crypto flows, attribute entities, preserve evidence and build court-ready cases — in one secure
              command console.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              {isOfficerLoggedIn ? (
                <Button onClick={onReturnToConsole}>
                  Open Command Console <IconArrow size={16} />
                </Button>
              ) : (
                <Button onClick={onLogin}>
                  Launch Console / Sign In <IconArrow size={16} />
                </Button>
              )}
              <a href="#platform">
                <Button variant="outline">Explore the platform</Button>
              </a>
            </div>
            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-line pt-6 font-mono text-[11px] uppercase tracking-wider text-faint">
              <span className="flex items-center gap-1.5">
                <IconLock size={13} className="text-ok" /> AES-256
              </span>
              <span className="flex items-center gap-1.5">
                <IconFingerprint size={13} className="text-ok" /> RBAC + 2FA
              </span>
              <span className="flex items-center gap-1.5">
                <IconGlobe size={13} className="text-ok" /> Residency: IN
              </span>
            </div>
          </div>

          <div className="relative">
            <div className="glass overflow-hidden rounded-lg">
              <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
                <span className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-faint">
                  trace · operation dark ledger
                </span>
                <span className="flex items-center gap-1.5 rounded-sm bg-danger/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-danger">
                  <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-danger" /> High risk
                </span>
              </div>
              <div className="grid-bg bg-base2/60 p-1" style={{ aspectRatio: "2/1" }}>
                <HeroGraph />
              </div>
              <div className="grid grid-cols-3 divide-x divide-line border-t border-line">
                {[
                  ["Traced", "31.9 BTC"],
                  ["Hops", "6"],
                  ["Exposure", "₹22.9 Cr"],
                ].map(([l, v]) => (
                  <div key={l} className="px-4 py-3">
                    <div className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-faint">{l}</div>
                    <div className="mt-1 font-display text-[17px] font-700 tracking-tight text-ink">{v}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust bar */}
      <section className="border-b border-line bg-base2/40">
        <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-6 px-5 py-6">
          <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-faint">Trusted across agencies</span>
          <div className="flex flex-wrap items-center gap-x-8 gap-y-3 font-display text-[14px] font-600 text-ink2">
            <span>CBI</span>
            <span className="text-line2">•</span>
            <span>I4C · MHA</span>
            <span className="text-line2">•</span>
            <span>ED · FIU-IND</span>
            <span className="text-line2">•</span>
            <span>State Cyber Cells</span>
            <span className="text-line2">•</span>
            <span>INTERPOL Liaison</span>
          </div>
        </div>
      </section>

      {/* Live intelligence ticker */}
      <section className="border-b border-line bg-base/60">
        <div className="mx-auto flex max-w-[1240px] items-center gap-4 px-5 py-3">
          <span className="flex shrink-0 items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.16em] text-danger">
            <span className="h-1.5 w-1.5 animate-ticker-blink rounded-full bg-danger" />
            Live intel
          </span>
          <div className="marquee-group edge-fade-x relative flex-1 overflow-hidden">
            <div className="marquee gap-8">
              {[0, 1].flatMap((copy) =>
                [
                  ["OFAC", "New SDN mixer address added · bc1q…7f2", "danger"],
                  ["RANSOMWARE", "LockBit affiliate cluster expanded (+41 wallets)", "danger"],
                  ["BRIDGE", "Anomalous $4.1M cross-chain hop flagged · ETH→SOL", "warn"],
                  ["DARKNET", "Vendor payout pattern matched to known market", "warn"],
                  ["ATTRIBUTION", "QuadX exchange hot-wallet re-clustered", "accent"],
                  ["TYPOLOGY", "Peel-chain layering detected · 31 hops", "warn"],
                  ["SANCTIONS", "Cross-referenced UN consolidated list update", "accent"],
                ].map((t, i) => (
                  <span key={`${copy}-${i}`} className="flex shrink-0 items-center gap-2.5 font-mono text-[11.5px]">
                    <span
                      className={`rounded px-1.5 py-0.5 text-[9.5px] uppercase tracking-wider ${
                        t[2] === "danger" ? "bg-danger/15 text-danger" : t[2] === "warn" ? "bg-warn/15 text-warn" : "bg-accent/15 text-accent"
                      }`}
                    >
                      {t[0]}
                    </span>
                    <span className="text-muted">{t[1]}</span>
                    <span className="text-line2">/</span>
                  </span>
                )),
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Capabilities */}
      <section id="capabilities" className="mx-auto max-w-[1240px] px-5 py-20">
        <Reveal className="mb-10 max-w-2xl">
          <div className="mb-2 font-mono text-[11px] uppercase tracking-[0.2em] text-accent">Capabilities</div>
          <h2 className="font-display text-[34px] font-800 tracking-[-0.02em] text-ink">One console, twelve investigative modules</h2>
          <p className="mt-3 text-[14.5px] text-muted">
            Every stage of a cryptocurrency investigation — from first alert to courtroom exhibit — handled inside a single
            hardened environment.
          </p>
        </Reveal>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {modules.map((m, i) => {
            const Icon = moduleIcons[m.key] ?? IconGraph
            return (
              <Reveal key={m.key} delay={(i % 3) * 90}>
                <div className="group glass glass-hover edge-accent block h-full rounded-md p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <span className="grid h-10 w-10 place-items-center rounded-md border border-line bg-surface/60 text-accent transition-colors group-hover:border-accent/40 group-hover:bg-accent/10">
                      <Icon size={19} />
                    </span>
                    <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <div className="font-display text-[15.5px] font-700 tracking-tight text-ink">{m.label}</div>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{m.desc}</p>
                </div>
              </Reveal>
            )
          })}
        </div>
      </section>

      {/* Interactive platform explorer */}
      <section className="border-t border-line bg-base/60">
        <div className="mx-auto max-w-[1240px] px-5 py-20">
          <Reveal className="mb-4 max-w-2xl">
            <div className="mb-2 font-mono text-[11px] uppercase tracking-[0.2em] text-accent">Platform · interactive</div>
            <h2 className="font-display text-[34px] font-800 tracking-[-0.02em] text-ink">See the four core surfaces in motion</h2>
            <p className="mt-3 text-[14.5px] text-muted">
              Investigate, monitor, screen and automate — the same primitives that power Chainalysis Reactor and TRM
              Forensics, rebuilt inside a sovereign Indian deployment. Switch views to explore each surface.
            </p>
          </Reveal>
          <Reveal>
            <PlatformExplorer />
          </Reveal>
        </div>
      </section>

      {/* Product suite */}
      <section className="border-t border-line">
        <div className="mx-auto max-w-[1240px] px-5 py-20">
          <Reveal className="mb-10 max-w-2xl">
            <div className="mb-2 font-mono text-[11px] uppercase tracking-[0.2em] text-accent">Product suite</div>
            <h2 className="font-display text-[34px] font-800 tracking-[-0.02em] text-ink">A full-spectrum intelligence stack</h2>
            <p className="mt-3 text-[14.5px] text-muted">
              Every capability financial-crime units expect from best-in-class platforms — attribution, screening,
              monitoring, forensics, incident response and threat intelligence — under one accreditation boundary.
            </p>
          </Reveal>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { t: "Forensics & tracing", d: "Cross-chain path reconstruction through mixers, bridges and peel chains with automated hop discovery.", Icon: IconChain, tag: "TRACE" },
              { t: "Transaction monitoring", d: "Continuous KYT scoring on inflows, outflows and swaps against attribution and illicit-actor data.", Icon: IconEye, tag: "KYT" },
              { t: "Wallet & address screening", d: "Sub-second pre-engagement risk checks over a hardened API with sanctions and exposure flags.", Icon: IconChain, tag: "API" },
              { t: "Entity due diligence", d: "Screen, assess and continuously monitor VASPs and counterparties across their address universe.", Icon: IconEntity, tag: "EDD" },
              { t: "Attribution & clustering", d: "Group addresses to real-world actors — exchanges, mixers, bridges, markets — with confidence scores.", Icon: IconFingerprint, tag: "GRAPH" },
              { t: "Playbook automation", d: "Codify analyst workflows that trigger on risk, enrich alerts, route cases and draft actions.", Icon: IconBolt, tag: "AUTO" },
              { t: "Crypto incident response", d: "Rapid tracing and freeze coordination for live theft, ransomware and fraud events.", Icon: IconIncident, tag: "IR" },
              { t: "Threat intelligence feeds", d: "Curated IOC libraries — ransomware, darknet, scam and sanctions — updated continuously.", Icon: IconFlag, tag: "INTEL" },
              { t: "Seed & device analysis", d: "Recover wallet keys and reconstruct holdings from lawfully seized devices in the field.", Icon: IconVault, tag: "SEIZE" },
            ].map((p, i) => (
              <Reveal key={p.t} delay={(i % 3) * 80}>
                <SpotCard className="p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <span className="grid h-10 w-10 place-items-center rounded-md border border-line bg-surface/60 text-accent">
                      <p.Icon size={19} />
                    </span>
                    <span className="font-mono text-[9.5px] uppercase tracking-[0.16em] text-faint">{p.tag}</span>
                  </div>
                  <div className="font-display text-[15.5px] font-700 tracking-tight text-ink">{p.t}</div>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{p.d}</p>
                </SpotCard>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Feature deep-dive */}
      <section id="platform" className="border-t border-line bg-base2/30">
        <div className="mx-auto max-w-[1240px] space-y-24 px-5 py-24">
          <FeatureRow
            eyebrow="Real-time monitoring · KYT"
            title="Know every transaction the moment it moves"
            desc="Continuous Know-Your-Transaction screening across the chains you monitor. LEAtTrace scores every transfer against entity-attribution databases and illicit-actor lists — before, during and after funds move."
            points={[
              "Streaming risk scores on inflows, outflows and swaps",
              "Behavioural analytics tuned to cut alert noise",
              "Auto-escalation of critical exposures to case teams",
              "Coverage across 50+ blockchains and 10,000+ assets",
            ]}
            visual={<KytMock />}
          />
          <FeatureRow
            flip
            eyebrow="Attribution & clustering"
            title="Turn anonymous addresses into named entities"
            desc="Heuristic clustering groups the addresses controlled by a single actor and maps them to real-world entities — exchanges, mixers, bridges, marketplaces and threat actors — enriched with off-chain and OSINT intelligence."
            points={[
              "Co-spend and behavioural clustering heuristics",
              "Entity labels for exchanges, mixers, bridges and actors",
              "Enrichment from sanctions lists and LE databases",
              "Confidence scoring on every attribution",
            ]}
            visual={<AttributionMock />}
          />
          <FeatureRow
            eyebrow="Sanctions & illicit screening"
            title="Screen against sanctions and illicit-actor lists"
            desc="Every counterparty is continuously screened for exposure to sanctioned addresses, ransomware wallets, darknet markets, mixing services and high-risk jurisdictions — aligned to FATF Recommendation 15."
            points={[
              "OFAC / UN / domestic sanctions list matching",
              "Ransomware and darknet IOC libraries",
              "Mixer, tumbler and cross-chain obfuscation flags",
              "Jurisdiction risk with configurable thresholds",
            ]}
            visual={<SanctionsMock />}
          />
          <FeatureRow
            flip
            eyebrow="Cross-chain forensics"
            title="Follow funds across chains and bridges"
            desc="Assets rarely stay on one chain. LEAtTrace reconstructs the full journey as funds hop through bridges, wrapped tokens and DEX swaps — stitching a single narrative from many ledgers."
            points={[
              "Automatic bridge and wrapped-asset resolution",
              "DEX and DeFi swap tracing with contract labels",
              "Unified timeline across Bitcoin, EVM and Solana ecosystems",
              "Value reconciliation at every cross-chain hop",
            ]}
            visual={<BridgeMock />}
          />
          <FeatureRow
            eyebrow="Automation · Playbooks"
            title="Let playbooks do the first pass"
            desc="Encode the exact steps your best analysts take. Playbooks watch risk thresholds, enrich alerts with attribution, route cases to the right desk and draft freeze requests — so investigators start from a warm file, not a blank one."
            points={[
              "Trigger on composite risk score or custom rules",
              "Auto-enrichment with attribution and sanctions exposure",
              "Case routing to EOW, cyber or MLAT queues",
              "Every automated action written to the audit trail",
            ]}
            visual={<PlaybookMock />}
          />
        </div>
      </section>

      {/* Interactive risk engine */}
      <section className="border-t border-line">
        <div className="mx-auto max-w-[1240px] px-5 py-20">
          <div className="grid items-center gap-12 lg:grid-cols-[0.9fr_1.1fr]">
            <Reveal>
              <div className="mb-2 font-mono text-[11px] uppercase tracking-[0.2em] text-accent">Explainable scoring</div>
              <h2 className="font-display text-[32px] font-800 tracking-[-0.02em] text-ink">Every score is defensible</h2>
              <p className="mt-3 max-w-md text-[14.5px] leading-relaxed text-muted">
                No black boxes. Each risk score decomposes into weighted, auditable signals an analyst — and a court —
                can follow. Adjust the exposure and watch the composite respond.
              </p>
            </Reveal>
            <Reveal delay={120}>
              <div className="glass rounded-lg p-7">
                <RiskGauge />
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Workflow */}
      <section id="workflow" className="border-y border-line bg-base2/40">
        <div className="mx-auto max-w-[1240px] px-5 py-20">
          <Reveal className="mb-12 max-w-2xl">
            <div className="mb-2 font-mono text-[11px] uppercase tracking-[0.2em] text-accent">How it works</div>
            <h2 className="font-display text-[34px] font-800 tracking-[-0.02em] text-ink">From first alert to conviction</h2>
          </Reveal>
          <div className="grid gap-6 md:grid-cols-4">
            {[
              { n: "01", t: "Ingest", d: "Sync 9 chains and exchange feeds. Auto-normalise transactions in real time.", Icon: IconLayers },
              { n: "02", t: "Trace", d: "Follow funds through mixers and peel chains with heuristic clustering.", Icon: IconChain },
              { n: "03", t: "Correlate", d: "Attribute wallets to entities and cross-reference intelligence & OSINT.", Icon: IconEntity },
              { n: "04", t: "Report", d: "Seal evidence with chain of custody and export court-ready dossiers.", Icon: IconReport },
            ].map((s, i) => (
              <Reveal key={s.n} delay={i * 100} className="relative">
                <div className="glass glass-hover h-full rounded-md p-5">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="font-display text-[28px] font-700 text-line2">{s.n}</span>
                    <s.Icon size={22} className="text-accent" />
                  </div>
                  <div className="font-display text-[17px] font-600 text-ink">{s.t}</div>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{s.d}</p>
                </div>
                {i < 3 && (
                  <IconArrow size={18} className="absolute -right-4 top-1/2 hidden -translate-y-1/2 text-accent/50 md:block" />
                )}
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Risk engine & typologies */}
      <section className="mx-auto max-w-[1240px] px-5 py-24">
        <Reveal className="mb-12 text-center">
          <div className="mb-2 font-mono text-[11px] uppercase tracking-[0.2em] text-accent">Risk engine</div>
          <h2 className="font-display text-[34px] font-800 tracking-[-0.02em] text-ink">Detection tuned for financial crime typologies</h2>
          <p className="mx-auto mt-3 max-w-2xl text-[14.5px] text-muted">
            The engine ingests on-chain data, applies behavioural heuristics and surfaces the laundering patterns
            investigators actually chase.
          </p>
        </Reveal>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { t: "Structuring", d: "Many small transfers below reporting thresholds.", Icon: IconLayers },
            { t: "Layering & peel chains", d: "Rapid multi-hop splits to break the trail.", Icon: IconChain },
            { t: "Mixer / tumbler use", d: "Funds routed through obfuscation services.", Icon: IconBolt },
            { t: "Cross-chain obfuscation", d: "Bridging assets across chains to hide origin.", Icon: IconGlobe },
            { t: "Sanctions evasion", d: "Exposure to sanctioned addresses and entities.", Icon: IconFlag },
            { t: "Darknet & ransomware", d: "Payments to markets and ransomware wallets.", Icon: IconEye },
          ].map((x, i) => (
            <Reveal key={x.t} delay={(i % 3) * 90}>
              <div className="glass glass-hover sheen h-full rounded-md p-5">
                <div className="mb-3 flex items-center justify-between">
                  <span className="grid h-10 w-10 place-items-center rounded-lg bg-accent/10 text-accent">
                    <x.Icon size={19} />
                  </span>
                  <span className="font-mono text-[10.5px] uppercase tracking-wider text-faint">typology</span>
                </div>
                <div className="font-display text-[16px] font-600 text-ink">{x.t}</div>
                <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{x.d}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Metrics */}
      <section className="relative overflow-hidden border-y border-line bg-base2/30">
        <div className="absolute inset-0 grid-bg opacity-40" />
        <div className="relative mx-auto grid max-w-[1240px] grid-cols-2 divide-x divide-y divide-line border-x border-line md:grid-cols-4 md:divide-y-0">
          {[
            { v: 1240, prefix: "₹", suffix: " Cr", l: "Assets traced" },
            { v: 18400, suffix: "+", l: "Wallets clustered" },
            { v: 50, suffix: "+", l: "Chains supported" },
            { v: 640, l: "Cases resolved" },
          ].map((s) => (
            <Reveal key={s.l} className="px-6 py-12">
              <CountUp
                value={s.v}
                prefix={s.prefix}
                suffix={s.suffix}
                className="font-display text-[32px] font-800 tracking-tight text-ink md:text-[40px]"
              />
              <div className="mt-2 font-mono text-[11px] uppercase tracking-[0.14em] text-faint">{s.l}</div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Case spotlight */}
      <section className="mx-auto max-w-[1240px] px-5 py-24">
        <Reveal>
          <div className="glass relative overflow-hidden rounded-lg p-8 lg:p-12">
            <div className="relative grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:items-center">
              <div>
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-line bg-surface/60 px-3 py-1 font-mono text-[11px] text-accent">
                  CASE SPOTLIGHT · LT-2026-0491
                </div>
                <h2 className="font-display text-[28px] font-700 leading-tight tracking-tight text-ink lg:text-[34px]">
                  Operation Dark Ledger: ₹142 Cr traced across six hops
                </h2>
                <p className="mt-4 max-w-xl text-[14.5px] leading-relaxed text-muted">
                  A ransomware-linked cluster laundered funds through a sanctioned mixer before attempting cash-out at a
                  KYC exchange. LEAtTrace mapped the full flow, attributed the exchange endpoint and produced a
                  court-ready dossier in under 48 hours — enabling a freeze request and asset seizure.
                </p>
                <div className="mt-7 grid grid-cols-3 gap-4">
                  {[
                    ["Funds traced", "31.9 BTC"],
                    ["Time to dossier", "< 48h"],
                    ["Hops mapped", "6"],
                  ].map(([l, v]) => (
                    <div key={l}>
                      <div className="font-display text-[22px] font-700 text-accent">{v}</div>
                      <div className="mt-0.5 font-mono text-[10.5px] uppercase tracking-wider text-faint">{l}</div>
                    </div>
                  ))}
                </div>
                <a href="#platform" className="mt-7 inline-block">
                  <Button variant="outline">
                    Explore the trace graph <IconArrow size={15} />
                  </Button>
                </a>
              </div>
              <div className="rounded-md border border-line bg-base2/50 p-4">
                <div className="mb-3 space-y-2.5">
                  {[
                    ["Victim wallet", "6.0 BTC", "ok"],
                    ["Peel chain (31 hops)", "5.9 BTC", "warn"],
                    ["Sanctioned mixer", "15.5 BTC", "danger"],
                    ["Suspect wallet", "12.4 BTC", "danger"],
                    ["QuadX cash-out", "seized", "ok"],
                  ].map(([l, v, tone], i) => (
                    <div key={l} className="flex items-center gap-3">
                      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-line bg-surface font-mono text-[11px] text-muted">
                        {i + 1}
                      </span>
                      <span className="text-[13px] text-ink2">{l}</span>
                      <span
                        className={`ml-auto font-mono text-[12px] ${
                          tone === "danger" ? "text-danger" : tone === "warn" ? "text-warn" : "text-ok"
                        }`}
                      >
                        {v}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* Security */}
      <section id="security" className="border-y border-line bg-base2/40">
        <div className="mx-auto grid max-w-[1240px] items-center gap-12 px-5 py-20 lg:grid-cols-2">
          <Reveal>
            <div className="mb-2 font-mono text-[11px] uppercase tracking-[0.2em] text-accent">Security &amp; compliance</div>
            <h2 className="font-display text-[34px] font-800 tracking-[-0.02em] text-ink">Built to the standard evidence demands</h2>
            <p className="mt-3 text-[14.5px] text-muted">
              LEAtTrace runs inside a sovereign, access-controlled environment. Every action is logged, every artifact
              hashed, every export defensible in court.
            </p>
            <div className="mt-7 space-y-3">
              {[
                ["End-to-end AES-256 encryption at rest and in transit", "encryption"],
                ["Tamper-evident evidence vault with SHA-256 chain of custody", "custody"],
                ["Role-based access control with mandatory 2FA and clearance tiers", "rbac"],
                ["Immutable audit trail of every query, export and escalation", "audit"],
                ["Data residency within Indian jurisdiction, air-gapped deployment", "residency"],
              ].map(([t, k]) => (
                <div key={k} className="flex items-start gap-3">
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-ok/15 text-ok">
                    <IconCheck size={13} />
                  </span>
                  <span className="text-[13.5px] text-ink2">{t}</span>
                </div>
              ))}
            </div>
          </Reveal>
          <div className="grid grid-cols-2 gap-4">
            {[
              { Icon: IconLock, t: "AES-256", d: "Encryption everywhere" },
              { Icon: IconFingerprint, t: "RBAC + 2FA", d: "Clearance-tiered access" },
              { Icon: IconVault, t: "Chain of custody", d: "Court-admissible" },
              { Icon: IconLogs, t: "Full audit trail", d: "Immutable logging" },
            ].map((c, i) => (
              <Reveal key={c.t} delay={i * 90}>
                <div className="glass glass-hover sheen h-full rounded-md p-5">
                  <c.Icon size={24} className="text-accent" />
                  <div className="mt-4 font-display text-[16px] font-600 text-ink">{c.t}</div>
                  <div className="mt-1 text-[12.5px] text-muted">{c.d}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Integrations & API */}
      <section className="mx-auto max-w-[1240px] px-5 py-24">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <Reveal>
            <div className="mb-2 font-mono text-[11px] uppercase tracking-[0.2em] text-accent">Integrations &amp; API</div>
            <h2 className="font-display text-[34px] font-800 tracking-[-0.02em] text-ink">Fits into the workflows your teams already use</h2>
            <p className="mt-3 max-w-lg text-[14.5px] leading-relaxed text-muted">
              Push alerts to case management, pull risk scores over a secure REST API, and sync intelligence feeds — all
              inside your sovereign deployment.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              {[
                ["REST & GraphQL API", IconChain],
                ["STR / SAR filing hooks", IconReport],
                ["FIU-IND & MLAT desks", IconUsers],
                ["Chainalysis / TRM feeds", IconGlobe],
                ["SIEM & SOC webhooks", IconSoc],
                ["Bulk CSV import/export", IconLayers],
              ].map(([t, Ic]) => {
                const Icon = Ic as any
                return (
                  <div key={t as string} className="flex items-center gap-2.5 rounded-lg border border-line bg-surface/60 px-3 py-2.5 backdrop-blur-sm">
                    <Icon size={16} className="text-accent" />
                    <span className="text-[12.5px] text-ink2">{t as string}</span>
                  </div>
                )
              })}
            </div>
          </Reveal>
          <Reveal delay={120}>
            <div className="glass overflow-hidden rounded-lg">
              <div className="flex items-center gap-2 border-b border-line px-4 py-2.5">
                <span className="h-2.5 w-2.5 rounded-full bg-danger/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-warn/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-ok/70" />
                <span className="ml-2 font-mono text-[11px] text-faint">POST /v1/screening/address</span>
              </div>
              <pre className="overflow-x-auto p-4 font-mono text-[12px] leading-relaxed text-ink2">
{`curl -X POST https://api.leattrace.gov.in/v1/screening/address \\
  -H "Authorization: Bearer $LT_TOKEN" \\
  -d '{ "address": "bc1q9x2f0h8v3k…7f2", "chain": "bitcoin" }'

`}<span className="text-ok">{`{
  "address": "bc1q9x…7f2",
  "risk_score": `}</span><span className="text-danger">94</span><span className="text-ok">{`,
  "flags": [`}</span><span className="text-warn">{`"sanctioned_mixer"`}</span><span className="text-ok">{`, `}</span><span className="text-warn">{`"ransomware_ioc"`}</span><span className="text-ok">{`],
  "entity": "Tornado Cluster A",
  "exposure_inr": "8.9 Cr"
}`}</span>
              </pre>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Comparison */}
      <section className="border-y border-line bg-base2/40">
        <div className="mx-auto max-w-[1240px] px-5 py-24">
          <Reveal className="mb-10 max-w-2xl">
            <div className="mb-2 font-mono text-[11px] uppercase tracking-[0.2em] text-accent">The difference</div>
            <h2 className="font-display text-[34px] font-800 tracking-[-0.02em] text-ink">Manual tracing vs. LEAtTrace</h2>
            <p className="mt-3 text-[14.5px] text-muted">
              What used to take a spreadsheet, three block explorers and weeks of correlation now happens inside one
              accredited console.
            </p>
          </Reveal>
          <Reveal>
            <div className="glass overflow-hidden rounded-lg">
              <div className="grid grid-cols-[1.4fr_1fr_1fr] border-b border-line bg-surface/40 font-mono text-[10.5px] uppercase tracking-[0.14em] text-faint">
                <div className="px-5 py-3.5">Capability</div>
                <div className="px-5 py-3.5">Manual investigation</div>
                <div className="px-5 py-3.5 text-accent">LEAtTrace</div>
              </div>
              {[
                ["Multi-chain trace", "Explorer-by-explorer, hours per hop", "Unified graph, seconds"],
                ["Entity attribution", "Guesswork and open forums", "Clustered + labelled with confidence"],
                ["Sanctions screening", "Manual list lookups", "Continuous, FATF R.15 aligned"],
                ["Cross-chain bridges", "Trail usually lost", "Auto-resolved end to end"],
                ["Evidence integrity", "Screenshots, no custody", "SHA-256 sealed, court-ready"],
                ["Time to dossier", "Weeks", "Under 48 hours"],
              ].map((r, i) => (
                <div
                  key={r[0]}
                  className={`grid grid-cols-[1.4fr_1fr_1fr] items-center text-[13px] transition-colors hover:bg-surface/40 ${
                    i > 0 ? "border-t border-line/60" : ""
                  }`}
                >
                  <div className="px-5 py-4 font-600 text-ink">{r[0]}</div>
                  <div className="flex items-center gap-2 px-5 py-4 text-muted">
                    <IconX size={14} className="shrink-0 text-danger/70" /> {r[1]}
                  </div>
                  <div className="flex items-center gap-2 px-5 py-4 text-ink2">
                    <IconCheck size={14} className="shrink-0 text-ok" /> {r[2]}
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* Deployment / onboarding */}
      <section className="mx-auto max-w-[1240px] px-5 py-24">
        <Reveal className="mb-12 max-w-2xl">
          <div className="mb-2 font-mono text-[11px] uppercase tracking-[0.2em] text-accent">Deployment</div>
          <h2 className="font-display text-[34px] font-800 tracking-[-0.02em] text-ink">From accreditation to operational in weeks</h2>
        </Reveal>
        <div className="relative">
          <div className="absolute left-0 right-0 top-[22px] hidden h-px bg-line md:block" />
          <div className="grid gap-8 md:grid-cols-4">
            {[
              { n: "W1", t: "Accreditation", d: "Agency credentials verified, clearance tiers and RBAC roles provisioned.", Icon: IconFingerprint },
              { n: "W2", t: "Sovereign deploy", d: "Environment stood up in-jurisdiction with optional air-gapped mirror.", Icon: IconGlobe },
              { n: "W3", t: "Feeds & training", d: "Chain feeds synced, intel libraries loaded, investigators trained.", Icon: IconLayers },
              { n: "W4", t: "Live operations", d: "First cases opened with full audit trail and support desk on call.", Icon: IconBolt },
            ].map((s, i) => (
              <Reveal key={s.n} delay={i * 100} className="relative">
                <div className="relative z-10 mb-4 grid h-11 w-11 place-items-center rounded-full border border-accent/40 bg-base font-mono text-[12px] font-600 text-accent">
                  {s.n}
                </div>
                <div className="flex items-center gap-2">
                  <s.Icon size={16} className="text-accent" />
                  <div className="font-display text-[16px] font-600 text-ink">{s.t}</div>
                </div>
                <p className="mt-2 text-[13px] leading-relaxed text-muted">{s.d}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Coverage */}
      <section id="coverage" className="mx-auto max-w-[1240px] px-5 py-20">
        <Reveal className="mb-8 text-center">
          <div className="mb-2 font-mono text-[11px] uppercase tracking-[0.2em] text-accent">Coverage</div>
          <h2 className="font-display text-[30px] font-800 tracking-[-0.02em] text-ink">50+ blockchains. 10,000+ assets. One investigation.</h2>
          <p className="mx-auto mt-3 max-w-xl text-[14px] text-muted">
            Native tracing across major chains, stablecoins, bridges and privacy coins — with new networks added
            continuously.
          </p>
        </Reveal>
        <Reveal className="flex flex-wrap justify-center gap-3">
          {["Bitcoin", "Ethereum", "Tron", "BNB Chain", "Monero", "Polygon", "Solana", "Litecoin", "Arbitrum", "Optimism", "Avalanche", "Ripple (XRP)", "USDT", "USDC", "DAI", "Bitcoin Cash", "Dogecoin", "+ 40 more"].map(
            (c) => (
              <span
                key={c}
                className="cursor-default rounded-full border border-line bg-surface/60 px-4 py-2 font-mono text-[12.5px] text-ink2 backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:border-accent/50 hover:text-accent hover:shadow-[0_0_18px_-6px] hover:shadow-accent/70"
              >
                {c}
              </span>
            ),
          )}
        </Reveal>
        <div className="marquee-group edge-fade-x mt-10 overflow-hidden">
          <div className="marquee marquee-slow gap-3">
            {[0, 1].flatMap((copy) =>
              ["Bitcoin", "Ethereum", "Tron", "BNB Chain", "Monero", "Polygon", "Solana", "Litecoin", "Arbitrum", "Optimism", "Avalanche", "Ripple", "Base", "Cardano", "Stellar", "Zcash"].map((c) => (
                <span key={`${copy}-${c}`} className="shrink-0 rounded-md border border-line bg-surface/40 px-4 py-2 font-mono text-[12px] text-muted">
                  {c}
                </span>
              )),
            )}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="border-y border-line bg-base2/40">
        <div className="mx-auto max-w-[1240px] px-5 py-24">
          <Reveal className="mb-12 text-center">
            <div className="mb-2 font-mono text-[11px] uppercase tracking-[0.2em] text-accent">Field reports</div>
            <h2 className="font-display text-[34px] font-800 tracking-[-0.02em] text-ink">Trusted by investigators on the front line</h2>
          </Reveal>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              {
                q: "We closed a cross-border laundering case in days, not months. The attribution alone saved weeks of manual tracing.",
                n: "Sr. Investigator",
                r: "CBI — Economic Offences Wing",
              },
              {
                q: "Real-time alerts on watchlisted wallets let us act before the funds cashed out. That is the difference between recovery and a dead end.",
                n: "Cyber Crime Officer",
                r: "I4C — MHA",
              },
              {
                q: "Court-ready dossiers with a full chain of custody made the evidence hold up. Prosecution was straightforward.",
                n: "Legal Cell Lead",
                r: "State Cyber Police",
              },
            ].map((t, i) => (
              <Reveal key={t.r} delay={i * 100}>
                <div className="glass glass-hover flex h-full flex-col rounded-md p-6">
                  <div className="font-display text-[40px] leading-none text-accent/40">&ldquo;</div>
                  <p className="-mt-3 flex-1 text-[13.5px] leading-relaxed text-ink2">{t.q}</p>
                  <div className="mt-5 border-t border-line pt-4">
                    <div className="text-[13px] font-600 text-ink">{t.n}</div>
                    <div className="font-mono text-[11px] text-faint">{t.r}</div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-[900px] px-5 py-24">
        <Reveal className="mb-10 text-center">
          <div className="mb-2 font-mono text-[11px] uppercase tracking-[0.2em] text-accent">FAQ</div>
          <h2 className="font-display text-[32px] font-800 tracking-[-0.02em] text-ink">Questions, answered</h2>
        </Reveal>
        <Reveal className="space-y-3">
          {[
            {
              q: "Who can access LEAtTrace?",
              a: "Access is restricted to authorised law-enforcement and regulatory personnel with valid agency credentials and the required clearance tier. Every account is provisioned through role-based access control with mandatory two-factor authentication.",
            },
            {
              q: "Which blockchains and assets are supported?",
              a: "LEAtTrace natively traces 50+ blockchains and 10,000+ assets, including Bitcoin, Ethereum, Tron, major L2s, stablecoins, bridges and privacy coins. New networks are added continuously.",
            },
            {
              q: "Is the evidence admissible in court?",
              a: "Yes. Every artifact is SHA-256 hashed and stored in a tamper-evident vault with a complete chain of custody. Exports are cryptographically signed and logged to an immutable audit trail.",
            },
            {
              q: "Where is data stored?",
              a: "Deployments are sovereign and remain within Indian jurisdiction, with an air-gapped on-premise mirror option — aligned to MeitY data-localisation and CERT-In directives.",
            },
            {
              q: "How does LEAtTrace align with AML/CFT regulation?",
              a: "Screening and typology detection align with FATF Recommendation 15 and support STR/SAR workflows with direct hooks into FIU-IND and MLAT desks.",
            },
          ].map((f) => (
            <FaqItem key={f.q} q={f.q} a={f.a} />
          ))}
        </Reveal>
      </section>

      {/* Compliance band */}
      <section className="border-y border-line bg-base2/40">
        <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-center gap-x-10 gap-y-4 px-5 py-8">
          <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-faint">Aligned with</span>
          {["FATF Recommendation 15", "FIU-IND", "CERT-In", "MeitY Localisation", "PMLA 2002"].map((c) => (
            <span key={c} className="flex items-center gap-2 font-display text-[13.5px] font-600 text-ink2">
              <IconCheck size={14} className="text-ok" /> {c}
            </span>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section id="access" className="relative overflow-hidden border-t border-line bg-base2/30">
        <div className="absolute inset-0 grid-bg opacity-30" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent" />
        <Reveal as="div" className="relative mx-auto max-w-[760px] px-5 py-24 text-center">
          <div className="mb-4 font-mono text-[11px] uppercase tracking-[0.2em] text-accent">Restricted access</div>
          <h2 className="font-display text-[36px] font-800 leading-[1.05] tracking-[-0.02em] text-ink lg:text-[46px]">
            Trace the untraceable.
          </h2>
          <p className="mx-auto mt-5 max-w-lg text-[15px] leading-relaxed text-ink2">
            LEAtTrace is provisioned only for authorised law-enforcement and regulatory personnel. Request access with your
            agency credentials to begin onboarding.
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            {isOfficerLoggedIn ? (
              <Button onClick={onReturnToConsole}>
                Open Command Console <IconArrow size={16} />
              </Button>
            ) : (
              <Button onClick={onLogin}>
                Officer Login / Launch Console <IconArrow size={16} />
              </Button>
            )}
            <a href="mailto:access@leattrace.gov.in">
              <Button variant="outline">
                Official Agency Request <IconExternal size={15} />
              </Button>
            </a>
          </div>
        </Reveal>
      </section>

      {/* Footer */}
      <footer className="border-t border-line bg-base2/60">
        <div className="mx-auto max-w-[1240px] px-5 py-12">
          <div className="flex flex-wrap items-start justify-between gap-8">
            <div className="max-w-sm">
              <Wordmark subtitle="BLOCKCHAIN INTELLIGENCE" />
              <p className="mt-4 text-[12.5px] leading-relaxed text-faint">
                A restricted investigative platform operated for the Central Bureau of Investigation and the Indian
                Cybercrime Coordination Centre (I4C), Ministry of Home Affairs.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-x-14 gap-y-2 sm:grid-cols-3">
              {([
                ["Platform", [
                  ["Capabilities", "#capabilities"],
                  ["Coverage", "#coverage"],
                  ["Security", "#security"],
                  ["Request access", "#access"],
                ]],
                ["Agency", [
                  ["Workflow", "#workflow"],
                  ["Field reports", "#platform"],
                  ["MLAT desk", "mailto:mlat@leattrace.gov.in"],
                  ["Onboarding", "#access"],
                ]],
                ["Legal", [
                  ["Access policy", "#access"],
                  ["Data handling", "#security"],
                  ["Compliance", "#faq"],
                  ["Contact", "mailto:access@leattrace.gov.in"],
                ]],
              ] as [string, [string, string][]][]).map(([h, items]) => (
                <div key={h}>
                  <div className="mb-3 font-mono text-[10.5px] uppercase tracking-[0.16em] text-faint">{h}</div>
                  <ul className="space-y-2">
                    {items.map(([label, href]) => (
                      <li key={label}>
                        <a href={href} className="text-[13px] text-ink2 transition-colors hover:text-accent">
                          {label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-6 font-mono text-[11px] text-faint">
            <span>© 2026 LEAtTrace · Government of India. Restricted use.</span>
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-ok" /> All systems operational
            </span>
          </div>
        </div>
      </footer>
    </div>
  )
}


export default LandingPage;
