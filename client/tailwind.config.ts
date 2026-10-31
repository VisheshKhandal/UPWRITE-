import type { Config } from "tailwindcss";

const interfaceFontStack = [
  "Inter",
  "ui-sans-serif",
  "system-ui",
  "-apple-system",
  "BlinkMacSystemFont",
  "Segoe UI",
  "sans-serif"
];

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        // One consistent sans-serif family across UI, reading, and writing surfaces.
        sans: interfaceFontStack,
        reading: interfaceFontStack,
        mono: [
          "JetBrains Mono",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "monospace"
        ]
      },
      fontSize: {
        // Restrained typographic hierarchy aligned to a 4px line-height rhythm
        "article-title": ["clamp(1.75rem, 2.4vw, 2.25rem)", { lineHeight: "1.2", letterSpacing: "-0.022em", fontWeight: "600" }],
        "page-title": ["clamp(1.5rem, 1.9vw, 1.75rem)", { lineHeight: "1.25", letterSpacing: "-0.018em", fontWeight: "600" }],
        "section-title": ["1.125rem", { lineHeight: "1.4", letterSpacing: "-0.012em", fontWeight: "600" }],
        subheading: ["1rem", { lineHeight: "1.5", letterSpacing: "-0.006em", fontWeight: "600" }],
        "body-reading": ["1.0625rem", { lineHeight: "1.75" }],
        body: ["0.9375rem", { lineHeight: "1.6" }],
        meta: ["0.8125rem", { lineHeight: "1.45" }],
        label: ["0.8125rem", { lineHeight: "1.4", fontWeight: "500" }]
      },
      colors: {
        // Semantic tokens backed by CSS custom properties in index.css
        canvas: "var(--bg-canvas)",
        "on-accent": "var(--text-on-accent)",
        surface: {
          DEFAULT: "var(--bg-surface)",
          subtle: "var(--bg-surface-subtle)",
          elevated: "var(--bg-surface-elevated)",
          hover: "var(--bg-interactive-hover)",
          active: "var(--bg-interactive-active)"
        },
        border: {
          subtle: "var(--border-subtle)",
          DEFAULT: "var(--border-default)",
          strong: "var(--border-strong)",
          accent: "var(--border-accent)"
        },
        content: {
          primary: "var(--text-primary)",
          secondary: "var(--text-secondary)",
          muted: "var(--text-muted)",
          "on-accent": "var(--text-on-accent)",
          accent: "var(--accent-text)"
        },
        // Calibrated neutral scale with cool-mineral undertone and WCAG AA secondary/muted contrast
        ink: {
          50: "#f6f7f6",
          100: "#eef1ef",
          200: "#dfe4e1",
          300: "#c4ccc8",
          400: "#94a09b",
          500: "#56615d",
          600: "#3d4643",
          700: "#2b3230",
          800: "#222725",
          900: "#141716",
          950: "#0d0f0e"
        },
        // Restrained mint/teal accent scale
        accent: {
          DEFAULT: "var(--accent-primary)",
          hover: "var(--accent-hover)",
          active: "var(--accent-active)",
          subtle: "var(--accent-subtle)",
          text: "var(--accent-text)",
          50: "#ebf5f1",
          100: "#d4ebe2",
          200: "#add8c8",
          300: "#79c0a6",
          400: "#58c09d",
          500: "#45b28d",
          600: "#246b53",
          700: "#1d5844",
          800: "#184636",
          900: "#13372b",
          950: "#0b211a"
        }
      },
      borderColor: {
        subtle: "var(--border-subtle)",
        DEFAULT: "var(--border-default)",
        default: "var(--border-default)",
        strong: "var(--border-strong)",
        accent: "var(--border-accent)"
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)"
      },
      boxShadow: {
        panel: "var(--shadow-panel)",
        soft: "var(--shadow-soft)",
        elevated: "var(--shadow-elevated)"
      }
    }
  },
  plugins: []
} satisfies Config;
