/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#090b10",
        panel: "#121722",
        gold: "#d5aa55",
        parchment: "#d8c397",
      },
      fontFamily: {
        sans: ["Segoe UI", "Tahoma", "Arial", "sans-serif"],
        serif: ["Segoe UI", "Tahoma", "Arial", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 0 2px #f2c86b, 0 0 24px rgba(242,200,107,.65)",
      },
    },
  },
  plugins: [],
};
