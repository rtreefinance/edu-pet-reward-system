/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#FF6B9D',
        'primary-light': '#FFE0EB',
        secondary: '#4ECDC4',
        'secondary-light': '#D4F5F2',
        accent: '#FFE66D',
        'accent-light': '#FFF8CC',
        purple: '#A78BFA',
        'purple-light': '#EDE9FE',
        green: '#6BCB77',
        'green-light': '#E1F7E3',
        blue: '#60A5FA',
        'blue-light': '#DBEAFE',
        pink: '#F472B6',
        'pink-light': '#FCE7F3',
        yellow: '#FBBF24',
        'yellow-light': '#FEF9C3',
        red: '#EF4444',
        'red-light': '#FEE2E2',
        gray: '#9CA3AF',
        'gray-light': '#F3F4F6',
        'bg-light': '#FFF5F7',
        'bg-card': '#FFFFFF',
        'text-main': '#2D3436',
        'text-sub': '#636E72',
      },
      borderRadius: {
        card: '16px',
        button: '12px',
      },
      boxShadow: {
        card: '0 4px 20px rgba(0,0,0,0.08)',
        button: '0 4px 12px rgba(255,107,157,0.3)',
      },
      animation: {
        'bounce-in': 'bounceIn 0.5s ease-out',
        'float': 'float 3s ease-in-out infinite',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'sparkle': 'sparkle 1.5s ease-in-out infinite',
        'slide-up': 'slideUp 0.4s ease-out',
        'coin-pop': 'coinPop 0.6s ease-out',
        'wiggle': 'wiggle 2s ease-in-out infinite',
      },
      keyframes: {
        bounceIn: {
          '0%': { transform: 'scale(0.3)', opacity: '0' },
          '50%': { transform: 'scale(1.05)' },
          '70%': { transform: 'scale(0.95)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        sparkle: {
          '0%, 100%': { transform: 'scale(1) rotate(0deg)' },
          '50%': { transform: 'scale(1.2) rotate(10deg)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        coinPop: {
          '0%': { transform: 'scale(0) rotate(-180deg)' },
          '60%': { transform: 'scale(1.3) rotate(10deg)' },
          '100%': { transform: 'scale(1) rotate(0deg)' },
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '25%': { transform: 'rotate(-5deg)' },
          '75%': { transform: 'rotate(5deg)' },
        },
      },
    },
  },
  plugins: [],
};
