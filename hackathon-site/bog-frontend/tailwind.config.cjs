/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1b8354',
          light: '#25935f',
          dark: '#166a45',
          darker: '#14573a',
        },
        secondary: {
          DEFAULT: '#b8903b',
          light: '#d4a850',
          dark: '#9a7731',
        },
      },
      fontFamily: {
        sans: ['IBMPlexSansArabic', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
