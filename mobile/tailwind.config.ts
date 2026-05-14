import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      fontFamily: {
        heading: ["PlusJakartaSans_700Bold"],
        "heading-medium": ["PlusJakartaSans_600SemiBold"],
      },
    },
  },
  plugins: [],
};

export default config;
