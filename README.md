# drawcli

A lightning-fast CLI tool to instantly spin up a local, fully offline `tldraw` whiteboard.

Everything runs locally, including the web fonts, making it perfect for secure offline environments or quick diagramming on airplanes.

## Installation

Install globally via npm:

```bash
npm install -g drawcli
```

## Usage

Simply run this command anywhere in your terminal:

```bash
draw
```

This will instantly spin up a micro-server and open a new tab in your default browser. 

### 🚀 New: Persistent Offline Drawings
Your drawings are now **automatically saved to your current working directory**! 
- The web UI features a beautiful sidebar showing all `.tldr` files in the folder you ran the command from.
- Any changes you make are instantly auto-saved to your local hard drive.
- You can create new drawings from the sidebar or by running `draw <filename>` to instantly jump into a specific file.

## Local Development

If you want to build and test this CLI tool locally from source:

1. Install dependencies
```bash
npm install
```

2. Build the optimized production bundle
```bash
npm run build
```

3. Link the package globally to test the CLI
```bash
npm link
```

4. Run the CLI
```bash
draw
```
