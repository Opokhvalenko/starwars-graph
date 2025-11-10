/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
    extend: {
      boxShadow: {
        card:
          "0 1px 2px 0 rgb(0 0 0 / 0.06), 0 1px 3px 0 rgb(0 0 0 / 0.10)",
      },
      borderRadius: {
        xl: "0.75rem",
      },
    },
  },
  darkMode: "class",
  plugins: [],
};