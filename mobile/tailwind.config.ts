import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./constants/**/*.{ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      fontFamily: {
        heading: ["PlusJakartaSans_700Bold"],
        "heading-medium": ["PlusJakartaSans_600SemiBold"],
      },
      // Bronze accent scale anchored on the Museum accent (#C4862A). Used by the
      // admin screens for primary actions, active tabs, and selection states.
      // Without this, every `brand-*` utility silently no-ops (invisible links,
      // unstyled active tabs, dead selection highlights).
      colors: {
        brand: {
          50: "#FBF3E6",
          100: "#F5E4C4",
          200: "#EBCB94",
          300: "#E0B264",
          400: "#D89A3A",
          500: "#C4862A",
          600: "#A66E1C",
          700: "#8B5E1A",
          800: "#6E4A14",
          900: "#4A310D",
        },
      },
    },
  },
  plugins: [],
};

export default config;
