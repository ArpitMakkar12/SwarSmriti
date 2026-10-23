/** @type {import('tailwindcss').Config} */
// The Heirloom palette: aged paper, ink, and one oxblood accent (like a wax seal).
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#F2ECE1', // page background
        card: '#FBF7EF', // letters, cards
        ink: '#2A2420', // main text
        'ink-soft': '#5A4E45', // secondary text
        'ink-muted': '#6B5F55', // small labels (still passes contrast on paper)
        rule: '#D9CFBF', // thin lines
        'rule-strong': '#C9BBA6', // borders, empty waveform
        oxblood: '#8C2F39', // the one accent
        'oxblood-deep': '#6B2029', // accent hover
        tape: '#D6C4A4', // the strip of tape on cards
        moss: '#3F5B3A', // success
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        sans: ['Karla', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        letter: '0 1px 0 #E3D9C9, 0 18px 40px rgba(60, 40, 20, 0.12)',
        keepsake: '0 1px 0 #E3D9C9, 0 10px 24px rgba(60, 40, 20, 0.10)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out both',
        settle: 'settle 0.7s cubic-bezier(0.2, 0.8, 0.2, 1) both',
        'ink-in': 'inkIn 0.6s ease-out both',
        'ink-dot': 'inkDot 1.2s ease-in-out infinite',
        'record-ring': 'recordRing 1.6s ease-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        // a card being placed on the table
        settle: {
          '0%': { opacity: '0', transform: 'translateY(-14px) rotate(-2deg) scale(1.01)' },
          '100%': { opacity: '1', transform: 'translateY(0) rotate(0) scale(1)' },
        },
        // a word appearing as if ink is soaking into paper
        inkIn: {
          '0%': { opacity: '0', filter: 'blur(3px)' },
          '100%': { opacity: '1', filter: 'blur(0)' },
        },
        inkDot: {
          '0%, 100%': { opacity: '0.25', transform: 'translateY(0)' },
          '50%': { opacity: '1', transform: 'translateY(-3px)' },
        },
        recordRing: {
          '0%': { boxShadow: '0 0 0 0 rgba(140, 47, 57, 0.45)' },
          '100%': { boxShadow: '0 0 0 18px rgba(140, 47, 57, 0)' },
        },
      },
    },
  },
  plugins: [],
};