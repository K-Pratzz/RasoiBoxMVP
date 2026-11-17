/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef6f1', 100: '#d5e9dd', 200: '#aed3bd', 300: '#7fb799', 400: '#4f9874',
          500: '#2f7a58', 600: '#22624a', 700: '#1c4f3c', 800: '#173f31', 900: '#12332a', 950: '#0b211a',
        },
        cream: { DEFAULT: '#faf5e6', 100: '#fdfaf0', 200: '#f5eed8', 300: '#ece2c3' },
        sun: { DEFAULT: '#f2c94c', 300: '#f7dc86', 400: '#f2c94c', 500: '#e0b12e', 600: '#b98d17' },
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
      boxShadow: { card: '0 2px 14px rgba(18,51,42,0.08)', lift: '0 10px 30px rgba(18,51,42,0.16)' },
    },
  },
  plugins: [],
};
