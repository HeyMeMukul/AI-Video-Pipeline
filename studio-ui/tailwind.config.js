/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'cinema-bg': '#08090d',
        'cinema-base': '#0c0e14',
        'cinema-surface': '#131620',
        'cinema-raised': '#1a1e2c',
        'cinema-input': '#0a0c13',
        'cinema-border': 'rgba(255, 255, 255, 0.06)',
        'cinema-line': 'rgba(255, 255, 255, 0.07)',
        'cinema-gold': '#e5c07b',
        'cinema-gold-deep': '#caa050',
        'cinema-paper': '#f2f0ea',
        'cinema-mist': '#c6cbd8',
        'cinema-faint': '#8b91a3',
        'cinema-error': '#f7768e',
        'cinema-director': '#e5c07b',
        'cinema-screenplay': '#7aa2f7',
        'cinema-character': '#f7768e',
        'cinema-world': '#9ece6a',
        'cinema-cinematographer': '#bb9af7',
        'cinema-prompt': '#2ac3de',
        'cinema-gpu': '#ff9e64',
        'cinema-auditor': '#e0af68',
        'cinema-editor': '#73daca',
        obsidian: {
          bg: '#08090d',
          surface: '#131620',
          raised: '#1a1e2c',
          border: 'rgba(255, 255, 255, 0.06)',
          hover: 'rgba(255, 255, 255, 0.12)',
          input: '#0a0c13',
        },
        gold: {
          primary: '#e5c07b',
          glow: 'rgba(229, 192, 123, 0.25)',
          muted: '#caa050',
        },
        subtitle: '#FFE600',
        agent: {
          director: '#e5c07b',
          screenplay: '#7aa2f7',
          character: '#f7768e',
          world: '#9ece6a',
          cinematographer: '#bb9af7',
          prompt_alchemist: '#2ac3de',
          gpu: '#ff9e64',
          auditor: '#e0af68',
          editor: '#73daca',
        }
      },
      fontFamily: {
        playfair: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"Inter"', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        'lift': '0 8px 28px rgba(0, 0, 0, 0.5)',
        'overlay': '0 16px 48px rgba(0, 0, 0, 0.65)',
        'glow-gold': '0 0 16px rgba(229, 192, 123, 0.28)',
        'glow-gold-strong': '0 0 28px rgba(229, 192, 123, 0.45)',
      },
      animation: {
        'pulse-gentle': 'pulseGently 3s ease-in-out infinite',
        'breathe': 'breathe 4s ease-in-out infinite',
        'packet-travel': 'packetMove 2s ease-in-out forwards',
        'pop-in': 'popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
        'fade-slide-up': 'fadeSlideUp 0.4s ease-out forwards',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
      },
      keyframes: {
        pulseGently: {
          '0%, 100%': { opacity: '0.6', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.04)' },
        },
        breathe: {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '0.7' },
        },
        popIn: {
          '0%': { opacity: '0', transform: 'scale(0.7)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        fadeSlideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 12px rgba(229, 192, 123, 0.3)' },
          '50%': { boxShadow: '0 0 28px rgba(229, 192, 123, 0.7)' },
        },
      },
      spacing: {
        '18': '4.5rem',
      },
    },
  },
  plugins: [],
}
