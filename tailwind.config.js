/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#0B0F17',
        surface: 'rgba(255, 255, 255, 0.03)',
        'surface-border': 'rgba(255, 255, 255, 0.08)',
        recessed: 'rgba(0, 0, 0, 0.4)',
      },
    },
  },
  plugins: [],
};
