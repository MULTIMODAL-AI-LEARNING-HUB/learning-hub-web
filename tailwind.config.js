/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#121019',
        inkSoft: '#3b3744',
        inkMute: '#6d6576',
        surface: '#f6f4f1',
        surfaceDeep: '#ede9e4',
        panel: '#ffffff',
        border: '#e6e0d9',
        accent: '#3b6ef5',
        accentSoft: '#e7edff',
        success: '#22c55e',
        warning: '#f59e0b',
        danger: '#ef4444',
        info: '#38bdf8'
      },
      fontFamily: {
        display: ['"Avenir Next"', '"Gill Sans"', '"Trebuchet MS"', 'sans-serif'],
        body: ['"Iowan Old Style"', '"Palatino"', '"Bookman Old Style"', 'serif'],
        mono: ['"SFMono-Regular"', '"Consolas"', 'monospace']
      },
      boxShadow: {
        soft: '0 10px 25px -15px rgba(18, 16, 25, 0.35)',
        lift: '0 20px 40px -25px rgba(18, 16, 25, 0.45)'
      },
      borderRadius: {
        xl: '18px',
        '2xl': '22px'
      }
    }
  },
  plugins: []
}
