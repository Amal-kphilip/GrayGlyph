/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-body)", "Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        heading: ["var(--font-heading)", "Space Grotesk", "ui-sans-serif", "system-ui", "sans-serif"],
        serifDisplay: ["var(--font-heading)", "Space Grotesk", "ui-sans-serif", "system-ui", "sans-serif"]
      },
      boxShadow: {
        glass: "0 22px 70px rgba(3, 8, 20, 0.6)",
        cta: "0 16px 42px rgba(96, 165, 250, 0.28)",
        soft: "0 16px 48px rgba(3, 8, 20, 0.45)"
      },
      keyframes: {
        moveVertical: {
          "0%": { transform: "translate3d(0, -50%, 0)" },
          "50%": { transform: "translate3d(0, 50%, 0)" },
          "100%": { transform: "translate3d(0, -50%, 0)" }
        },
        moveInCircle: {
          "0%": { transform: "rotate(0deg)" },
          "50%": { transform: "rotate(180deg)" },
          "100%": { transform: "rotate(360deg)" }
        },
        moveHorizontal: {
          "0%": { transform: "translate3d(-50%, -10%, 0)" },
          "50%": { transform: "translate3d(50%, 10%, 0)" },
          "100%": { transform: "translate3d(-50%, -10%, 0)" }
        }
      },
      animation: {
        first: "moveVertical 30s ease infinite",
        second: "moveInCircle 20s reverse infinite",
        third: "moveInCircle 40s linear infinite",
        fourth: "moveHorizontal 40s ease infinite",
        fifth: "moveInCircle 20s ease infinite"
      },
      colors: {
        shell: "var(--bg-primary)",
        ink: "var(--text-primary)",
        "ink-soft": "var(--text-secondary)",
        muted: "var(--text-secondary)",
        accent: "var(--accent)",
        "accent-dark": "var(--accent-soft)"
      }
    }
  },
  plugins: []
};
