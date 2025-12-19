
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

declare var process: { env: { API_KEY: string } };

export default defineConfig({
  plugins: [react()],
  // Use root base path for Netlify hosting to ensure assets load correctly on nested routes
  base: '/', 
  define: {
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY)
  }
});
