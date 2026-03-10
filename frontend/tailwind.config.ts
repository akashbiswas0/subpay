import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./hooks/**/*.{js,ts,jsx,tsx,mdx}",
    "./providers/**/*.{js,ts,jsx,tsx,mdx}",
    "./utils/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#0f172a",
        mist: "#f8fafc",
        coral: "#ff6b57",
        gold: "#f4b740",
        mint: "#7ed6b8",
      },
      boxShadow: {
        glow: "0 20px 60px rgba(15, 23, 42, 0.12)",
      },
      backgroundImage: {
        mesh:
          "radial-gradient(circle at top left, rgba(255, 107, 87, 0.22), transparent 32%), radial-gradient(circle at top right, rgba(126, 214, 184, 0.18), transparent 28%), linear-gradient(180deg, #fffaf5 0%, #f8fafc 100%)",
      },
    },
  },
  plugins: [],
};

export default config;
