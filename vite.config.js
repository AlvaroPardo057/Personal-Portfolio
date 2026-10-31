import { defineConfig } from "vite";

export default defineConfig({
  base: process.env.VITE_BASE_PATH || "/",
  server: { watch: { usePolling: true, interval: 300 } },
  build: { rollupOptions: { output: { manualChunks: { three: ["three"] } } } },
});
