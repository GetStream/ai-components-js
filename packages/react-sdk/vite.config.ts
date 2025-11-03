import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import { name, peerDependencies } from './package.json';

const external = [
  // ...Object.keys(dependencies ?? {}),
  ...Object.keys(peerDependencies),
];

export default defineConfig({
  build: {
    lib: {
      entry: {
        index: resolve(import.meta.dirname, './src/index.ts'),
      },
      fileName(format, entryName) {
        return `${format}/${entryName}.${format === 'cjs' ? 'js' : 'mjs'}`;
      },
      formats: ['es', 'cjs'],
      name,
    },
    emptyOutDir: false,
    outDir: 'dist',
    minify: false,
    sourcemap: true,
    target: 'es2020',
    rollupOptions: {
      external,
    },
  },
});
