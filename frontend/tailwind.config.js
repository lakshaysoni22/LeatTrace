/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Landing page institutional palette
        base: '#070b14',
        base2: '#050810',
        surface: '#0c1421',
        surface2: '#111c2d',
        surface3: '#17253a',
        line: '#1d2a40',
        line2: '#26364f',
        ink: '#e7edf6',
        ink2: '#b7c4d8',
        muted: '#7f92ae',
        faint: '#566783',
        accent: {
          DEFAULT: '#22d3ee',
          green: '#00ff88',
          red: '#ff3366',
          gold: '#ffd700',
          purple: '#a855f7',
          orange: '#ff8c00',
        },
        accent2: '#2dd4bf',
        accentdim: '#0e7490',
        danger: '#fb5a6f',
        warn: '#f7b955',
        ok: '#3ddc97',
        violet: '#a78bfa',

        // Core app palette
        primary: {
          50: '#e6fbff',
          100: '#b3f3ff',
          200: '#80ebff',
          300: '#4de3ff',
          400: '#1adbff',
          500: '#00d4ff',
          600: '#00aacc',
          700: '#008099',
          800: '#005566',
          900: '#002b33',
        },
        dark: {
          50: '#e8eaf0',
          100: '#c5c9d6',
          200: '#9fa5b8',
          300: '#78819a',
          400: '#5b6584',
          500: '#3e496e',
          600: '#353f62',
          700: '#2a3253',
          800: '#1a1f36',
          900: '#0a0e1a',
          950: '#060810',
        },
        cyber: {
          blue: '#00d4ff',
          green: '#00ff88',
          red: '#ff3366',
          gold: '#ffd700',
          purple: '#a855f7',
          teal: '#14b8a6',
        }
      },
      fontFamily: {
        display: ['Archivo', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'glow-cyan': '0 0 15px rgba(0, 212, 255, 0.3)',
        'glow-green': '0 0 15px rgba(0, 255, 136, 0.3)',
        'glow-red': '0 0 15px rgba(255, 51, 102, 0.3)',
        'glow-gold': '0 0 15px rgba(255, 215, 0, 0.3)',
        'glow-purple': '0 0 15px rgba(168, 85, 247, 0.3)',
        'glass': '0 8px 32px rgba(0, 0, 0, 0.3)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'grid-pattern': 'linear-gradient(rgba(0, 212, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 212, 255, 0.03) 1px, transparent 1px)',
      },
      backgroundSize: {
        'grid': '40px 40px',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'fade-in': 'fadeIn 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'scan-line': 'scanLine 8s linear infinite',
        'pulse-dot': 'pulse-dot 1.8s ease-in-out infinite',
        'rise': 'rise 0.6s cubic-bezier(0.22, 1, 0.36, 1) both',
        'aurora': 'aurora 18s ease-in-out infinite',
        'aurora2': 'aurora2 22s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'float-slow': 'float-slow 9s ease-in-out infinite',
        'spin-slow': 'spin-slow 40s linear infinite',
        'ping-ring': 'ping-ring 2.4s cubic-bezier(0, 0, 0.2, 1) infinite',
        'scan-x': 'scan-x 5.5s cubic-bezier(0.4, 0, 0.2, 1) infinite',
        'ticker-blink': 'ticker-blink 1.4s steps(2, jump-none) infinite',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(0, 212, 255, 0.2)' },
          '100%': { boxShadow: '0 0 20px rgba(0, 212, 255, 0.4)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        scanLine: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
        'pulse-dot': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.35', transform: 'scale(0.82)' },
        },
        rise: {
          'from': { opacity: '0', transform: 'translateY(14px)' },
          'to': { opacity: '1', transform: 'translateY(0)' },
        },
        aurora: {
          '0%, 100%': { transform: 'translate(-4%, -2%) scale(1)', opacity: '0.55' },
          '33%': { transform: 'translate(6%, 4%) scale(1.15)', opacity: '0.8' },
          '66%': { transform: 'translate(-3%, 6%) scale(0.95)', opacity: '0.6' },
        },
        aurora2: {
          '0%, 100%': { transform: 'translate(3%, 3%) scale(1.1)', opacity: '0.5' },
          '50%': { transform: 'translate(-6%, -4%) scale(1)', opacity: '0.75' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'float-slow': {
          '0%, 100%': { transform: 'translateY(0) translateX(0)' },
          '50%': { transform: 'translateY(-14px) translateX(6px)' },
        },
        'spin-slow': {
          'to': { transform: 'rotate(360deg)' },
        },
        'ping-ring': {
          '0%': { transform: 'scale(0.7)', opacity: '0.8' },
          '100%': { transform: 'scale(2.2)', opacity: '0' },
        },
        'scan-x': {
          '0%': { transform: 'translateX(-100%)', opacity: '0' },
          '8%, 92%': { opacity: '1' },
          '100%': { transform: 'translateX(1100%)', opacity: '0' },
        },
        'ticker-blink': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.25' },
        },
      },
    },
  },
  plugins: [],
}
