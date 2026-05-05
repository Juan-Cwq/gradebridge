import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          airy: "var(--color-brand-airy)",
          structure: "var(--color-brand-structure)",
          balance: "var(--color-brand-balance)",
          innovation: "var(--color-brand-innovation)",
          trust: "var(--color-brand-trust)",
          depth: "var(--color-brand-depth)",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["DM Serif Display", "serif"],
      },
      animation: {
        shimmer: "shimmer 2s linear infinite",
        "sync-pulse": "syncPulse 1.5s ease-in-out infinite",
        "check-pop": "checkPop 0.4s ease-out forwards",
        "slide-up-fade": "slideUpFade 0.5s ease-out forwards",
      },
      keyframes: {
        shimmer: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
        syncPulse: {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.7", transform: "scale(0.98)" },
        },
        checkPop: {
          "0%": { transform: "scale(0)", opacity: "0" },
          "50%": { transform: "scale(1.2)" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        slideUpFade: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
  daisyui: {
    themes: [
      {
        light: {
          primary: "#4F46E5",
          "primary-content": "#ffffff",
          secondary: "#3B82F6",
          "secondary-content": "#ffffff",
          accent: "#6366F1",
          "accent-content": "#ffffff",
          neutral: "#0F172A",
          "neutral-content": "#F8FAFC",
          "base-100": "#ffffff",
          "base-200": "#F8FAFC",
          "base-300": "#E2E8F0",
          "base-content": "#0F172A",
          info: "#0EA5E9",
          success: "#10B981",
          warning: "#F59E0B",
          error: "#EF4444",
        },
        dark: {
          primary: "#6366F1",
          "primary-content": "#ffffff",
          secondary: "#3B82F6",
          "secondary-content": "#ffffff",
          accent: "#4F46E5",
          "accent-content": "#ffffff",
          neutral: "#F8FAFC",
          "neutral-content": "#0F172A",
          "base-100": "#0F172A",
          "base-200": "#1E293B",
          "base-300": "#334155",
          "base-content": "#F8FAFC",
          info: "#0EA5E9",
          success: "#10B981",
          warning: "#F59E0B",
          error: "#EF4444",
        },
      },
    ],
    darkTheme: "dark",
  },
};

export default config;
