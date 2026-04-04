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
  } catch {
    // ignore
  }
};

let activeConnections = 0;
let shutdownTimer: NodeJS.Timeout | null = null;

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'draw-api',
      configureServer(server) {
        // Save endpoint
        server.middlewares.use(async (req, res, next) => {
          if (req.url === '/api/keepalive' && req.method === 'GET') {
            res.writeHead(200, {
              'Content-Type': 'text/event-stream',
              'Cache-Control': 'no-cache',
              'Connection': 'keep-alive'
            });
            res.write('data: connected\n\n');

            activeConnections++;
            if (shutdownTimer) {
              clearTimeout(shutdownTimer);
              shutdownTimer = null;
            }

            req.on('close', () => {
              activeConnections--;
              if (activeConnections <= 0) {
                activeConnections = 0;
                shutdownTimer = setTimeout(() => {
                  console.log('\n👋 Browser tab closed. Shutting down draw dev server...\n');
                  process.exit(0);
                }, 500);
              }
            });
            return;
          }

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
              } catch {
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
            } catch {
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
            } catch {
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
