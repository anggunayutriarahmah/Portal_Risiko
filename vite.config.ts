import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, type Plugin} from 'vite';

function disableHmrClientWebSocketPlugin(): Plugin {
  return {
    name: 'pusri:disable-hmr-websocket-client',
    enforce: 'post',
    transform(code, id) {
      if (id.includes('client.mjs')) {
        return {
          code: code
            .replace('console.debug("[vite] connecting...");', '')
            .replace('transport.connect(createHMRHandler(handleMessage));', '')
            .replace('setupForwardConsoleHandler(transport, forwardConsole);', ''),
          map: null,
        };
      }
      return null;
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), disableHmrClientWebSocketPlugin()],
    resolve: {
      alias: {
        '@': path.resolve('.'),
      },
    },
    server: {
      // HMR is disabled to prevent flickering during agent edits.
      hmr: false,
      ws: false as const,
      // Disable file watching when requested to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {
        ignored: ['**/pusri_db_store.json', '**/.pusri_db_store.json', '**/.pusri*', '**/server/**', '**/node_modules/**', '**/*.sql'],
      },
    },
  };
});
