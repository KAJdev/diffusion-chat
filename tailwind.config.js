/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0d1017",
        backgroundSecondary: "#131721",
        settingsPanel: "#11151c",
        accent: "",
        chatbox: "#1a1f29",
        subtext: "",
        text: "",
        popupBar: "#1a1f29",
      }
    },
  },
  plugins: [],
}