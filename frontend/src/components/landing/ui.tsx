import { useState, type ReactNode } from "react"
import { CyberShieldLogo } from "../CyberShieldLogo"

/* ---------- Brand ---------- */
export function Logo({ size = 34 }: { size?: number }) {
  return (
    <CyberShieldLogo
      size={size}
      className="drop-shadow-[0_0_12px_rgba(34,211,238,0.5)] transition-transform duration-200 hover:scale-105"
    />
  )
}

export function Wordmark({ subtitle = "CBI & I4C PORTAL", size = 34 }: { subtitle?: string; size?: number }) {
  return (
    <div className="flex items-center gap-2.5">
      <Logo size={size} />
      <div className="leading-none">
        <div className="font-display text-[17px] font-700 tracking-wide text-ink">
          LE<span className="text-accent">At</span>Trace
        </div>
        <div className="mt-1 font-mono text-[9px] tracking-[0.22em] text-faint">{subtitle}</div>
      </div>
    </div>
  )
}

/* ---------- Surfaces ---------- */
export function Card({
  children,
  className = "",
  as: As = "div",
}: {
  children: ReactNode
  className?: string
  as?: any
}) {
  return (
    <As className={`panel rounded-xl ${className}`}>{children}</As>
  )
}

export function Mono({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <span className={`font-mono text-[12.5px] text-ink2 ${className}`}>{children}</span>
}

/* ---------- Status + risk ---------- */
const statusMap: Record<string, string> = {
  active: "text-accent bg-accent/10 border-accent/25",
  pending: "text-warn bg-warn/10 border-warn/25",
  closed: "text-muted bg-muted/10 border-muted/20",
  escalated: "text-danger bg-danger/10 border-danger/25",
  final: "text-ok bg-ok/10 border-ok/25",
  review: "text-warn bg-warn/10 border-warn/25",
  draft: "text-muted bg-muted/10 border-muted/20",
  verified: "text-ok bg-ok/10 border-ok/25",
  sealed: "text-accent bg-accent/10 border-accent/25",
}

export function StatusPill({ status }: { status: string }) {
  const cls = statusMap[status] ?? "text-muted bg-muted/10 border-muted/20"
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[10.5px] uppercase tracking-wider ${cls}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </span>
  )
}

export function severityColor(sev: string) {
  return sev === "critical"
    ? "text-danger"
    : sev === "high"
      ? "text-warn"
      : sev === "medium"
        ? "text-accent"
        : "text-muted"
}

export function RiskBadge({ score }: { score: number }) {
  const tone = score >= 80 ? "danger" : score >= 55 ? "warn" : "ok"
  const cls =
    tone === "danger" ? "text-danger border-danger/30 bg-danger/10" : tone === "warn" ? "text-warn border-warn/30 bg-warn/10" : "text-ok border-ok/30 bg-ok/10"
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 font-mono text-[11px] ${cls}`}>
      <span className="opacity-70">RISK</span>
      {score}
    </span>
  )
}

/* ---------- Stat tile ---------- */
export function StatTile({
  label,
  value,
  delta,
  hint,
  icon,
  tone = "accent",
}: {
  label: string
  value: string
  delta?: string
  hint?: string
  icon?: ReactNode
  tone?: "accent" | "danger" | "warn" | "ok"
}) {
  const toneCls = { accent: "text-accent", danger: "text-danger", warn: "text-warn", ok: "text-ok" }[tone]
  return (
    <Card className="relative overflow-hidden p-4">
      <div className="flex items-start justify-between">
        <span className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-faint">{label}</span>
        {icon && <span className={`${toneCls} opacity-80`}>{icon}</span>}
      </div>
      <div className="mt-3 font-display text-[26px] font-600 leading-none text-ink">{value}</div>
      <div className="mt-2 flex items-center gap-2 text-[12px]">
        {delta && <span className={toneCls}>{delta}</span>}
        {hint && <span className="text-faint">{hint}</span>}
      </div>
      <div className={`pointer-events-none absolute -right-6 -top-6 h-16 w-16 rounded-full ${toneCls} opacity-[0.07] blur-lg bg-current`} />
    </Card>
  )
}

/* ---------- Page header ---------- */
export function PageHeader({
  title,
  eyebrow,
  desc,
  actions,
}: {
  title: string
  eyebrow?: string
  desc?: string
  actions?: ReactNode
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && <div className="mb-1.5 font-mono text-[11px] uppercase tracking-[0.2em] text-accent">{eyebrow}</div>}
        <h1 className="font-display text-[26px] font-600 tracking-tight text-ink">{title}</h1>
        {desc && <p className="mt-1.5 max-w-2xl text-[13.5px] text-muted">{desc}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="mb-3 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-faint">
      <span className="h-3 w-0.5 bg-accent" />
      {children}
    </div>
  )
}

/* ---------- Button ---------- */
export function Button({
  children,
  variant = "primary",
  size = "md",
  className = "",
  onClick,
  type = "button",
}: {
  children: ReactNode
  variant?: "primary" | "ghost" | "outline" | "danger"
  size?: "sm" | "md"
  className?: string
  onClick?: () => void
  type?: "button" | "submit"
}) {
  const base = "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-all duration-150 whitespace-nowrap cursor-pointer"
  const sizes = { sm: "px-3 py-1.5 text-[12.5px]", md: "px-4 py-2.5 text-[13.5px]" }[size]
  const variants = {
    primary: "bg-accent text-[#070b14] font-600 hover:bg-accent2 shadow-sm",
    ghost: "text-ink2 hover:bg-surface3 hover:text-ink",
    outline: "border border-line2 text-ink2 hover:border-accent/50 hover:text-ink",
    danger: "bg-danger/15 text-danger border border-danger/30 hover:bg-danger/25",
  }[variant]
  return (
    <button type={type} onClick={onClick} className={`${base} ${sizes} ${variants} ${className}`}>
      {children}
    </button>
  )
}

/* ---------- Progress ---------- */
export function Progress({ value, tone = "accent" }: { value: number; tone?: "accent" | "danger" | "warn" | "ok" }) {
  const bar = { accent: "bg-accent", danger: "bg-danger", warn: "bg-warn", ok: "bg-ok" }[tone]
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface3">
      <div className={`h-full rounded-full ${bar}`} style={{ width: `${value}%` }} />
    </div>
  )
}

/* ---------- Tabs ---------- */
export function Tabs({ tabs, value, onChange }: { tabs: string[]; value: string; onChange: (t: string) => void }) {
  return (
    <div className="inline-flex items-center gap-1 rounded-lg border border-line bg-surface p-1">
      {tabs.map((t) => (
        <button
          key={t}
          onClick={() => onChange(t)}
          className={`rounded-md px-3 py-1.5 text-[12.5px] font-medium transition-colors cursor-pointer ${
            value === t ? "bg-surface3 text-ink" : "text-muted hover:text-ink2"
          }`}
        >
          {t}
        </button>
      ))}
    </div>
  )
}

/* ---------- DataTable ---------- */
export type Column<T> = {
  key: string
  header: string
  render?: (row: T) => ReactNode
  className?: string
  align?: "left" | "right" | "center"
}

export function DataTable<T extends Record<string, any>>({
  columns,
  rows,
  onRowClick,
  selectedIndex,
}: {
  columns: Column<T>[]
  rows: T[]
  onRowClick?: (row: T, i: number) => void
  selectedIndex?: number
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-[13px]">
        <thead>
          <tr className="border-b border-line">
            {columns.map((c) => (
              <th
                key={c.key}
                className={`px-3.5 py-2.5 font-mono text-[10.5px] font-500 uppercase tracking-[0.13em] text-faint ${
                  c.align === "right" ? "text-right" : c.align === "center" ? "text-center" : "text-left"
                }`}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={i}
              onClick={() => onRowClick?.(row, i)}
              className={`border-b border-line/60 transition-colors ${
                onRowClick ? "cursor-pointer" : ""
              } ${selectedIndex === i ? "bg-accent/5" : "hover:bg-surface3/50"}`}
            >
              {columns.map((c) => (
                <td
                  key={c.key}
                  className={`px-3.5 py-3 text-ink2 ${
                    c.align === "right" ? "text-right" : c.align === "center" ? "text-center" : "text-left"
                  } ${c.className ?? ""}`}
                >
                  {c.render ? c.render(row) : row[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* ---------- Search input ---------- */
export function SearchInput({
  placeholder = "Search…",
  value,
  onChange,
  icon,
  className = "",
}: {
  placeholder?: string
  value?: string
  onChange?: (v: string) => void
  icon?: ReactNode
  className?: string
}) {
  return (
    <div className={`flex items-center gap-2.5 rounded-lg border border-line bg-surface px-3 py-2 focus-within:border-accent/50 ${className}`}>
      {icon && <span className="text-faint">{icon}</span>}
      <input
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent text-[13px] text-ink outline-none placeholder:text-faint"
      />
    </div>
  )
}

/* ---------- Simple filter chips ---------- */
export function FilterChips({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {options.map((o) => (
        <button
          key={o}
          onClick={() => onChange(o)}
          className={`rounded-full border px-3 py-1 text-[12px] transition-colors cursor-pointer ${
            value === o ? "border-accent/50 bg-accent/10 text-accent" : "border-line text-muted hover:text-ink2"
          }`}
        >
          {o}
        </button>
      ))}
    </div>
  )
}

export function useLocalTab(initial: string) {
  return useState(initial)
}
