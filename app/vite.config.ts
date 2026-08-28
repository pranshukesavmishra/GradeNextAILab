import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  plugins: [react()],
  base: "./",
  resolve: {
    alias: {
      "@engine": fileURLToPath(new URL("./src/engine", import.meta.url)),
      "@ui": fileURLToPath(new URL("./src/ui", import.meta.url)),
      "@sims": fileURLToPath(new URL("./src/sims", import.meta.url)),
      "@labs": fileURLToPath(new URL("./src/labs", import.meta.url)),
    },
  },
  build: { target: "es2022", chunkSizeWarningLimit: 700 },
});
