import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'sporr-dark':    '#13322A',
        'sporr-cream':   '#F5F1E6',
        'sporr-mid':     '#1D4A38',
        'sporr-sage':    '#808C70',
        'sporr-sage-lt': '#EEF0E8',
        'sporr-light':   '#F7F5EF',
        'sporr-muted':   '#5C6B63',
        'sporr-ink':     '#111814',
      },
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
