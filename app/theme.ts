import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#7c3aed" }, // Tailwind violet-600
    secondary: { main: "#111827" }, // Tailwind gray-900
  },
  shape: { borderRadius: 16 }, // matches Tailwind rounded-2xl
  typography: {
    fontFamily: ["Inter", "sans-serif"].join(","),
  },
});
