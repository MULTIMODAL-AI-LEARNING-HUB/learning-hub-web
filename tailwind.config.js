/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    screens: {
      xs: '480px',
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
      '3xl': '1920px'
    },
    extend: {
      colors: {
        border: 'hsl(var(--border) / <alpha-value>)',
        input: 'hsl(var(--input) / <alpha-value>)',
        ring: 'hsl(var(--ring) / <alpha-value>)',
        background: 'hsl(var(--background) / <alpha-value>)',
        foreground: 'hsl(var(--foreground) / <alpha-value>)',
        primary: {
          DEFAULT: 'hsl(var(--primary) / <alpha-value>)',
          foreground: 'hsl(var(--primary-foreground) / <alpha-value>)'
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary) / <alpha-value>)',
          foreground: 'hsl(var(--secondary-foreground) / <alpha-value>)'
        },
        accent: {
          DEFAULT: 'hsl(var(--accent) / <alpha-value>)',
          foreground: 'hsl(var(--accent-foreground) / <alpha-value>)'
        },
        muted: {
          DEFAULT: 'hsl(var(--muted) / <alpha-value>)',
          foreground: 'hsl(var(--muted-foreground) / <alpha-value>)'
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive) / <alpha-value>)',
          foreground: 'hsl(var(--destructive-foreground) / <alpha-value>)'
        },
        info: {
          DEFAULT: 'hsl(var(--info) / <alpha-value>)',
          foreground: 'hsl(var(--info-foreground) / <alpha-value>)'
        },
        success: {
          DEFAULT: 'hsl(var(--success) / <alpha-value>)',
          foreground: 'hsl(var(--success-foreground) / <alpha-value>)'
        },
        warning: {
          DEFAULT: 'hsl(var(--warning) / <alpha-value>)',
          foreground: 'hsl(var(--warning-foreground) / <alpha-value>)'
        },
        surface: {
          DEFAULT: 'hsl(var(--surface) / <alpha-value>)',
          elevated: 'hsl(var(--surface-elevated) / <alpha-value>)',
          deep: 'hsl(var(--surface-deep) / <alpha-value>)'
        },
        ink: 'hsl(var(--ink) / <alpha-value>)',
        'ink-soft': 'hsl(var(--ink-soft) / <alpha-value>)',
        'ink-mute': 'hsl(var(--ink-mute) / <alpha-value>)'
      },
      fontFamily: {
        display: ['Inter', '"SF Pro Display"', 'system-ui', 'sans-serif'],
        body: ['Inter', '"SF Pro Text"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"SFMono-Regular"', 'Consolas', 'monospace']
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem' }]
      },
      boxShadow: {
        soft: '0 1px 2px 0 hsl(var(--shadow) / 0.05)',
        lift: '0 12px 30px -18px hsl(var(--shadow) / 0.35), 0 2px 8px -6px hsl(var(--shadow) / 0.18)',
        glow: '0 0 0 1px hsl(var(--ring) / 0.12), 0 12px 28px -18px hsl(var(--ring) / 0.4)',
        'glow-admin': '0 0 0 1px rgba(99, 102, 241, 0.15), 0 8px 24px -8px rgba(99, 102, 241, 0.35)',
        'glow-lecturer': '0 0 0 1px rgba(139, 92, 246, 0.15), 0 8px 24px -8px rgba(139, 92, 246, 0.35)',
        'glow-student': '0 0 0 1px rgba(59, 130, 246, 0.15), 0 8px 24px -8px rgba(59, 130, 246, 0.35)'
      },
      borderRadius: {
        xl: '0.75rem',
        '2xl': '1rem',
        '3xl': '1.25rem'
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' }
        },
        'fade-out': {
          from: { opacity: '1' },
          to: { opacity: '0' }
        },
        'slide-in-from-top': {
          from: { transform: 'translateY(-8px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' }
        },
        'slide-in-from-bottom': {
          from: { transform: 'translateY(8px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' }
        },
        'slide-in-from-right': {
          from: { transform: 'translateX(100%)', opacity: '0' },
          to: { transform: 'translateX(0)', opacity: '1' }
        },
        'slide-in-from-left': {
          from: { transform: 'translateX(-100%)', opacity: '0' },
          to: { transform: 'translateX(0)', opacity: '1' }
        },
        'zoom-in-95': {
          from: { transform: 'scale(0.95)', opacity: '0' },
          to: { transform: 'scale(1)', opacity: '1' }
        },
        'shimmer': {
          from: { backgroundPosition: '-200% 0' },
          to: { backgroundPosition: '200% 0' }
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' }
        },
        'flip': {
          from: { transform: 'rotateY(0deg)' },
          to: { transform: 'rotateY(180deg)' }
        }
      },
      animation: {
        'fade-in': 'fade-in 200ms ease-out',
        'fade-out': 'fade-out 150ms ease-out',
        'slide-in-from-top': 'slide-in-from-top 220ms ease-out',
        'slide-in-from-bottom': 'slide-in-from-bottom 220ms ease-out',
        'slide-in-from-right': 'slide-in-from-right 220ms ease-out',
        'slide-in-from-left': 'slide-in-from-left 220ms ease-out',
        'zoom-in-95': 'zoom-in-95 200ms ease-out',
        'shimmer': 'shimmer 2s linear infinite',
        'pulse-soft': 'pulse-soft 2s ease-in-out infinite',
        'flip': 'flip 0.6s ease-in-out'
      }
    }
  },
  plugins: [require('tailwindcss-animate')]
}
