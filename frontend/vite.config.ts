import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: true, // بدون این، Vite فقط از خود ماشین قابل‌دسترسیه، نه از پورت‌فوروارد Codespaces
    proxy: {
      "/api": "http://localhost:4000",
    },
  },
});
