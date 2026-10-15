import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

const DEFAULT_API_URL = 'https://api-parc.numerix.digital/api';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiOrigin = new URL(env.VITE_API_URL || DEFAULT_API_URL).origin;

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
      // Le backend ne renvoie aucun en-tête Access-Control-Allow-Origin :
      // en dev, on passe par le serveur Vite pour éviter le blocage CORS.
      proxy: {
        '/api': {target: apiOrigin, changeOrigin: true, secure: true},
      },
    },
  };
});
