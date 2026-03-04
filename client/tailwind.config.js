/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Bleu DGCV — extrait du logo "Cadre de VIE"
        primary: {
          50:  '#eef3fb',
          100: '#d4e3f5',
          200: '#a9c7eb',
          300: '#7eabe1',
          400: '#5a90d4',
          500: '#4472c4',
          600: '#3660a8',
          700: '#274e8c',
          800: '#1a3c70',
          900: '#0d2a54',
        },
        // Vert DGCV — extrait de la feuille du logo
        forest: {
          50:  '#edf7f1',
          100: '#c8e9d4',
          500: '#2d7a3a',
          600: '#1b6b2e',
          700: '#155525',
        },
        // Sidebar navy sombre
        navy: {
          50:  '#e8eef5',
          100: '#c0d0e3',
          600: '#0b1f3a',
          700: '#081627',
          800: '#050f1a',
        },
      }
    },
  },
  plugins: [],
}
