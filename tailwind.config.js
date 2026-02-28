/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        war: {
          bg: "#000000",
          surface: "#000000",
          border: "#0d0d0d",
          muted: "#737373",
          accent: "#ffffff",
          "accent-dim": "#525252",
          white: "#ffffff",
        },
      },
      fontFamily: {
        sans: ["-apple-system", "BlinkMacSystemFont", "SF Pro Text", "Segoe UI", "system-ui", "sans-serif"],
        mono: ["SF Mono", "ui-monospace", "monospace"],
      },
      fontWeight: {
        normal: "400",
        medium: "500",
        semibold: "600",
      },
    },
  },
  plugins: [],
};
