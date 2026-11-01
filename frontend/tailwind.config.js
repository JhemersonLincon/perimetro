/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Space Grotesk"', "Arial", "sans-serif"],
        sans: ['"Space Grotesk"', "Arial", "sans-serif"],
        mono: ['"DM Mono"', "monospace"],
      },
      colors: {
        ink: "#172e28",
        deep: "#16332c",
        cream: "#f6f1e4",
        paper: "#fffdf4",
        lime: "#d8ff72",
        coral: "#fa775d",
        peach: "#ffd2bb",
        sage: "#849687",
        obsidian: {
          950: "#122923",
          900: "#16332c",
          800: "#1d4037",
          700: "#265247",
        },
        amber: {
          200: "#ebffab",
          300: "#d8ff72",
          400: "#d8ff72",
          500: "#d8ff72",
          600: "#c2f04d",
        },
        rose: {
          200: "#ffd2bb",
          300: "#ff9b87",
          400: "#fa775d",
          500: "#fa775d",
          600: "#e85d42",
          950: "#381c18",
        },
        zinc: {
          100: "#fffdf4",
          200: "#f6f1e4",
          300: "#e2e9d8",
          400: "#b8c9bc",
          500: "#849687",
          600: "#587066",
          700: "#294d42",
          800: "#172e28",
          900: "#122620",
        },
      },
      boxShadow: {
        neo: "5px 5px 0 #172e28",
        "neo-lg": "8px 8px 0 #172e28",
        "neo-sm": "3px 3px 0 #172e28",
        "neo-dark": "6px 6px 0 #0b1c17",
        "neo-coral": "5px 5px 0 #fa775d",
        "neo-lime": "5px 5px 0 #d8ff72",
      },
    },
  },
  plugins: [],
};
