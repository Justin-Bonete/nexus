/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        nexus: {
          bg: "#04060a",
          panel: "#0a0f1a",
          cyan: "#5be8ff",
          cyanDim: "#1c5b6e",
          violet: "#8b5bff",
          amber: "#ffb454",
          danger: "#ff4d6a",
          success: "#4dffb0",
          grid: "#0f2430",
        },
      },
      fontFamily: {
        display: ["'Rajdhani'", "'Orbitron'", "sans-serif"],
        mono: ["'JetBrains Mono'", "ui-monospace", "monospace"],
      },
      boxShadow: {
        glow: "0 0 20px rgba(91, 232, 255, 0.35)",
        glowStrong: "0 0 40px rgba(91, 232, 255, 0.55)",
      },
      keyframes: {
        pulseGlow: {
          "0%, 100%": { opacity: 0.6 },
          "50%": { opacity: 1 },
        },
        scan: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100%)" },
        },
        drift: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-6px)" },
        },
      },
      animation: {
        pulseGlow: "pulseGlow 2.4s ease-in-out infinite",
        scan: "scan 3s linear infinite",
        drift: "drift 4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
