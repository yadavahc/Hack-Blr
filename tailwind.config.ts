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
        saathi: {
          50:  "#FDF6EC",
          100: "#F9E8D0",
          200: "#F2CFA1",
          300: "#E8B06A",
          400: "#D4843A",
          500: "#C26820",
          600: "#A3511A",
          700: "#7C3D18",
          800: "#5A2D14",
          900: "#3D1E0E",
          950: "#220F06",
        },
        cream: {
          50: "#FEFCF8",
          100: "#FDF6EC",
          200: "#F9EACE",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "saathi-gradient": "linear-gradient(135deg, #FDF6EC 0%, #F9E8D0 50%, #F2CFA1 100%)",
        "hero-pattern": "radial-gradient(ellipse at top, #F9E8D0, #FDF6EC)",
      },
      boxShadow: {
        saathi: "0 4px 24px rgba(124, 61, 24, 0.12)",
        "saathi-lg": "0 8px 40px rgba(124, 61, 24, 0.18)",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "float": "float 3s ease-in-out infinite",
        "wave": "wave 1.5s ease-in-out infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" },
        },
        wave: {
          "0%, 100%": { transform: "scaleY(1)" },
          "50%": { transform: "scaleY(1.5)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
