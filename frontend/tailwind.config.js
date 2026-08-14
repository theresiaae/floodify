/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Biru — kedalaman air, kepercayaan, data
        deep: {
          950: '#04202c',
          900: '#0a3040',
          800: '#0f4c5c',
          700: '#146678',
          600: '#1b7f94',
          500: '#2699b0',
          400: '#5cb8c9',
          300: '#96d3dd',
          200: '#c9e9ed',
          100: '#e8f5f6',
        },
        // Hijau sage — daratan, vegetasi, mitigasi
        sage: {
          900: '#3a4a3a',
          800: '#4d6350',
          700: '#607a63',
          600: '#748f76',
          500: '#8fa891',
          400: '#aec2af',
          300: '#cddaca',
          200: '#e3ebe0',
          100: '#f1f5ef',
        },
        sand: '#f6f4ee',
        alert: {
          high: '#c1543a',
          mid: '#d99a3c',
          low: '#4d8f6f',
        }
      },
      fontFamily: {
        display: ['"Fraunces"', 'serif'],
        body: ['"Inter"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      backgroundImage: {
        'topo': "radial-gradient(circle at 1px 1px, rgba(15,76,92,0.08) 1px, transparent 0)",
      },
    },
  },
  plugins: [],
}
