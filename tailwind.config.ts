import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        masters: {
          green: '#1E4D3D',
          dark: '#123328',
          cream: '#FAF7EF',
          gold: '#D4AF37'
        }
      },
      boxShadow: {
        soft: '0 8px 30px rgba(18, 51, 40, 0.12)'
      }
    }
  },
  plugins: []
};

export default config;
