
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

declare var process: { env: { API_KEY: string } };

export default defineConfig({
  plugins: [react()],
  // 'base' config is crucial for hosting in subdirectories (like /wp-content/uploads/app)
  base: './', 
  define: {
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY)
  }
});
