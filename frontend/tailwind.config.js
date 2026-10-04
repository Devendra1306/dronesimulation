/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Workspace and card surfaces (Light/Dark hybrid system)
        workspace: '#F7F9FC',
        card: '#FFFFFF',
        surface: {
          0: '#FFFFFF',
          1: '#F7F9FC',   // Main light workspace
          2: '#FFFFFF',   // Card / panel surface
          3: '#F1F5F9',   // Light muted container / elevated input
          4: '#E2E8F0',   // Border / divider
          5: '#CBD5E1',   // Hover state on light
        },
        // Dedicated dark containers for Sidebar & Top Nav
        darknav: {
          sidebar: '#0F172A',
          header: '#111827',
          surface: '#1E293B',
          border: '#1E293B',
        },
        // Borders
        border: {
          subtle: '#F1F5F9',
          DEFAULT: '#E2E8F0',
          strong: '#CBD5E1',
        },
        // Text hierarchy on light workspace
        text: {
          primary: '#0F172A',   // Slate 900
          secondary: '#475569', // Slate 600
          muted: '#94A3B8',     // Slate 400
          disabled: '#CBD5E1',
        },
        // Brand & Accents
        accent: {
          DEFAULT: '#0EA5E9',   // Sky blue (Primary)
          light: '#38BDF8',
          dark: '#0284C7',
          glow: 'rgba(14, 165, 233, 0.15)',
        },
        secondary: {
          DEFAULT: '#2563EB',   // Royal blue
          light: '#3B82F6',
          dark: '#1D4ED8',
        },
        // Status colors
        status: {
          green: '#16A34A',
          'green-dim': 'rgba(22, 163, 74, 0.10)',
          amber: '#F59E0B',
          'amber-dim': 'rgba(245, 158, 11, 0.10)',
          red: '#EF4444',
          'red-dim': 'rgba(239, 68, 68, 0.10)',
          blue: '#2563EB',
          'blue-dim': 'rgba(37, 99, 235, 0.10)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        card: '0 4px 20px rgba(15, 23, 42, 0.05)',
        'card-hover': '0 10px 25px rgba(15, 23, 42, 0.08)',
        subtle: '0 1px 3px rgba(15, 23, 42, 0.04)',
      },
      borderRadius: {
        sm: '6px',
        DEFAULT: '8px',
        md: '10px',
        lg: '12px',
        xl: '14px',
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
