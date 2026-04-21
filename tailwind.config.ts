import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: "#080c18",
          panel: "#0f1424",
        },
        cyan: {
          DEFAULT: "#00D4FF",
          soft: "rgba(0,212,255,0.12)",
          ring: "rgba(0,212,255,0.25)",
        },
        mint: {
          DEFAULT: "#00E5A0",
        },
        amber: {
          DEFAULT: "#FFB830",
        },
        coral: {
          DEFAULT: "#FF6B6B",
        },
        purple: {
          DEFAULT: "#B794F4",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl: "14px",
        "2xl": "16px",
        "3xl": "20px",
      },
      animation: {
        "fade-up": "fadeUp 0.5s ease both",
        "pulse-soft": "pulseSoft 2s ease-in-out infinite",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.4" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
