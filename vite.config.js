import { defineConfig } from 'vite';

// Studio sandbox serves the dev server on 0.0.0.0:3000 behind a proxied domain.
export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
  },
  server: { host: true, port: 3000, allowedHosts: true },
  preview: { host: true, port: 3000, allowedHosts: true },
});
