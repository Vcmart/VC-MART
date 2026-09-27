import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('/node_modules/.pnpm/firebase@') || id.includes('/node_modules/.pnpm/@firebase+')) return 'firebase';
          if (id.includes('/node_modules/.pnpm/react@') || id.includes('/node_modules/.pnpm/react-dom@') || id.includes('/node_modules/.pnpm/scheduler@')) return 'react-vendor';
        },
      },
    },
  },
});
