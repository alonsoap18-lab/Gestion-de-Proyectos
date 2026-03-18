/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#fff7ed', 100: '#ffedd5', 200: '#fed7aa',
          300: '#fdba74', 400: '#fb923c', 500: '#f97316',
          600: '#ea580c', 700: '#c2410c', 800: '#9a3412', 900: '#7c2d12',
        },
        surface: {
          50:  '#f8fafc',
          900: '#0d1117',
          800: '#161b27',
          700: '#1c2333',
          600: '#232d3f',
          500: '#2d3a4f',
          400: '#3d4f66',
        },
      },
      fontFamily: {
        sans:    ['"IBM Plex Sans"',    'system-ui', 'sans-serif'],
        display: ['"Barlow Condensed"', 'sans-serif'],
        mono:    ['"IBM Plex Mono"',    'monospace'],
      },
      boxShadow: {
        'brand': '0 0 0 1px rgba(249,115,22,.35), 0 4px 24px rgba(249,115,22,.12)',
      },
    },
  },
  plugins: [],
};
