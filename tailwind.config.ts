import type { Config } from "tailwindcss";

const config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  important: "#__next",
  corePlugins: {
    preflight: false, // MUI CssBaseline provides resets
  },
};

export default config;
