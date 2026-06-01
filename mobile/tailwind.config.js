/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './features/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Semantic tokens (used in components via className)
        background:           '#090909',
        foreground:           'rgba(245,240,232,0.88)',
        card:                 '#161616',
        'card-foreground':    'rgba(245,240,232,0.88)',
        primary:              '#d4a84b',
        'primary-foreground': '#0a0800',
        secondary:            '#1f1f1f',
        'secondary-foreground': 'rgba(245,240,232,0.80)',
        muted:                '#1c1c1c',
        'muted-foreground':   'rgba(245,240,232,0.42)',
        border:               'rgba(255,255,255,0.09)',
        destructive:          '#f87171',

        // Framed brand palette
        'fr-black':     '#090909',
        'fr-surface':   '#0f0f0f',
        'fr-surface-2': '#161616',
        'fr-surface-3': '#1f1f1f',
        'fr-white':     '#f5f0e8',
        'fr-gold':      '#d4a84b',
        'fr-gold-dim':  '#a07832',
        'fr-silver':    '#c8c4bc',
        'fr-green':     '#4ade80',
        'fr-yellow':    '#fbbf24',
        'fr-red':       '#f87171',
      },
    },
  },
  plugins: [],
}
