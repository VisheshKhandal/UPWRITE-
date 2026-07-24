import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif"
        ],
        reading: ["Charter", "Georgia", "Cambria", "Times New Roman", "serif"]
      },
      colors: {
        ink: {
          50: "#f7f7f5",
          100: "#f2f1ed",
          200: "#e5e3dd",
          300: "#c7c7bd",
          400: "#a6a39a",
          500: "#6f6f68",
          600: "#55554c",
          700: "#3d3d37",
          800: "#2a2926",
          900: "#171716",
          950: "#10100f"
        },
        accent: {
          50: "#f1f8f5",
          100: "#dcefe7",
          200: "#bce0d0",
          300: "#8fcbb2",
          400: "#5aab8b",
          500: "#348a6d",
          600: "#286e58",
          700: "#235847",
          800: "#1f473b",
          900: "#1b3b32"
        }
      },
      boxShadow: {
        soft: "0 18px 60px rgba(15, 15, 14, 0.08)",
        panel: "0 1px 2px rgba(15, 15, 14, 0.04)"
      }
    }
  },
  plugins: []
} satisfies Config;
