/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-body)", "Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        heading: ["var(--font-heading)", "Space Grotesk", "ui-sans-serif", "system-ui", "sans-serif"]
      },
      colors: {
        paper: "var(--paper)",
        ink: "var(--ink)",
        "ink-soft": "var(--ink-soft)",
        muted: "var(--muted)",
        accent: "var(--red)",
        "accent-dark": "var(--red-dark)"
      },
      boxShadow: {
        soft: "0 8px 25px rgba(17, 17, 17, 0.045)"
      }
    }
  },
  plugins: []
};
