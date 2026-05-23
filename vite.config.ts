import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      crypto: path.resolve(__dirname, "./src/lib/empty.ts"),
      https: path.resolve(__dirname, "./src/lib/empty.ts"),
      events: path.resolve(__dirname, "./node_modules/events/events.js"),
    },
  },
  define: {
    global: "globalThis",
  },
})
