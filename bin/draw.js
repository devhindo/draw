#!/usr/bin/env node

import fs from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
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
const dataDir = path.join(workDir, '.drawdata');

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

// API Routes
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

// Start the server on a random available port
const server = app.listen(0, async () => {
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
  } catch (err) {
    // Gracefully handle if there is no graphical environment
  }
});
