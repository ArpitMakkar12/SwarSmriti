/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'ivory': '#F4F3EF',
        'charcoal': '#3C3C3B',
        'warm-grey': '#6E6E6E',
        'rose-gold': '#D4A5A5',
        'copper-rose': '#C97C5D',
        'warm-beige': '#E0DDD6',
      },
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-soft': 'pulseSoft 2s infinite',
        'recording': 'recording 1.5s ease-in-out infinite alternate',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '0.7' },
          '50%': { opacity: '1' },
        },
        recording: {
          '0%': { transform: 'scale(1)', boxShadow: '0 0 0 0 rgba(201, 124, 93, 0.7)' },
          '100%': { transform: 'scale(1.05)', boxShadow: '0 0 0 15px rgba(201, 124, 93, 0)' },
        },
      },
    },
  },
  plugins: [],
};