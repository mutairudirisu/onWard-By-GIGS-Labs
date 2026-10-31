import type { Config } from "tailwindcss";

const withVar = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

export default {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: withVar("cream"),
        paper: withVar("paper"),
        ink: withVar("ink"),
        inksoft: withVar("inksoft"),
        muted: withVar("muted"),
        faint: withVar("faint"),
        line: withVar("line"),
        dash: withVar("dash"),
        lime: {
          DEFAULT: withVar("lime"),
          deep: withVar("lime-deep"),
          soft: withVar("lime-soft"),
          pale: withVar("lime-pale"),
        },
        dark: {
          DEFAULT: withVar("dark"),
          soft: withVar("dark-soft"),
        },
      },
      fontFamily: {
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
      },
      borderRadius: {
        btn: "14px",
      },
    },
  },
  plugins: [],
} satisfies Config;
