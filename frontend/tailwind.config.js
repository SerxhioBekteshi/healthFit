/** @type {import('tailwindcss').Config} */
const token = (name) => `rgb(var(--c-${name}) / <alpha-value>)`;

// Values live in globals.css: the landing keeps its own palette, `.app-shell` swaps it per theme.
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: token('ink'),
        graphite: token('graphite'),
        bone: token('bone'),
        signal: token('signal'),
        white: token('white'),
        panel: token('panel'),
        danger: token('danger'),
        warn: token('warn'),
        info: token('info'),
      },
      fontFamily: {
        display: [
          '"Iowan Old Style"',
          '"Palatino Linotype"',
          'Palatino',
          'Georgia',
          'serif',
        ],
      },
      keyframes: {
        marquee: {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(-50%)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-14px)' },
        },
        'ping-slow': {
          '0%': { transform: 'scale(0.6)', opacity: '0.7' },
          '100%': { transform: 'scale(2.2)', opacity: '0' },
        },
        'spin-slow': { to: { transform: 'rotate(360deg)' } },
        'scroll-cue': {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'grow-up': {
          from: { transform: 'scaleY(0)' },
          to: { transform: 'scaleY(1)' },
        },
        'row-in': {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        marquee: 'marquee 40s linear infinite',
        float: 'float 7s ease-in-out infinite',
        'ping-slow': 'ping-slow 3.2s cubic-bezier(0, 0, 0.2, 1) infinite',
        'spin-slow': 'spin-slow 120s linear infinite',
        'scroll-cue': 'scroll-cue 2.2s cubic-bezier(0.65, 0, 0.35, 1) infinite',
        'fade-up': 'fade-up 0.5s cubic-bezier(0.22, 1, 0.36, 1) both',
        'grow-up': 'grow-up 0.7s cubic-bezier(0.22, 1, 0.36, 1) both',
        'row-in': 'row-in 0.35s cubic-bezier(0.22, 1, 0.36, 1) both',
      },
    },
  },
  plugins: [],
};
