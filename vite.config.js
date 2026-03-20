// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'shebang-and-executable',
      renderChunk(code, chunk) {
        if (chunk.isEntry) {
          const stripped = code.replace(/^#!.*\n/, '');
          return '#!/usr/bin/env node\n' + stripped;
        }
      },
      writeBundle(options, bundle) {
        // Set executable bit on entry files
        for (const [fileName, chunk] of Object.entries(bundle)) {
          if (chunk.type === 'chunk' && chunk.isEntry) {
            const outputPath = path.join(options.dir || 'dist', fileName);
            try {
              fs.chmodSync(outputPath, 0o755);
            } catch (err) {
              console.warn(`Failed to set executable bit on ${outputPath}:`, err.message);
            }
          }
        }
      }
    }
  ],
  build: {
    lib: {
      entry: 'src/index.jsx',
      formats: ['es'],
      fileName: () => 'index.js',
    },
    rollupOptions: {
      external: [
        'react',
        'react/jsx-runtime',
        'ink',
        'marked',
        'marked-terminal',
        'fs',
        'path',
        'os',
        'url',
        'child_process',
      ],
      output: {
        preserveModules: true,
        preserveModulesRoot: 'src',
        entryFileNames: '[name].js',
      },
    },
    target: 'node18',
    outDir: 'dist',
    emptyDirBeforeWrite: true,
  },
});
