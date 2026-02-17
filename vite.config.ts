import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve, dirname } from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Plugin to ensure manifest.json is copied to the dist folder
const copyManifest = () => {
  return {
    name: 'copy-manifest',
    writeBundle() {
      const source = resolve(__dirname, 'manifest.json');
      const destination = resolve(__dirname, 'dist', 'manifest.json');
      
      try {
        if (fs.existsSync(source)) {
          fs.copyFileSync(source, destination);
          console.log('✅ Manifest copied successfully to dist/manifest.json');
        } else {
          console.error('❌ manifest.json not found at project root');
        }
      } catch (err) {
        console.error('❌ Failed to copy manifest:', err);
      }
    }
  }
}

export default defineConfig({
  plugins: [react(), copyManifest()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    modulePreload: false, // Disable module preload polyfill for faster extension loading
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        background: resolve(__dirname, 'background.ts'),
      },
      output: {
        // Force simple filenames and minimal chunking for extensions
        manualChunks: undefined,
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name].[ext]'
      },
    },
  },
});