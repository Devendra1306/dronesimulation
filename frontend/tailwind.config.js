/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Base surfaces
        surface: {
          0: '#080a0e',   // deepest background
          1: '#0d1117',   // main background  
          2: '#111620',   // panel background
          3: '#161d2a',   // elevated panel
          4: '#1c2537',   // card/widget
          5: '#232e42',   // hover state
        },
        // Borders
        border: {
          subtle: '#1e2a3a',
          DEFAULT: '#253347',
          strong: '#2d3f57',
        },
        // Text
        text: {
          primary: '#e8edf5',
          secondary: '#8fa3bd',
          muted: '#4d6380',
          disabled: '#2d3f57',
        },
        // Accent - electric blue
        accent: {
          DEFAULT: '#1a9fd4',
          light: '#2ab8f0',
          dark: '#127faa',
          glow: 'rgba(26, 159, 212, 0.15)',
        },
        // Status colors
        status: {
          green: '#22c55e',
          'green-dim': 'rgba(34, 197, 94, 0.12)',
          amber: '#f59e0b',
          'amber-dim': 'rgba(245, 158, 11, 0.12)',
          red: '#ef4444',
          'red-dim': 'rgba(239, 68, 68, 0.12)',
          blue: '#3b82f6',
          'blue-dim': 'rgba(59, 130, 246, 0.12)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '1rem' }],
        xs: ['0.6875rem', { lineHeight: '1rem', letterSpacing: '0.08em' }],
        sm: ['0.75rem', { lineHeight: '1.25rem' }],
        base: ['0.875rem', { lineHeight: '1.5rem' }],
        md: ['1rem', { lineHeight: '1.5rem' }],
        lg: ['1.125rem', { lineHeight: '1.75rem' }],
        xl: ['1.375rem', { lineHeight: '2rem' }],
        '2xl': ['1.75rem', { lineHeight: '2.25rem', letterSpacing: '-0.02em' }],
      },
      borderRadius: {
        sm: '4px',
        DEFAULT: '6px',
        md: '8px',
        lg: '10px',
        xl: '12px',
        '2xl': '16px',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-in': 'slideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        slideIn: { from: { opacity: '0', transform: 'translateY(6px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
