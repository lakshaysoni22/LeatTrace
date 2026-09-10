import React from 'react';

interface CyberShieldLogoProps {
  size?: number | string;
  className?: string;
  showGlow?: boolean;
}

/**
 * CyberShieldLogo
 * Authentic vector recreation of the official LEATrace cyber defense shield.
 * 100% scalable SVG with no background checkerboard or raster pixelation artifacts.
 */
export const CyberShieldLogo: React.FC<CyberShieldLogoProps> = ({
  size = 40,
  className = '',
  showGlow = true,
}) => {
  return (
    <svg
      viewBox="0 0 400 440"
      width={size}
      height={size}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`select-none shrink-0 ${className}`}
      style={{ overflow: 'visible' }}
    >
      <defs>
        {/* Glow Filters */}
        <filter id="lea-cyan-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <filter id="lea-subtle-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <filter id="lea-purple-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>

        {/* Shield Body Gradient */}
        <radialGradient id="lea-shield-fill" cx="50%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#0B1C33" stopOpacity="0.95" />
          <stop offset="60%" stopColor="#060E1C" stopOpacity="0.98" />
          <stop offset="100%" stopColor="#03070E" stopOpacity="0.99" />
        </radialGradient>

        {/* Branch Gradient: Cyan to Purple */}
        <linearGradient id="lea-cyan-purple" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#00D4FF" />
          <stop offset="65%" stopColor="#8B5CF6" />
          <stop offset="100%" stopColor="#C026D3" />
        </linearGradient>

        {/* Neon Cyan Gradient */}
        <linearGradient id="lea-cyan-stroke" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="50%" stopColor="#00E5FF" />
          <stop offset="100%" stopColor="#0284C7" />
        </linearGradient>
      </defs>

      {/* --- LAYER 1: OUTER RADAR / ORBIT HALO --- */}
      <circle
        cx="200"
        cy="200"
        r="182"
        stroke="#00D4FF"
        strokeWidth="1.2"
        strokeDasharray="4 6"
        strokeOpacity="0.32"
      />
      {/* Subtle Crosshairs */}
      <line x1="12" y1="200" x2="32" y2="200" stroke="#00D4FF" strokeWidth="1" strokeOpacity="0.4" />
      <line x1="368" y1="200" x2="388" y2="200" stroke="#00D4FF" strokeWidth="1" strokeOpacity="0.4" />

      {/* --- LAYER 2: OUTER DASHED SHIELD CONTOUR --- */}
      <path
        d="M 68,64
           L 100,42
           L 200,32
           L 300,42
           L 332,64
           L 332,228
           C 332,295 272,360 200,402
           C 128,360 68,295 68,228
           Z"
        stroke="#00E5FF"
        strokeWidth="1.8"
        strokeDasharray="6 5"
        strokeOpacity="0.65"
      />

      {/* --- LAYER 3: MAIN OUTER SHIELD --- */}
      <path
        d="M 78,74
           L 106,54
           L 200,44
           L 294,54
           L 322,74
           L 322,222
           C 322,284 266,346 200,385
           C 134,346 78,284 78,222
           Z"
        fill="url(#lea-shield-fill)"
        stroke="url(#lea-cyan-stroke)"
        strokeWidth="3.2"
        filter={showGlow ? "url(#lea-subtle-glow)" : undefined}
      />

      {/* --- LAYER 4: INNER SHIELD PARALLEL LINE --- */}
      <path
        d="M 88,84
           L 112,66
           L 200,56
           L 288,66
           L 312,84
           L 312,216
           C 312,274 260,332 200,369
           C 140,332 88,274 88,216
           Z"
        fill="none"
        stroke="#00D4FF"
        strokeWidth="1.6"
        strokeOpacity="0.75"
      />

      {/* --- LAYER 5: INTERIOR HORIZONTAL DASHED BUS LINE --- */}
      <line
        x1="112"
        y1="138"
        x2="288"
        y2="138"
        stroke="#00D4FF"
        strokeWidth="1.2"
        strokeDasharray="4 4"
        strokeOpacity="0.3"
      />

      {/* --- LAYER 6: TOP DIAGONAL NODES & TRACES --- */}
      {/* Left Top Node & Trace */}
      <line
        x1="174"
        y1="96"
        x2="128"
        y2="76"
        stroke="#00E5FF"
        strokeWidth="2.2"
        filter={showGlow ? "url(#lea-subtle-glow)" : undefined}
      />
      <circle cx="128" cy="76" r="9" stroke="#9333EA" strokeWidth="1.8" fill="#070E1C" />
      <circle cx="128" cy="76" r="4.5" fill="#00E5FF" />

      {/* Right Top Node & Trace */}
      <line
        x1="226"
        y1="96"
        x2="272"
        y2="76"
        stroke="#00E5FF"
        strokeWidth="2.2"
        filter={showGlow ? "url(#lea-subtle-glow)" : undefined}
      />
      <circle cx="272" cy="76" r="9" stroke="#9333EA" strokeWidth="1.8" fill="#070E1C" />
      <circle cx="272" cy="76" r="4.5" fill="#00E5FF" />

      {/* --- LAYER 7: CENTRAL CYBER HEXAGON CORE --- */}
      {/* Outer Hexagon */}
      <polygon
        points="200,76 242,100 242,148 200,172 158,148 158,100"
        fill="#081426"
        stroke="#00E5FF"
        strokeWidth="3"
        filter={showGlow ? "url(#lea-cyan-glow)" : undefined}
      />

      {/* Inner Purple Hexagon */}
      <polygon
        points="200,88 232,106 232,142 200,160 168,142 168,106"
        fill="none"
        stroke="#A855F7"
        strokeWidth="1.8"
        strokeOpacity="0.9"
        filter={showGlow ? "url(#lea-purple-glow)" : undefined}
      />

      {/* Concentric Hex Target Core */}
      <circle
        cx="200"
        cy="124"
        r="17"
        stroke="#00E5FF"
        strokeWidth="2.2"
        fill="#050C18"
        filter={showGlow ? "url(#lea-subtle-glow)" : undefined}
      />
      <circle
        cx="200"
        cy="124"
        r="11"
        stroke="#00E5FF"
        strokeWidth="1.4"
        strokeDasharray="2 2"
        fill="none"
      />
      <circle cx="200" cy="124" r="5" fill="#00FFFF" filter={showGlow ? "url(#lea-cyan-glow)" : undefined} />

      {/* --- LAYER 8: SIDE CONNECTOR BUSSES & NODES --- */}
      {/* Left Side Connectors */}
      <path
        d="M 158,124 L 118,124 L 102,140 L 102,176"
        fill="none"
        stroke="#00E5FF"
        strokeWidth="2"
      />
      <circle cx="102" cy="140" r="5" stroke="#00E5FF" strokeWidth="1.6" fill="#050C18" />
      <circle cx="102" cy="176" r="5" stroke="#00E5FF" strokeWidth="1.6" fill="#050C18" />
      <circle cx="102" cy="140" r="2.2" fill="#00FFFF" />
      <circle cx="102" cy="176" r="2.2" fill="#00FFFF" />

      {/* Right Side Connectors */}
      <path
        d="M 242,124 L 282,124 L 298,140 L 298,176"
        fill="none"
        stroke="#00E5FF"
        strokeWidth="2"
      />
      <circle cx="298" cy="140" r="5" stroke="#00E5FF" strokeWidth="1.6" fill="#050C18" />
      <circle cx="298" cy="176" r="5" stroke="#00E5FF" strokeWidth="1.6" fill="#050C18" />
      <circle cx="298" cy="140" r="2.2" fill="#00FFFF" />
      <circle cx="298" cy="176" r="2.2" fill="#00FFFF" />

      {/* --- LAYER 9: LOWER NEURAL / CIRCUIT ROOTS (CYAN TO PURPLE) --- */}
      {/* Central Trunk */}
      <line
        x1="200"
        y1="172"
        x2="200"
        y2="218"
        stroke="#00E5FF"
        strokeWidth="2.8"
        filter={showGlow ? "url(#lea-subtle-glow)" : undefined}
      />

      {/* Branch Node */}
      <circle cx="200" cy="218" r="3" fill="#00E5FF" />

      {/* Left Main Branch: Cyan transitioning to Purple */}
      <path
        d="M 200,218 L 168,246 L 140,246 L 122,264"
        fill="none"
        stroke="url(#lea-cyan-purple)"
        strokeWidth="2.2"
        strokeLinecap="round"
        filter={showGlow ? "url(#lea-subtle-glow)" : undefined}
      />
      {/* Terminal Node - Left High (Purple) */}
      <circle cx="122" cy="264" r="7.5" stroke="#A855F7" strokeWidth="2" fill="#070E1C" />
      <circle cx="122" cy="264" r="3.5" fill="#D946EF" filter={showGlow ? "url(#lea-purple-glow)" : undefined} />

      {/* Left Low Branch (Cyan) */}
      <path
        d="M 168,246 L 168,272"
        fill="none"
        stroke="#00E5FF"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Terminal Node - Left Low (Cyan) */}
      <circle cx="168" cy="272" r="6" stroke="#00E5FF" strokeWidth="1.8" fill="#070E1C" />
      <circle cx="168" cy="272" r="2.8" fill="#00FFFF" />

      {/* Right Main Branch: Cyan transitioning to Purple */}
      <path
        d="M 200,218 L 232,246 L 260,246 L 278,264"
        fill="none"
        stroke="url(#lea-cyan-purple)"
        strokeWidth="2.2"
        strokeLinecap="round"
        filter={showGlow ? "url(#lea-subtle-glow)" : undefined}
      />
      {/* Terminal Node - Right High (Purple) */}
      <circle cx="278" cy="264" r="7.5" stroke="#A855F7" strokeWidth="2" fill="#070E1C" />
      <circle cx="278" cy="264" r="3.5" fill="#D946EF" filter={showGlow ? "url(#lea-purple-glow)" : undefined} />

      {/* Right Low Branch (Cyan) */}
      <path
        d="M 232,246 L 232,272"
        fill="none"
        stroke="#00E5FF"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Terminal Node - Right Low (Cyan) */}
      <circle cx="232" cy="272" r="6" stroke="#00E5FF" strokeWidth="1.8" fill="#070E1C" />
      <circle cx="232" cy="272" r="2.8" fill="#00FFFF" />
    </svg>
  );
};
