/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#0b6e99',
        'primary-container': '#1188c2',
        secondary: '#009c84',
        'secondary-container': '#4fe8c9',
        surface: '#f3fafd',
        'surface-container': '#dcf0f8',
        'surface-container-low': '#e8f6fb',
        'surface-container-lowest': '#ffffff',
        'surface-container-high': '#d3ecf6',
        'on-surface': '#0b2a3c',
        'on-surface-variant': '#434655',
        outline: '#737686',
        'outline-variant': '#c3c6d7',
        ocean: { DEFAULT: '#0b6e99', deep: '#073b55', light: '#1188c2' },
        ice: { DEFAULT: '#e8f6fb', 100: '#dcf0f8', 50: '#f3fafd' },
        aqua: { DEFAULT: '#2ee6c0', deep: '#009c84', light: '#4fe8c9' },
        sunset: { DEFAULT: '#ff7a1a', deep: '#e5600a', light: '#fff1e6' },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
