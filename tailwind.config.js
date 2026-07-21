/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#bae0fd',
          300: '#7cc5fb',
          400: '#36a5f6',
          500: '#0066cc',
          600: '#0052a3',
          700: '#003d7a',
          800: '#033363',
          900: '#082c52',
          950: '#051b36',
        },
        doc: {
          bg: '#f8fafd',
          paper: '#ffffff',
          sidebar: '#f0f4f9',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Merriweather', 'serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'paper': '0 1px 3px 0 rgba(60, 64, 67, 0.3), 0 4px 8px 3px rgba(60, 64, 67, 0.15)',
        'paper-hover': '0 2px 6px 0 rgba(60, 64, 67, 0.3), 0 8px 16px 4px rgba(60, 64, 67, 0.15)',
      }
    },
  },
  plugins: [],
}
