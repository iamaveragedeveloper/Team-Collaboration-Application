/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    // Correctly point to all necessary files within the src directory
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
      },
      // Adding a simple animation for notifications as a polish step
      keyframes: {
        'fade-in-out': {
          '0%': { opacity: '0', transform: 'translateX(100%)' },
          '15%': { opacity: '1', transform: 'translateX(0)' },
          '85%': { opacity: '1', transform: 'translateX(0)' },
          '100%': { opacity: '0', transform: 'translateX(100%)' },
        },
      },
      animation: {
        'fade-in-out': 'fade-in-out 5s ease-in-out forwards',
      },
    },
  },
  plugins: [],
}
