import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        surface: "var(--surface)",
        "surface-2": "var(--surface-2)",
        "surface-3": "var(--surface-3)",
        border: "var(--border)",
        "border-light": "var(--border-light)",
        text: "var(--text)",
        muted: "var(--text-muted)",
        subtle: "var(--text-subtle)",
        brand: "var(--brand)",
        "brand-light": "var(--brand-light)",
        "brand-dim": "var(--brand-dim)",
        "brand-2": "var(--brand-2)",
        success: "var(--success)",
        "success-dim": "var(--success-dim)",
        warning: "var(--warning)",
        "warning-dim": "var(--warning-dim)",
        danger: "var(--danger)",
        "danger-dim": "var(--danger-dim)"
      },
      boxShadow: {
        xs: "var(--shadow-xs)",
        sm: "var(--shadow-sm)",
        soft: "var(--shadow)",
        lg: "var(--shadow-lg)",
        brand: "var(--shadow-brand)"
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        DEFAULT: "var(--radius)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)"
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"]
      },
      fontSize: {
        "2xs": ["0.65rem", { lineHeight: "1rem" }]
      },
      transitionTimingFunction: {
        spring: "cubic-bezier(0.16, 1, 0.3, 1)"
      }
    }
  },
  plugins: []
} satisfies Config;
