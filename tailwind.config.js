/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'yc-brown': '#8B4513',
        'yc-yellow': '#DAA520',
      }
    },
  },
  plugins: [],
};
