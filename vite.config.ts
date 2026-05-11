import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/frontgate-frontend/',
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@apis": path.resolve(__dirname, "./src/apis"),
      "@assets": path.resolve(__dirname, "./src/assets"),
      "@clients": path.resolve(__dirname, "./src/clients"),
      "@configs": path.resolve(__dirname, "./src/configs"),
      "@pages": path.resolve(__dirname, "./src/pages"),
      "@hooks": path.resolve(__dirname, "./src/hooks"),
      "@contexts": path.resolve(__dirname, "./src/contexts"),
      "@providers": path.resolve(__dirname, "./src/providers"),
      "@layouts": path.resolve(__dirname, "./src/layouts"),
      "@shared": path.resolve(__dirname, "./src/shared"),
    },
  },
});
