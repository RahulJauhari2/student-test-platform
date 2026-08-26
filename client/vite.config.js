import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000', // <-- 6000 ki jagah 5000 karein
        changeOrigin: true,
        secure: false,
      },
    },
  },
});