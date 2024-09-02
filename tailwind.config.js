/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['src/**/*.{html,ts}'],
  plugins: [require('daisyui')],
  darkMode: ['selector', '[data-theme="dark"]'],
  daisyui: {
    themes: [
      {
        light: {
          ...require('daisyui/src/theming/themes')['emerald'],
        },
        dark: {
          ...require('daisyui/src/theming/themes')['dim'],
        },
      },
    ],
  },
  theme: {
    extend: {},
  },
};
