/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      './pages/**/*.{js,ts,jsx,tsx,mdx}',
      './components/**/*.{js,ts,jsx,tsx,mdx}',
      './app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
      extend: {
        fontFamily: {
          'inter': ['var(--font-inter)', 'Inter', 'sans-serif'],
        },
        animation: {
          'float': 'float 6s ease-in-out infinite',
          'pulse-slow': 'pulse-slow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        },
        keyframes: {
          float: {
            '0%, 100%': { transform: 'translateY(0px)' },
            '50%': { transform: 'translateY(-10px)' },
          },
          'pulse-slow': {
            '0%, 100%': { opacity: '1' },
            '50%': { opacity: '0.6' },
          },
        },
        backdropBlur: {
          '20': '20px',
        },
      },
    },
    plugins: [
      require('@tailwindcss/typography'),
    ],
    darkMode: 'media',
  }