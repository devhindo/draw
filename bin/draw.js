#!/usr/bin/env node

import fs from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import os from 'os';
import open from 'open';
import express from 'express';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

const distPath = path.join(__dirname, '..', 'dist');
const workDir = process.cwd();
const dataDir = path.join(os.homedir(), '.drawdata');

if (process.argv.includes('--clear')) {
  try {
    if (existsSync(dataDir)) {
      await fs.rm(dataDir, { recursive: true, force: true });
    }
    console.log(`\n🧹 Successfully cleared all drawings from ${dataDir}\n`);
    process.exit(0);
  } catch (err) {
    console.error(`\n❌ Error clearing drawings: ${err.message}\n`);
    process.exit(1);
  }
}

if (process.argv.includes('--version') || process.argv.includes('-v')) {
  try {
    const pkgPath = path.join(__dirname, '..', 'package.json');
    const pkgData = await fs.readFile(pkgPath, 'utf8');
    const pkg = JSON.parse(pkgData);
    console.log(`v${pkg.version}`);
  } catch (err) {
    console.log('v1.0.0');
  }
  process.exit(0);
}

if (!existsSync(distPath)) {
  console.error("Error: 'dist' directory not found. Please ensure the project is built before publishing.");
  process.exit(1);
}

// Ensure .drawdata exists
const ensureDataDir = async () => {
  try {
    await fs.mkdir(dataDir, { recursive: true });
  } catch (err) {
    // ignore
  }
};

let activeConnections = 0;
let shutdownTimer = null;
let hasConnected = false;

// API Routes
app.get('/api/keepalive', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });
  
  res.write('data: connected\n\n');

  activeConnections++;
  hasConnected = true;
  if (shutdownTimer) {
    clearTimeout(shutdownTimer);
    shutdownTimer = null;
  }

  req.on('close', () => {
    activeConnections--;
    if (activeConnections <= 0) {
      activeConnections = 0;
      shutdownTimer = setTimeout(() => {
        console.log('\n👋 Browser tab closed. Shutting down draw...\n');
        process.exit(0);
      }, 500); // reduced timeout to 500ms
    }
  });
});

app.get('/api/files', async (req, res) => {
  await ensureDataDir();
  try {
    const files = await fs.readdir(dataDir);
    const tldrFiles = files.filter(f => f.endsWith('.tldr')).map(f => f.slice(0, -5));
    res.json({ files: tldrFiles });
  } catch (err) {
    res.status(500).json({ error: 'Failed to read directory' });
  }
});

app.post('/api/save/:filename', async (req, res) => {
  await ensureDataDir();
  try {
    const filename = req.params.filename;
    const safeName = path.basename(filename) + '.tldr';
    const filePath = path.join(dataDir, safeName);
    await fs.writeFile(filePath, JSON.stringify(req.body, null, 2));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save file' });
  }
});

app.get('/api/load/:filename', async (req, res) => {
  await ensureDataDir();
  try {
    const filename = req.params.filename;
    const safeName = path.basename(filename) + '.tldr';
    const filePath = path.join(dataDir, safeName);
    if (!existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }
    const data = await fs.readFile(filePath, 'utf8');
    res.json(JSON.parse(data));
  } catch (err) {
    res.status(500).json({ error: 'Failed to load file' });
  }
});

// Serve static files from the dist directory
app.use(express.static(distPath));

// Fallback for SPA routing if needed
app.use((req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// Start the server with a stable port to preserve browser localStorage (e.g. dark mode)
const startServer = (port = 45192) => {
  const server = app.listen(port, async () => {
    const actualPort = server.address().port;
    let startFile = process.argv[2] || 'default';
    if (startFile && startFile.endsWith('.tldr')) {
      startFile = startFile.slice(0, -5);
    }
    
    const url = `http://localhost:${actualPort}?file=${encodeURIComponent(startFile)}`;
    
    console.log(`\n🖌️  Draw CLI is ready!`);
    console.log(`📁 Saving drawings to: ${dataDir}`);
    console.log(`👉 Running at: ${url}\n`);
    console.log(`Press Ctrl+C to stop the server.\n`);
    
    try {
      await open(url);
      
      // Safety net: if browser fails to connect within 5 seconds of opening, 
      // don't leave the server running indefinitely.
      setTimeout(() => {
        if (!hasConnected) {
          console.log('\n⚠️ No browser connection detected after 5 seconds. Shutting down...\n');
          process.exit(0);
        }
      }, 5000);
      
    } catch (err) {
      // Gracefully handle if there is no graphical environment
      console.log('\n⚠️ Could not automatically open a browser window.\n');
    }
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      // If port is in use, try the next one
      startServer(port + 1);
    } else {
      console.error('Server error:', err);
    }
  });
};

startServer();
