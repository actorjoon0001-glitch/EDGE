/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // 포커 테마 컬러
        'poker-green': {
          DEFAULT: '#1a6b3c',
          light: '#2d8f55',
          dark: '#0f4425',
          table: '#1a5c32',
        },
        'poker-dark': {
          DEFAULT: '#0d1117',
          lighter: '#161b22',
          card: '#21262d',
        },
        'poker-gold': {
          DEFAULT: '#d4a017',
          light: '#f0c040',
          dark: '#a07810',
        },
        'poker-red': '#e53e3e',
        'poker-blue': '#3182ce',
      },
      fontFamily: {
        game: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'card-deal': 'cardDeal 0.4s ease-out',
        'chip-move': 'chipMove 0.5s ease-in-out',
        'pulse-turn': 'pulseTurn 1.5s infinite',
        'fade-in': 'fadeIn 0.3s ease-in',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        cardDeal: {
          '0%': { transform: 'translateY(-50px) scale(0.5)', opacity: '0' },
          '100%': { transform: 'translateY(0) scale(1)', opacity: '1' },
        },
        chipMove: {
          '0%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
          '100%': { transform: 'translateY(0)' },
        },
        pulseTurn: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(212, 160, 23, 0.4)' },
          '50%': { boxShadow: '0 0 0 10px rgba(212, 160, 23, 0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
