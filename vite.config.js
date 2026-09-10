import { defineConfig } from 'vite';
export default defineConfig({
  server: { port: 5188, strictPort: true },
  build: { rollupOptions: { output: { manualChunks: { three: ['three'] } } } },
});
