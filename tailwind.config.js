/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./App.tsx",
    "./index.tsx",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./utils/**/*.{js,ts,jsx,tsx}",
    "./services/**/*.{js,ts,jsx,tsx}",
    "./data/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        linkedin: {
          50: '#f0f7fd',
          100: '#ddecf9',
          200: '#c2dff4',
          300: '#9acbeb',
          400: '#69b0df',
          500: '#4592d0',
          600: '#3278b7',
          700: '#296093',
          800: '#26517a',
          900: '#234365',
        }
      }
    },
  },
  plugins: [],
}