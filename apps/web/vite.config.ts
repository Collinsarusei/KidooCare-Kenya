import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
    // Reduce file-watcher overhead on Windows (prevents excessive CPU/RAM use)
    watch: {
      usePolling: false,
      ignored: ['**/node_modules/**', '**/dist/**', '**/.git/**'],
    },
    hmr: true,
  },
  // Disable source maps in dev — saves ~150MB RAM
  build: {
    sourcemap: false,
    chunkSizeWarningLimit: 1000,
  },
  // Cache transformed modules to disk — avoids re-parsing on restart
  cacheDir: 'node_modules/.vite',
  // Limit esbuild worker threads to reduce CPU spikes
  esbuild: {
    target: 'es2020',
  },
  // Only pre-bundle what's actually needed (avoids scanning all of node_modules)
  optimizeDeps: {
    include: ['react', 'react-dom', 'lucide-react'],
    holdUntilCrawlEnd: false,
  },
});
