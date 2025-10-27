import plugin from 'tailwindcss/plugin';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#3B82F6',
        yellow: { 500: '#FBBF24' },
        gray: {
          100: '#F7F7F7',
          200: '#EBEBEB',
          300: '#DCDCDC',
          400: '#C4C4C4',
          500: '#A9A9A9',
          600: '#8E8E8E',
          700: '#737373',
          800: '#585858',
          900: '#3D3D3D',
        },
      },
    },
  },
  plugins: [
    plugin(function({ addBase, theme }) {
      addBase({
        'body': {
          backgroundColor: theme('colors.gray.100'),
          color: theme('colors.gray.900'),
        },
        '.dark body': {
          backgroundColor: theme('colors.gray.900'),
          color: theme('colors.gray.100'),
        },
        '::-webkit-scrollbar': {
          width: '6px',
        },
        '::-webkit-scrollbar-track': {
          backgroundColor: theme('colors.gray.100'),
        },
        '.dark ::-webkit-scrollbar-track': {
          backgroundColor: theme('colors.gray.900'),
        },
        '::-webkit-scrollbar-thumb': {
          backgroundColor: theme('colors.gray.300'),
          borderRadius: '9999px',
        },
        '.dark ::-webkit-scrollbar-thumb': {
          backgroundColor: theme('colors.gray.700'),
        },
      })
    })
  ],
}