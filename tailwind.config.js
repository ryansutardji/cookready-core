/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        terracotta: '#D2691E',
        cream: '#FFFAF5',
        stone: '#F5F0E8',
        espresso: '#4A3728',
        sage: '#708238',
      },
    },
  },
  plugins: [],
};
