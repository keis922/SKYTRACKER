module.exports = {
  darkMode: "media",
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        night: "#0f172a",
        sky: "#38bdf8",
        snow: "#f9fafb"
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"]
      },
      boxShadow: {
        glow: "0 0 20px rgba(56,189,248,0.6)"
      },
      animation: {
        "spin-slow": "spin 40s linear infinite",
        "pulse-soft": "pulse 2s ease-in-out infinite"
      }
    }
  },
  plugins: []
};

