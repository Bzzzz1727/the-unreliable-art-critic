/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        panel: 'var(--panel)',
        text: 'var(--text)',
        muted: 'var(--muted)',
        border: 'var(--border)',
        accent: 'var(--accent)',
        bubble: 'var(--bubble)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Cormorant Garamond', 'Georgia', 'serif'],
        mono: ['Space Mono', 'JetBrains Mono', 'Courier', 'monospace'],
      },
      boxShadow: {
        'sticker': '2px 2px 0px var(--border)',
        'sticker-lg': '3.5px 3.5px 0px var(--border)',
        'sticker-hover': '3px 3px 0px var(--accent)',
      }
    },
  },
  plugins: [],
}
