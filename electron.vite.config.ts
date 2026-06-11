import { defineConfig, externalizeDepsPlugin } from 'electron-vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      lib: {
        entry: './electron/main.ts',
      },
    },
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      lib: {
        entry: './electron/preload.ts',
      },
    },
  },
  renderer: {
    root: '.',
    plugins: [react()],
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
    resolve: {
      alias: {
        '@': '/src',
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
  },
});
