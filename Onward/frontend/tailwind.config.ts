import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#101108",
        dark: "#20211A",
        night: "#0C0D08",
        cream: "#F7F7F2",
        mist: "#F4F6F3",
        paper: "#FFFFFF",
        line: "#E6E7E0",
        muted: "#86877B",
        faint: "#B4B5A9",
        lime: {
          DEFAULT: "#C9F24E",
          deep: "#B4E13A",
          soft: "#EDFBC6",
          pale: "#F3FAD9",
        },
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
        card: "0 2px 8px rgba(16,17,8,0.05)",
        lift: "0 24px 60px rgba(16,17,8,0.12)",
      },
    },
  },
  plugins: [],
} satisfies Config;
