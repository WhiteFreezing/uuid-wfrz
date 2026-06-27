import type { Config } from "tailwindcss";
export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: { extend: {
    colors: {
      ink: "#0a0b0d", surface: "#15171b", muted: "#1d2026", border: "#2a2e36",
      text: "#e8eaef", dim: "#8b9099",
      brand: { DEFAULT: "#8b5cf6", soft: "#a78bfa", deep: "#6d28d9" },
    },
    fontFamily: { sans: ["Inter","system-ui"], mono: ["JetBrains Mono","ui-monospace"] },
  } },
} satisfies Config;
