/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#004ac6',
        'primary-container': '#2563eb',
        secondary: '#006c49',
        'secondary-container': '#6cf8bb',
        surface: '#f8f9ff',
        'surface-container': '#e6eeff',
        'surface-container-low': '#eff4ff',
        'surface-container-lowest': '#ffffff',
        'surface-container-high': '#dee9fc',
        'on-surface': '#121c2a',
        'on-surface-variant': '#434655',
        outline: '#737686',
        'outline-variant': '#c3c6d7',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
