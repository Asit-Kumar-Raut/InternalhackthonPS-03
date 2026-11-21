import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#FFFFFF',
        surface: '#F0FDF4',
        primary: {
          DEFAULT: '#16A34A',
          dark: '#166534',
        },
        border: {
          light: '#BBF7D0',
        },
        text: {
          DEFAULT: '#0F172A',
          secondary: '#475569',
        },
        danger: '#DC2626',
        warning: '#F59E0B',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '12px',
      },
      minHeight: {
        touch: '48px',
      },
      minWidth: {
        touch: '48px',
      },
    },
  },
  plugins: [],
}

export default config
