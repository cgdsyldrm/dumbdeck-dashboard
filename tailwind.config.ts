import type { Config } from 'tailwindcss'

export default {
    darkMode: ['class'],
    content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
  	extend: {
  		colors: {
  			surface: {
  				DEFAULT: '#0d0d14',
  				card: '#13131f',
  				elevated: '#1a1a2e',
  				border: '#2a2a3e'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				hover: '#6d28d9',
  				glow: '#a78bfa',
  				soft: 'rgba(124,58,237,0.15)',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			success: '#10b981',
  			danger: '#ef4444',
  			warn: '#f59e0b',
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			}
  		},
  		boxShadow: {
  			glow: '0 0 20px rgba(124,58,237,0.4), 0 0 40px rgba(124,58,237,0.1)',
  			'glow-sm': '0 0 10px rgba(124,58,237,0.3)',
  			card: '0 4px 24px rgba(0,0,0,0.4)'
  		},
  		animation: {
  			'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
  			press: 'press 0.1s ease-in-out'
  		},
  		keyframes: {
  			pulseGlow: {
  				'0%, 100%': {
  					boxShadow: '0 0 10px rgba(124,58,237,0.3)'
  				},
  				'50%': {
  					boxShadow: '0 0 25px rgba(124,58,237,0.6), 0 0 50px rgba(124,58,237,0.2)'
  				}
  			},
  			press: {
  				'0%': {
  					transform: 'scale(1)'
  				},
  				'50%': {
  					transform: 'scale(0.95)'
  				},
  				'100%': {
  					transform: 'scale(1)'
  				}
  			}
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config
