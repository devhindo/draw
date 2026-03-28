import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs/promises'
import path from 'path'
import os from 'os'
import { existsSync } from 'fs'

const dataDir = path.join(os.homedir(), '.drawdata');

const ensureDataDir = async () => {
  try {
    await fs.mkdir(dataDir, { recursive: true });
  } catch (err) {}
};

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'drawcli-api',
      configureServer(server) {
        // Save endpoint
        server.middlewares.use(async (req, res, next) => {
          if (req.url && req.url.startsWith('/api/save/') && req.method === 'POST') {
            let body = '';
            req.on('data', chunk => { body += chunk.toString() });
            req.on('end', async () => {
              await ensureDataDir();
              const parts = req.url!.split('/');
              const filename = parts[parts.length - 1];
              const safeName = decodeURIComponent(filename) + '.tldr';
              const filePath = path.join(dataDir, safeName);
              try {
                await fs.writeFile(filePath, body);
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: true }));
              } catch (e) {
                res.statusCode = 500;
                res.end(JSON.stringify({ error: 'Failed to save' }));
              }
            });
            return;
          }
          
          if (req.url === '/api/files' && req.method === 'GET') {
            await ensureDataDir();
            try {
              const files = await fs.readdir(dataDir);
              const tldrFiles = files.filter(f => f.endsWith('.tldr')).map(f => f.slice(0, -5));
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ files: tldrFiles }));
            } catch (err) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: 'Failed' }));
            }
            return;
          }

          if (req.url && req.url.startsWith('/api/load/') && req.method === 'GET') {
            await ensureDataDir();
            const parts = req.url!.split('/');
            const filename = parts[parts.length - 1];
            if (!filename) return next();
            const safeName = decodeURIComponent(filename) + '.tldr';
            const filePath = path.join(dataDir, safeName);
            
            if (!existsSync(filePath)) {
              res.statusCode = 404;
              res.end(JSON.stringify({ error: 'Not found' }));
              return;
            }
            try {
              const data = await fs.readFile(filePath, 'utf8');
              res.setHeader('Content-Type', 'application/json');
              res.end(data);
            } catch (e) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: 'Failed' }));
            }
            return;
          }
          
          next();
        });
      }
    }
  ],
})
