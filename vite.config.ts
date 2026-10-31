import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env variables into process.env so local serverless functions can read them
  const env = loadEnv(mode, process.cwd(), '');
  for (const [key, val] of Object.entries(env)) {
    if (!process.env[key]) {
      process.env[key] = val;
    }
  }

  return {
    plugins: [
      react(),
      {
        name: 'local-api-critique-middleware',
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            if (req.url && req.url.startsWith('/api/critique')) {
              try {
                const apiModule = await server.ssrLoadModule('/api/critique.ts');
                await apiModule.default(req, res);
              } catch (err: any) {
                console.error('[Local API Handler Error]:', err);
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: err?.message || 'Local API execution error' }));
              }
            } else {
              next();
            }
          });
        }
      }
    ],
    server: {
      port: 5173,
      host: true
    }
  };
});
