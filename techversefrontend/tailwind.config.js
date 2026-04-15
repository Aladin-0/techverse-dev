/** @type {import('tailwindcss').Config} */
export default {
  // Tell Tailwind v3 JIT exactly where to find class names
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      // Preserve custom brand tokens so they're always available
      colors: {
        brand: {
          orange:  '#FF5A1F',
          gold:    '#D4922A',
          navy:    '#1C2B4A',
          cream:   '#FAF9F5',
          ink:     '#1A1814',
          muted:   '#8A8279',
        },
      },
      fontFamily: {
        outfit: ['Outfit', 'sans-serif'],
        inter:  ['Inter',  'sans-serif'],
      },
      keyframes: {
        'border-pulse': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%':       { backgroundPosition: '100% 50%' },
        },
      },
      animation: {
        'border-pulse': 'border-pulse 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
