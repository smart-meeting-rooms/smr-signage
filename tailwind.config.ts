import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        smr: {
          dark: '#0a0a0f',
          card: '#12121a',
          border: '#1e1e2e',
          accent: '#3b82f6',
          gold: '#f59e0b',
          text: '#e2e8f0',
          muted: '#64748b',
        },
      },
    },
  },
  plugins: [],
};

export default config;
