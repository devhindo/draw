# 🎨 drawcli

[![npm version](https://badge.fury.io/js/drawcli.svg)](https://www.npmjs.com/package/drawcli)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A lightning-fast, fully offline CLI tool that instantly spins up a local `tldraw` whiteboard right from your terminal. 

Everything runs locally—including web fonts—making it perfect for secure offline environments, airplane mode, or just quick local diagramming without relying on cloud services.

## ✨ Features

* ⚡ **Instant Start:** Run one command and you're drawing.
* 🔒 **100% Offline & Private:** No data leaves your machine. Assets and fonts are bundled.
* 💾 **Auto-Save & Persistence:** Drawings are automatically saved to `~/.drawdata`.
* 📂 **File Management:** Beautiful built-in sidebar to manage and switch between your local drawings.
* 🔄 **Smart Auto-Shutdown:** The CLI automatically stops running in your terminal the moment you close the browser tab.

---

## 📦 Installation

Install globally via npm:

```bash
npm install -g drawcli
```

## 🚀 Usage & Commands

Starting a whiteboard is as simple as typing `draw` in your terminal. Here are the available commands:

| Command | Description |
| :--- | :--- |
| `draw` | Starts the app with a default canvas and opens your browser. |
| `draw <filename>` | Opens (or creates) a specific drawing file. e.g., `draw architecture-diagram` |
| `draw --clear` | 🧹 Wipes all your saved drawings from `~/.drawdata`. Use with caution! |
| `draw --version` (or `-v`) | Prints the installed version of `drawcli`. |

### 🔄 Smart Auto-Shutdown
You don't need to manually `Ctrl+C` to kill the server. When you close the `drawcli` tab in your browser, the local server will automatically stop running in your terminal, freeing up the port and keeping your workflow clean.

---

## 🛠 Local Development

Want to build or modify this tool locally?

1. Clone the repository and install dependencies:
   ```bash
   npm install
   ```

2. Build the optimized production bundle (required before testing the CLI):
   ```bash
   npm run build
   ```

3. Link the package globally to test:
   ```bash
   npm link
   ```

4. Run the CLI:
   ```bash
   draw
   ```
