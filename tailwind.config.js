/** @type {import('tailwindcss').Config} */
export default {
  content: ['src/**/*.{html,ts}'],
  plugins: [require('daisyui')],
  darkMode: ['selector', '[data-theme="dark"]'],
  daisyui: {
    logs: false,
    themes: [
      {
        light: {
          ...require('daisyui/src/theming/themes')['emerald'],
        },
        dark: {
          ...require('daisyui/src/theming/themes')['dark'],
        },
      },
    ],
  },
  theme: {
    extend: {
      fontSize: {
        tiny: ['0.625rem', '0.75rem'],
      },
    },
  },
};
