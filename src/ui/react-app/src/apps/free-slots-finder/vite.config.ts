import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';
import path from 'path';

export default defineConfig({
  plugins: [react(), viteSingleFile()],
  root: __dirname,
  build: {
    outDir: path.resolve(__dirname, '../../../../dist/apps/free-slots-finder'),
    emptyOutDir: false,
    rollupOptions: { input: path.resolve(__dirname, 'index.html') },
  },
  resolve: {
    alias: {
      '@components': path.resolve(__dirname, '../../components'),
      '@hooks': path.resolve(__dirname, '../../hooks'),
      '@styles': path.resolve(__dirname, '../../styles'),
      '@context': path.resolve(__dirname, '../../context'),
    },
  },
});
