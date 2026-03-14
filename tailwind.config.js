/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f8f5ff',
          100: '#f1eaff',
          200: '#e4d7ff',
          300: '#d1b6ff',
          400: '#b990ff',
          500: '#a26dff',
          600: '#8b5cf6',
          700: '#7c3aed',
          800: '#6d28d9',
          900: '#5b21b6',
        },
        blush: {
          50: '#fff5f7',
          100: '#ffe4e9',
          200: '#fecdd3',
          300: '#fda4af',
          400: '#fb7185',
          500: '#f43f5e',
          600: '#e11d48',
        },
        dusk: {
          50: '#f5f6ff',
          100: '#eef1ff',
          200: '#dfe5ff',
          300: '#c7ceff',
          400: '#a8b0ff',
          500: '#8a93ff',
        },
      },
      animation: {
        'fade-in-scale': 'fadeInScale 0.8s ease-out',
        'pulse-slow': 'pulseSlow 2s ease-in-out infinite',
        'aura': 'aura 3s ease-in-out infinite',
      },
      keyframes: {
        fadeInScale: {
          '0%': {
            opacity: '0',
            transform: 'scale(0.8) translateY(20px)',
          },
          '100%': {
            opacity: '1',
            transform: 'scale(1) translateY(0)',
          },
        },
        pulseSlow: {
          '0%, 100%': {
            opacity: '1',
            transform: 'scale(1)',
          },
          '50%': {
            opacity: '0.7',
            transform: 'scale(1.05)',
          },
        },
        aura: {
          '0%, 100%': {
            transform: 'scale(1)',
            opacity: '0.3',
          },
          '50%': {
            transform: 'scale(1.2)',
            opacity: '0.1',
          },
        },
      },
    },
  },
  plugins: [],
}
