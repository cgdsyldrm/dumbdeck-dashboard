import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: '#0d0d14',
          card: '#13131f',
          elevated: '#1a1a2e',
          border: '#2a2a3e',
        },
        accent: {
          DEFAULT: '#7c3aed',
          hover: '#6d28d9',
          glow: '#a78bfa',
          soft: 'rgba(124,58,237,0.15)',
        },
        success: '#10b981',
        danger: '#ef4444',
        warn: '#f59e0b',
      },
      boxShadow: {
        glow: '0 0 20px rgba(124,58,237,0.4), 0 0 40px rgba(124,58,237,0.1)',
        'glow-sm': '0 0 10px rgba(124,58,237,0.3)',
        card: '0 4px 24px rgba(0,0,0,0.4)',
      },
      animation: {
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'press': 'press 0.1s ease-in-out',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 10px rgba(124,58,237,0.3)' },
          '50%': { boxShadow: '0 0 25px rgba(124,58,237,0.6), 0 0 50px rgba(124,58,237,0.2)' },
        },
        press: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(0.95)' },
          '100%': { transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config
