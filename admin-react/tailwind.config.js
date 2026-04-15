/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: {
          dim: '#0e0e0e',
          'container-lowest': '#000000',
          'container-low': '#131313',
          container: '#1a1919',
          'container-high': '#201f1f',
          'container-highest': '#262626',
          bright: '#2c2c2c',
        },
        primary: {
          DEFAULT: '#fcf9f8',
          hover: '#dfdcdb',
        },
        secondary: {
          DEFAULT: '#ac8aff',
          dim: '#8455ef',
        },
        tertiary: {
          DEFAULT: '#8ce7ff',
          dim: '#40ceed',
        },
        outline: {
          DEFAULT: '#767575',
          variant: '#484847',
        },
        'on-surface': {
          DEFAULT: '#ffffff',
          variant: '#adaaaa',
          muted: '#626060',
        },
        success: '#22c55e',
        warning: '#f59e0b',
        error: '#ff716c',
      },
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
        manrope: ['Manrope', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
