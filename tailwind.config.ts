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
        canvas: "#FAFAFA",
        line: "#E5E7EB",
        ink: "#111827",
        muted: "#6B7280",
        brand: {
          DEFAULT: "#2563EB",
          dark: "#1D4ED8",
          light: "#EFF4FF",
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
        display: ["var(--font-fraunces)", "serif"],
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
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
