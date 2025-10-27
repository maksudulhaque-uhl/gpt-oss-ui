import plugin from 'tailwindcss/plugin';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {},
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
          width: '8px',
        },
        '::-webkit-scrollbar-track': {
          backgroundColor: theme('colors.gray.200'),
        },
        '.dark ::-webkit-scrollbar-track': {
          backgroundColor: theme('colors.gray.800'),
        },
        '::-webkit-scrollbar-thumb': {
          backgroundColor: theme('colors.gray.400'),
          borderRadius: '9999px',
        },
        '.dark ::-webkit-scrollbar-thumb': {
          backgroundColor: theme('colors.gray.600'),
        },
      })
    })
  ],
}