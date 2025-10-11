import type { Config } from 'tailwindcss';
import { tailwindColorPalette } from './src/app/theme/colors';

const config: Config = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: tailwindColorPalette,
      fontFamily: {
        display: ['AnglicanText', 'serif'],
        decorative: ['Canterbury', 'serif'],
        body: ['"TeX Gyre Schola"', 'serif'],
        'myth-number': ['AnglicanText', 'serif'],
      },
    },
  },
  plugins: [],
};

export default config;
