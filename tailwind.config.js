/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./public/index.html"],
  theme: {
    extend: {
      colors: {
        background: "var(--ft-background)",
        foreground: "var(--ft-foreground)",
        surface: "var(--ft-surface)",
        border: "var(--ft-border)",
        muted: "var(--ft-muted)",
        "muted-foreground": "var(--ft-muted-foreground)",
        "emerald-glow": "var(--ft-emerald)",
        warning: "var(--ft-warning)",
        info: "var(--ft-info)",
        violet: "var(--ft-violet)",
        destructive: "var(--ft-destructive)",
        "primary-foreground": "var(--ft-primary-fg)",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1rem",
        "3xl": "1.25rem",
      },
    },
  },
  plugins: [],
};
