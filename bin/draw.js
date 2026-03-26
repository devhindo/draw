#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import open from 'open';
import express from 'express';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

const distPath = path.join(__dirname, '..', 'dist');

if (!fs.existsSync(distPath)) {
  console.error("Error: 'dist' directory not found. Please ensure the project is built before publishing.");
  process.exit(1);
}

// Serve static files from the dist directory
app.use(express.static(distPath));

// Fallback for SPA routing if needed
app.use((req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// Start the server on a random available port
const server = app.listen(0, async () => {
  const actualPort = server.address().port;
  const url = `http://localhost:${actualPort}`;
  
  console.log(`\n🖌️  Draw CLI is ready!`);
  console.log(`👉 Running at: ${url}\n`);
  console.log(`Press Ctrl+C to stop the server.\n`);
  
  try {
    await open(url);
  } catch (err) {
    // Gracefully handle if there is no graphical environment
  }
});
