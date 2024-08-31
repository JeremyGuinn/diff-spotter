/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['src/**/*.{html,ts}'],
  plugins: [require('daisyui')],
  darkMode: ['selector', '[data-theme="dark"]'],
  daisyui: {
    themes: ['light', 'dark'],
  },
  theme: {
    extend: {},
  },
};
