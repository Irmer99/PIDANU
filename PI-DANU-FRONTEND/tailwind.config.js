/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#1B4332",
          light: "#2D6A4F",
          dark: "#0B2218",
        },
        secondary: {
          DEFAULT: "#FFD700",
          light: "#FFE44D",
          dark: "#CC9E00",
        },
        accent: {
          DEFAULT: "#D32F2F",
          light: "#EF5350",
          dark: "#B71C1C",
        },
      },
    },
  },
  plugins: [],
};
