import type { Config } from "tailwindcss";

export default {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: "#F6F6F0",
        paper: "#FFFFFF",
        ink: "#1D1E19",
        inksoft: "#55564C",
        muted: "#8B8C80",
        faint: "#B4B5A9",
        line: "#E7E7DE",
        dash: "#C9CABC",
        canvas: "#ECECEA",
        lime: {
          DEFAULT: "#C9F24E",
          deep: "#B4E13A",
          soft: "#EDFBC6",
          pale: "#F5FBDF",
        },
        dark: {
          DEFAULT: "#20211A",
          soft: "#2B2C23",
        },
        // status accents for admin tables/badges
        good: "#3E7C46",
        warn: "#B07A2E",
        bad: "#B4483C",
      },
      fontFamily: {
        brand: ["var(--font-comfortaa)", "Comfortaa", "cursive"],
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
      boxShadow: {
        card: "0 1px 2px rgba(29, 30, 25, 0.04)",
        lift: "0 8px 24px rgba(29, 30, 25, 0.08)",
        pop: "0 16px 48px rgba(29, 30, 25, 0.16)",
      },
      borderRadius: {
        btn: "12px",
      },
    },
  },
  plugins: [],
} satisfies Config;
