import type { Config } from 'tailwindcss'
import forms from '@tailwindcss/forms'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['Inter', 'ui-sans-serif', 'system-ui'] },
      colors: {
        background: '#FFFFFF',
        surface: '#F0FDF4',
        primary: '#16A34A',
        'dark-green': '#166534',
        'border-green': '#BBF7D0',
        'text-primary': '#0F172A',
        'text-secondary': '#475569',
        danger: '#DC2626',
        warning: '#F59E0B',
      },
      borderRadius: { card: '12px' },
      boxShadow: {
        card: '0 1px 4px 0 rgba(22,163,74,0.08), 0 1px 2px -1px rgba(0,0,0,0.04)',
      },
    },
  },
  plugins: [forms],
} satisfies Config
