/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          light: '#60a5fa', // blue-400
          DEFAULT: '#3b82f6', // blue-500
          dark: '#2563eb',  // blue-600
        },
        secondary: { // For accents, AI buttons
          light: '#5eead4', // teal-300
          DEFAULT: '#14b8a6', // teal-500
          dark: '#0d9488',   // teal-600
        },
        neutral: { // For general UI elements, text, backgrounds
          50: '#f8fafc',  // slate-50
          100: '#f1f5f9', // slate-100
          200: '#e2e8f0', // slate-200
          300: '#cbd5e1', // slate-300
          400: '#94a3b8', // slate-400
          500: '#64748b', // slate-500
          600: '#475569', // slate-600
          700: '#334155', // slate-700
          800: '#1e293b', // slate-800
          900: '#0f172a', // slate-900
        },
        // Dark mode specific colors (can be used with dark: prefix or directly if needed)
        dark: {
          bg: '#0f172a',      // neutral-900 (overall background)
          surface: '#1e293b', // neutral-800 (card backgrounds)
          text: '#e2e8f0',   // neutral-200 (primary text)
          muted: '#94a3b8',  // neutral-400 (secondary text)
          primary: '#60a5fa', // primary-light for dark mode emphasis
          secondary: '#2dd4bf',// secondary-light for dark mode emphasis
          border: '#334155' // neutral-700 for borders
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    }
  },
  darkMode: 'class',
  plugins: [],
} 