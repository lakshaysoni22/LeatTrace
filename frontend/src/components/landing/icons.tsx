import type { ReactNode, SVGProps } from "react"

type P = SVGProps<SVGSVGElement> & { size?: number }

function svg(children: ReactNode) {
  return function Icon({ size = 18, ...props }: P) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        {...props}
      >
        {children}
      </svg>
    )
  }
}

export const IconDashboard = svg(
  <>
    <rect x="3" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="3" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" />
    <rect x="14" y="14" width="7" height="7" rx="1.5" />
  </>,
)
export const IconCase = svg(
  <>
    <path d="M3 7.5A1.5 1.5 0 0 1 4.5 6h4l2 2.5H19.5A1.5 1.5 0 0 1 21 10v7.5A1.5 1.5 0 0 1 19.5 19h-15A1.5 1.5 0 0 1 3 17.5Z" />
  </>,
)
export const IconChain = svg(
  <>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m20 20-3.6-3.6" />
  </>,
)
export const IconGraph = svg(
  <>
    <path d="M3 12h3l2.5-6 4 13 2.5-8 1.5 3H21" />
  </>,
)
export const IconVault = svg(
  <>
    <path d="M12 3 5 6v5c0 4.2 2.9 8 7 10 4.1-2 7-5.8 7-10V6Z" />
  </>,
)
export const IconEye = svg(
  <>
    <path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12Z" />
    <circle cx="12" cy="12" r="2.6" />
  </>,
)
export const IconBell = svg(
  <>
    <path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z" />
    <path d="M10 20a2 2 0 0 0 4 0" />
  </>,
)
export const IconReport = svg(
  <>
    <path d="M6 3h8l5 5v13H6Z" />
    <path d="M14 3v5h5" />
    <path d="M9 13h7M9 16h7" />
  </>,
)
export const IconSparkle = svg(
  <>
    <path d="M12 3v6M12 15v6M3 12h6M15 12h6" />
    <path d="m6.5 6.5 3 3M14.5 14.5l3 3M17.5 6.5l-3 3M9.5 14.5l-3 3" />
  </>,
)
export const IconEntity = svg(
  <>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <circle cx="9" cy="10" r="2.2" />
    <path d="M5.5 16.5c.6-1.8 2-2.6 3.5-2.6s2.9.8 3.5 2.6" />
    <path d="M15 9h4M15 12h4M15 15h2.5" />
  </>,
)
export const IconIncident = svg(
  <>
    <path d="M12 3 5 6v5c0 4.2 2.9 8 7 10 4.1-2 7-5.8 7-10V6Z" />
    <path d="M12 9v3.5M12 15.4v.1" />
  </>,
)
export const IconSoc = svg(
  <>
    <path d="M12 3 5 6v5c0 4.2 2.9 8 7 10 4.1-2 7-5.8 7-10V6Z" />
    <path d="m9 11.5 2 2 3.5-4" />
  </>,
)
export const IconLogs = svg(
  <>
    <path d="M8 5h12M8 12h12M8 19h12" />
    <path d="M4 5h.01M4 12h.01M4 19h.01" />
  </>,
)
export const IconSettings = svg(
  <>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9 17 7M7 17l-2.1 2.1" />
  </>,
)
export const IconSearch = svg(
  <>
    <circle cx="11" cy="11" r="7" />
    <path d="m21 21-4-4" />
  </>,
)
export const IconChevron = svg(<path d="m9 6 6 6-6 6" />)
export const IconChevronDown = svg(<path d="m6 9 6 6 6-6" />)
export const IconArrow = svg(
  <>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </>,
)
export const IconCheck = svg(<path d="m5 12 5 5L20 7" />)
export const IconX = svg(<path d="M6 6l12 12M18 6 6 18" />)
export const IconPlus = svg(<path d="M12 5v14M5 12h14" />)
export const IconLock = svg(
  <>
    <rect x="4" y="10" width="16" height="10" rx="2" />
    <path d="M8 10V7a4 4 0 0 1 8 0v3" />
  </>,
)
export const IconGlobe = svg(
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3c2.6 2.5 4 5.6 4 9s-1.4 6.5-4 9c-2.6-2.5-4-5.6-4-9s1.4-6.5 4-9Z" />
  </>,
)
export const IconMenu = svg(<path d="M4 6h16M4 12h16M4 18h16" />)
export const IconExternal = svg(
  <>
    <path d="M14 4h6v6M20 4l-9 9" />
    <path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
  </>,
)
export const IconUsers = svg(
  <>
    <circle cx="9" cy="8" r="3" />
    <path d="M3 20c0-3.3 2.7-5.5 6-5.5S15 16.7 15 20" />
    <path d="M16 5.2A3 3 0 0 1 16 11M21 20c0-2.5-1.4-4.4-3.5-5.2" />
  </>,
)
export const IconClock = svg(
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </>,
)
export const IconBolt = svg(<path d="M13 2 4 14h7l-1 8 9-12h-7Z" />)
export const IconWallet = svg(
  <>
    <rect x="3" y="6" width="18" height="13" rx="2" />
    <path d="M3 10h18" />
    <circle cx="17" cy="14" r="1.2" />
  </>,
)
export const IconTrendUp = svg(
  <>
    <path d="M3 17 9 11l4 4 8-8" />
    <path d="M15 7h6v6" />
  </>,
)
export const IconFingerprint = svg(
  <>
    <path d="M6 11a6 6 0 0 1 12 0M8 12a4 4 0 0 1 8 0v2M10.5 12a1.5 1.5 0 0 1 3 0v2.5a4 4 0 0 1-.4 1.8M12 19c.3-.8.5-1.6.5-2.5M8 16a6 6 0 0 0 .6 3" />
  </>,
)
export const IconLayers = svg(
  <>
    <path d="m12 3 9 5-9 5-9-5Z" />
    <path d="m3 13 9 5 9-5M3 16.5l9 5 9-5" />
  </>,
)
export const IconFlag = svg(
  <>
    <path d="M5 21V4M5 4h11l-2 3 2 3H5" />
  </>,
)
export const IconDownload = svg(
  <>
    <path d="M12 4v11m0 0 4-4m-4 4-4-4" />
    <path d="M4 19h16" />
  </>,
)
export const IconLogout = svg(
  <>
    <path d="M14 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4" />
    <path d="M9 12h11m0 0-4-4m4 4-4 4" />
  </>,
)
