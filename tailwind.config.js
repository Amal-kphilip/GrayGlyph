/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        serifDisplay: ["Cormorant Garamond", "serif"],
        sans: ["Sora", "sans-serif"]
      },
      boxShadow: {
        glass: "0 18px 48px rgba(18, 21, 28, 0.16)",
        cta: "0 12px 24px rgba(213, 108, 79, 0.25)"
      },
      colors: {
        ink: "#12151c",
        "ink-soft": "#3e4a5f",
        muted: "#6a768d",
        accent: "#d56c4f",
        "accent-dark": "#b7543a"
      }
    }
  },
  plugins: []
};
