// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./app/**/*.{js,jsx,ts,tsx}",   // if you ever use /app router
    "./src/**/*.{js,jsx,ts,tsx}",   // safe extra, if you add /src later
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
