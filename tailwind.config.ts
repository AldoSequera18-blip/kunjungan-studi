import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // Hijau tua diambil dari warna dominan logo Tilik Pustaka
        brand: {
          50: "#f0fcf8",
          100: "#dcf9ee",
          200: "#b5f2dc",
          300: "#7ce9c1",
          400: "#3bdea2",
          500: "#1eae79",
          600: "#16835b",
          700: "#126949",
          800: "#0e5138",
          900: "#0a3b29",
          950: "#062318",
        },
        // Emas diambil dari aksen kubah & tulisan pada logo
        gold: {
          50: "#fdf7ed",
          100: "#f9ecd2",
          200: "#f3d8a5",
          300: "#ebc16f",
          400: "#e5ae42",
          500: "#e09e1f",
          600: "#bd851a",
          700: "#9d6f15",
          800: "#7e5811",
          900: "#63460d",
          950: "#3f2c09",
        },
        cream: "#fdf9ef",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Georgia", "serif"],
      },
      boxShadow: {
        soft: "0 1px 2px rgba(10, 59, 41, 0.04), 0 4px 16px rgba(10, 59, 41, 0.06)",
        card: "0 2px 8px rgba(10, 59, 41, 0.06), 0 1px 2px rgba(10, 59, 41, 0.08)",
        "card-hover": "0 12px 28px rgba(10, 59, 41, 0.12), 0 2px 6px rgba(10, 59, 41, 0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
