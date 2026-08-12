import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: "#FFFFFF",
        canvas: "#EEF1F6",
        line: "#E2E6EE",
        ink: "#111827",
        muted: "#667085",
        brand: {
          DEFAULT: "#33547E",
          dark: "#25405F",
          light: "#E9EDF5",
        },
        verified: {
          DEFAULT: "#16A34A",
          bg: "#ECFDF5",
          border: "#A7F3D0",
        },
        suggested: {
          DEFAULT: "#7C3AED",
          bg: "#F5F3FF",
          border: "#DDD6FE",
        },
        warn: {
          DEFAULT: "#B45309",
          bg: "#FFFBEB",
          border: "#FDE68A",
        },
      },
      fontFamily: {
        display: ["Fraunces", "serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 1px 2px rgba(17,24,39,0.04), 0 8px 24px rgba(17,24,39,0.06)",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
    },
  },
  plugins: [],
};

export default config;
