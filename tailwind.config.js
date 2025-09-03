/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'app-light-card': '#FEFBF5',
        'app-light-bg': '#F4F0E8',
        'app-dark-bg': '#101223',
        'app-light-text': '#1A202C',
        'app-dark-text': '#E2E8F0',
        'app-light-accent': '#3498DB',
        'app-dark-accent': '#6C5CE7',
        'app-dark-card-bg': '#1A1D37',
        'app-light-border': '#E2E8F0',
        'app-dark-border': '#2D3748',
      }
    },
  },
  plugins: [],
}