/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        background: '#18181b',
        foreground: '#f4f4f5',
        primary: '#a855f7',
        'primary-foreground': '#fafafa',
        secondary: '#27272a',
        'secondary-foreground': '#e4e4e7',
        muted: '#27272a',
        'muted-foreground': '#a1a1aa',
        border: 'rgba(255,255,255,0.15)',
        destructive: '#ef4444',
        card: '#1c1c1f',
      },
    },
  },
  plugins: [],
};
