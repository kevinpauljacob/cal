import type { Config } from "tailwindcss";
import lineClamp from "@tailwindcss/line-clamp";
import { Righteous } from "next/font/google";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      fontFamily: {
        lexend: ["var(--font-lexend)", "sans-serif"],
        akshar: ["var(--font-akshar)", "sans-serif"],
        roboto: ["var(--font-roboto)", "sans-serif"],
        ibmMono: ["var(--font-ibm-mono)", "monospace"],
        chakra: ["var(--font-chakra)", "sans-serif"],
        inter: ["var(--font-inter)", "sans-serif"],
        alata: ["var(--font-alata)", "sans-serif"],
        righteous: ["var(--font-righteous)", "cursive"],
      },
    },
  },
  plugins: [lineClamp],
} satisfies Config;
