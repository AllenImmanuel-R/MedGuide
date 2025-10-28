import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(({ mode }) => ({
  build: {
    outDir: 'dist',
    sourcemap: mode !== 'production',
    minify: mode === 'production',
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
  server: {
    host: true,
    port: 8080,
    strictPort: true,
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      '.onrender.com', // Allow all Render.com subdomains
      'medguide-tf9d.onrender.com',
    ],
  },
  preview: {
    host: true,
    port: 8080,
    strictPort: false,
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      '.onrender.com', // Allow all Render.com subdomains
    ],
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
