import type { Config } from 'tailwindcss';

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Manrope', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Fraunces', 'Georgia', 'serif'],
      },
      colors: {
        leaf: {
          50: '#f4fbf5',
          100: '#e2f4e5',
          200: '#c6e9cd',
          300: '#9bd7aa',
          400: '#68bd7d',
          500: '#3d9d58',
          600: '#2f7f45',
          700: '#28663a',
          800: '#214e38',
          900: '#1c3f30',
          950: '#0d231a',
        },
        cream: '#fbf7ee',
        ink: '#17201b',
        clay: '#b76d4a',
        brass: '#c69c52',
      },
      boxShadow: {
        soft: '0 24px 80px rgba(23, 32, 27, 0.12)',
        lift: '0 12px 32px rgba(33, 78, 56, 0.18)',
      },
    },
  },
  plugins: [],
} satisfies Config;
