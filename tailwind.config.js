/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        paper: {
          50: "#FDFBF8",
          100: "#FAF8F5",
          200: "#F4F0EA",
          300: "#EBE5DB",
          400: "#DED5C7",
        },
        ink: {
          900: "#1C1A18",
          700: "#2C2A27",
          500: "#5D5952",
          400: "#8A857D",
          300: "#B8B3AB",
          200: "#D7D3CC",
        },
        accent: {
          orange: "#E8744A",
          orangeHover: "#D46239",
          orangeSoft: "#FBE8DE",
          green: "#4A6B5C",
          greenHover: "#3B5649",
          greenSoft: "#E2EDE7",
        },
        tag: {
          setup: "#9AA8B5",
          climax: "#E8744A",
          transition: "#8B7B9D",
          fight: "#C25454",
          daily: "#6B9E7E",
          suspense: "#5C6FA8",
          comedy: "#D4A24E",
          emotion: "#B57A9B",
        },
      },
      fontFamily: {
        serif: ['"Noto Serif SC"', '"Source Han Serif SC"', 'Georgia', 'serif'],
        sans: ['"Noto Sans SC"', '"PingFang SC"', '"Microsoft YaHei"', 'sans-serif'],
      },
      boxShadow: {
        paper: "0 1px 3px rgba(44, 42, 39, 0.04), 0 4px 12px rgba(44, 42, 39, 0.06)",
        paperHover: "0 2px 6px rgba(44, 42, 39, 0.06), 0 8px 24px rgba(44, 42, 39, 0.10)",
        phone: "0 25px 50px -12px rgba(0, 0, 0, 0.35), 0 0 0 2px #1a1a1a, inset 0 0 0 1px rgba(255,255,255,0.05)",
      },
      keyframes: {
        "pulse-soft": {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.85", transform: "scale(1.05)" },
        },
        "float-in": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "pulse-soft": "pulse-soft 1.8s ease-in-out infinite",
        "float-in": "float-in 0.35s ease-out both",
      },
    },
  },
  plugins: [],
};
