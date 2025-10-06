/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        'sans': ['var(--font-geist-mono)', 'monospace'],
        'serif': ['var(--font-tasa-orbiter)', 'sans-serif'],
      },
      letterSpacing: {
        'header': '-0.04em',
      },
      fontSize: {
        'hero': '4.5rem',
        'heading': '3rem',
      },
    },
  },
  plugins: [],
}