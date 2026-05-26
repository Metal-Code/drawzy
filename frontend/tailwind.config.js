/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Balonku', 'system-ui', 'sans-serif'],
        body: ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
      colors: {
        ink: 'oklch(0.18 0.02 320)',
        cream: 'oklch(0.96 0.04 90)',
        pink: 'oklch(0.70 0.25 5)',
        cyan: 'oklch(0.82 0.14 220)',
        lime: 'oklch(0.90 0.20 130)',
        yolk: 'oklch(0.88 0.18 85)',
      },
      keyframes: {
        wiggle: { '0%,100%': { transform: 'rotate(-1deg)' }, '50%': { transform: 'rotate(1deg)' } },
        bob: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-6px)' } },
        'pop-in': { '0%': { transform: 'scale(0.85)', opacity: '0' }, '100%': { transform: 'scale(1)', opacity: '1' } },
        shake: { '0%,100%': { transform: 'translateX(0)' }, '25%': { transform: 'translateX(-4px)' }, '75%': { transform: 'translateX(4px)' } },
        blink: { '0%,49%': { opacity: '1' }, '50%,100%': { opacity: '0' } },
      },
      animation: {
        wiggle: 'wiggle 0.4s ease-in-out infinite',
        bob: 'bob 2.4s ease-in-out infinite',
        'pop-in': 'pop-in 0.25s cubic-bezier(0.5,1.6,0.4,1)',
        shake: 'shake 0.18s linear infinite',
        blink: 'blink 0.8s step-end infinite',
      },
    },
  },
  plugins: [],
}
