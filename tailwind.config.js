/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./public/index.html"],
  theme: {
    extend: {
      colors: {
        background: "var(--ft-background)",
        foreground: "var(--ft-foreground)",
        surface: "var(--ft-surface)",
        card: "var(--ft-card)",
        border: "var(--ft-border)",
        muted: "var(--ft-muted)",
        "muted-foreground": "var(--ft-muted-foreground)",
        primary: "var(--ft-primary)",
        "primary-foreground": "var(--ft-primary-fg)",
        "emerald-glow": "var(--ft-emerald)",
        warning: "var(--ft-warning)",
        info: "var(--ft-info)",
        violet: "var(--ft-violet)",
        destructive: "var(--ft-destructive)",
        ring: "var(--ft-ring)",
        input: "var(--ft-input)",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        lg: "var(--radius)",
        xl: "calc(var(--radius) + 4px)",
        "2xl": "calc(var(--radius) + 8px)",
        "3xl": "calc(var(--radius) + 12px)",
      },
    },
  },
  plugins: [],
};
