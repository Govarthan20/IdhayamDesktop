import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  server: {
    proxy: {
      '/MOB': {
        target: 'http://117.232.71.91:2101',
        changeOrigin: true,
        secure: false,
      },
      '/MOB-TRACK': {
        target: 'http://117.234.71.91:2101',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/MOB-TRACK/, '/MOB'),
      },
    },
  },
  build: {
    outDir: 'out/renderer',
    rollupOptions: {
      input: {
        index: './index.html',
      },
    },
  },
});
