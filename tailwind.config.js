/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: '#f8f9ff',
          dim: '#cbdbf5',
          bright: '#f8f9ff',
          'container-lowest': '#ffffff',
          'container-low': '#eff4ff',
          container: '#e5eeff',
          'container-high': '#dce9ff',
          'container-highest': '#d3e4fe',
          variant: '#d3e4fe',
        },
        'on-surface': {
          DEFAULT: '#0b1c30',
          variant: '#43474d',
        },
        'inverse-surface': '#213145',
        'inverse-on-surface': '#eaf1ff',
        outline: {
          DEFAULT: '#74777e',
          variant: '#c3c6ce',
          border: '#cbd5e1',
          subtle: '#e2e8f0',
        },
        'surface-tint': '#49607c',
        primary: {
          DEFAULT: '#001428',
          container: '#0f2942',
          'on-container': '#7991af',
          fixed: '#d1e4ff',
          'fixed-dim': '#b0c9e8',
        },
        'on-primary': '#ffffff',
        'inverse-primary': '#b0c9e8',
        secondary: {
          DEFAULT: '#006a61',
          emerald: '#0d9488',
          vibrant: '#10b981',
          container: '#86f2e4',
          'on-container': '#006f66',
          fixed: '#89f5e7',
          'fixed-dim': '#6bd8cb',
        },
        'on-secondary': '#ffffff',
        tertiary: {
          DEFAULT: '#220e00',
          container: '#401f00',
          'on-container': '#d77503',
          saffron: '#d97706',
          amber: '#f59e0b',
          fixed: '#ffdcc3',
          'fixed-dim': '#ffb77d',
        },
        'on-tertiary': '#ffffff',
        error: {
          DEFAULT: '#ba1a1a',
          container: '#ffdad6',
          'on-container': '#93000a',
        },
        'on-error': '#ffffff',
        background: '#f8f9ff',
        'on-background': '#0b1c30',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', '"Noto Sans Telugu"', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', '"Noto Sans Telugu"', 'sans-serif'],
        body: ['"Atkinson Hyperlegible Next"', '"Atkinson Hyperlegible"', '"Noto Sans Telugu"', 'sans-serif'],
        telugu: ['"Noto Sans Telugu"', 'sans-serif'],
      },
      borderRadius: {
        sm: '0.5rem',
        DEFAULT: '1rem',
        md: '1.5rem',
        lg: '2rem',
        xl: '3rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
        full: '9999px',
      },
      boxShadow: {
        'tactile': '0px 4px 12px rgba(15, 41, 66, 0.06)',
        'tactile-hover': '0px 8px 20px rgba(15, 41, 66, 0.10)',
        'elevated': '0px 12px 28px rgba(15, 41, 66, 0.12)',
        'floating': '0px 16px 36px rgba(15, 41, 66, 0.16)',
      },
      minHeight: {
        'touch': '56px',
        'input': '58px',
      },
      minWidth: {
        'touch': '56px',
      }
    },
  },
  plugins: [],
}
