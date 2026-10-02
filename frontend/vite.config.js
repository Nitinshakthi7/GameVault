import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Dev: Vite on :5173 proxies /api to the Express backend on :5000.
// Prod: `npm run build` emits frontend/dist, which Express serves statically.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    // three.js lives in its own lazy chunk (Backdrop3D); it is intentionally large.
    chunkSizeWarningLimit: 800,
  },
});
