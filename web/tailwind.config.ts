import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
    "./store/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#faf5ff",
          100: "#f3e8ff",
          200: "#e9d5ff",
          300: "#d8b4fe",
          400: "#c084fc",
          500: "#a855f7",
          600: "#9333ea",
          700: "#7e22ce",
          800: "#6b21a8",
          900: "#581c87",
          950: "#3b0764",
        },
        gold: {
          50: "#fffbeb",
          100: "#fef3c7",
          200: "#fde68a",
          300: "#fcd34d",
          400: "#fbbf24",
          500: "#f59e0b",
          600: "#d97706",
          700: "#b45309",
          800: "#92400e",
          900: "#78350f",
          950: "#451a03",
        },
      },
      fontFamily: {
        sans: ["var(--font-jakarta)", "Inter", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Georgia", "serif"],
      },
      borderWidth: {
        "3": "3px",
      },
      boxShadow: {
        "glow-xs":    "0 0 14px -4px rgb(168 85 247 / 0.5)",
        "glow-sm":    "0 0 28px -6px rgb(168 85 247 / 0.45)",
        "glow":       "0 0 52px -12px rgb(168 85 247 / 0.55)",
        "glow-lg":    "0 0 88px -20px rgb(168 85 247 / 0.6)",
        "glow-xl":    "0 0 130px -30px rgb(168 85 247 / 0.65)",
        "glow-gold":  "0 0 44px -10px rgb(245 158 11 / 0.5)",
        "aurora":     "0 0 80px -20px rgb(168 85 247 / 0.45), 0 0 40px -10px rgb(99 102 241 / 0.3)",
        "card":       "0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.06)",
        "card-hover": "0 8px 32px -8px rgb(0 0 0 / 0.18), 0 2px 8px -2px rgb(0 0 0 / 0.1)",
        "float":      "0 24px 64px -16px rgb(0 0 0 / 0.35), 0 8px 24px -8px rgb(0 0 0 / 0.2)",
        "lift":       "0 40px 80px -20px rgb(0 0 0 / 0.45), 0 16px 40px -12px rgb(0 0 0 / 0.28)",
        "inner-bright": "inset 0 1px 0 0 rgb(255 255 255 / 0.1)",
        "inner-brand":  "inset 0 0 0 1px rgb(168 85 247 / 0.2)",
        "depth":        "0 2px 4px rgb(0 0 0 / 0.1), 0 8px 16px rgb(0 0 0 / 0.1), 0 16px 32px rgb(0 0 0 / 0.08)",
      },
      backgroundImage: {
        "gradient-brand":        "linear-gradient(135deg, #c084fc 0%, #a855f7 45%, #7e22ce 100%)",
        "gradient-gold":         "linear-gradient(135deg, #fbbf24 0%, #f59e0b 60%, #d97706 100%)",
        "gradient-aurora":       "linear-gradient(135deg, #a855f7 0%, #6366f1 40%, #0ea5e9 75%, #10b981 100%)",
        "gradient-brand-subtle": "linear-gradient(135deg, rgba(168,85,247,0.15) 0%, rgba(99,102,241,0.08) 100%)",
        "shimmer":               "linear-gradient(105deg, transparent 40%, rgb(255 255 255 / 0.07) 50%, transparent 60%)",
        "mesh-brand":            "radial-gradient(at 30% 15%, rgba(168,85,247,0.18) 0px, transparent 55%), radial-gradient(at 85% 5%, rgba(99,102,241,0.12) 0px, transparent 50%), radial-gradient(at 5% 65%, rgba(124,58,237,0.1) 0px, transparent 50%), radial-gradient(at 75% 80%, rgba(168,85,247,0.08) 0px, transparent 50%)",
        "grid-lines":            "linear-gradient(rgba(255,255,255,0.028) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.028) 1px, transparent 1px)",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in": {
          from: { opacity: "0", transform: "translateX(-12px)" },
          to:   { opacity: "1", transform: "translateX(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.95)" },
          to:   { opacity: "1", transform: "scale(1)" },
        },
        shimmer: {
          from: { backgroundPosition: "200% center" },
          to:   { backgroundPosition: "-200% center" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 20px -6px rgb(168 85 247 / 0.3)" },
          "50%":      { boxShadow: "0 0 52px -6px rgb(168 85 247 / 0.75)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%":      { transform: "translateY(-5px)" },
        },
        aurora: {
          "0%, 100%": { opacity: "0.7", transform: "scale(1) rotate(0deg)" },
          "33%":      { opacity: "1",   transform: "scale(1.08) rotate(120deg)" },
          "66%":      { opacity: "0.85",transform: "scale(0.95) rotate(240deg)" },
        },
        "spin-slow": {
          from: { transform: "rotate(0deg)" },
          to:   { transform: "rotate(360deg)" },
        },
        ticker: {
          from: { transform: "translateX(0)" },
          to:   { transform: "translateX(-50%)" },
        },
        "reveal-up": {
          from: { opacity: "0", transform: "translateY(32px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-in":   "fade-in 0.35s ease-out",
        "slide-in":  "slide-in 0.28s ease-out",
        "scale-in":  "scale-in 0.22s ease-out",
        shimmer:     "shimmer 3s linear infinite",
        "pulse-glow":"pulse-glow 2.5s ease-in-out infinite",
        float:       "float 3.5s ease-in-out infinite",
        aurora:      "aurora 14s ease-in-out infinite",
        "spin-slow":  "spin-slow 18s linear infinite",
        ticker:       "ticker 35s linear infinite",
        "reveal-up":  "reveal-up 0.65s ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;
