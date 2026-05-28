/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        background: '#030203',
        foreground: 'rgba(255,255,255,0.81)',
        primary: '#aaa8ff',
        'primary-foreground': '#030203',
        secondary: '#2b2e3f',
        'secondary-foreground': 'rgba(255,255,255,0.81)',
        muted: '#2b2e3f',
        'muted-foreground': 'rgba(255,255,255,0.45)',
        border: 'rgba(255,255,255,0.08)',
        destructive: '#f87171',
        card: '#2b2e3f',
        'fp-surface': '#111318',
        'fp-green': '#7f9ef8',
        'fp-lime': '#4ade80',
      },
    },
  },
  plugins: [],
};
