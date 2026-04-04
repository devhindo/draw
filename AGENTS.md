# Agent Instructions for drawcli (AGENTS.md)

Welcome to the `drawcli` codebase. As an AI autonomous agent, coding assistant (like Cursor or Copilot), or developer operating in this repository, you must adhere strictly to the guidelines and workflows defined below. This document serves as the universal `.cursorrules` / `.github/copilot-instructions.md` equivalent for this project.

## 🛑 Critical Git Mandate

**UNDER NO CIRCUMSTANCES should you run `git add`, `git commit`, `git push`, or any similar git modification command.**

- **DO NOT commit code under any circumstances.**
- **DO NOT stage files.**
- Even if you are asked to "make a release", "bump a version", or "save changes", you must **leave the Git operations to the user**. You can update the `package.json` version string or generate the commands for the user to copy/paste, but **you must not execute `git add` or `git commit` yourself**.
- This is a strict rule to prevent the accidental inclusion of unwanted, generated, or sensitive files, and to ensure the user has full final review over their commit history.

---

## 1. Project Overview & Architecture

`drawcli` is a local desktop-like application that launches a `tldraw` whiteboarding instance in the browser, while serving and saving data locally. 
- **Frontend**: React 19, TypeScript, Vite. Located in `/src` and `/public`.
- **Backend/CLI**: Node.js Express server. Located in `/bin/draw.js`.
- **Data storage**: Saves `.tldr` snapshot files locally to `~/.drawdata`.

### Architecture Principles
- **Minimalism**: Keep the application lightweight. Do not introduce complex state management libraries (Redux, MobX) when React `useState` and `useEffect` suffice.
- **Local-First**: The application runs entirely on the user's local machine. Network requests go exclusively to `localhost`.

---

## 2. Build, Lint, and Test Commands

When making changes, always ensure the project builds correctly and passes linters. Verify your work locally.

### Development & Build
- **Install Dependencies**: `npm install`
- **Start Dev Server**: `npm run dev` (Starts Vite dev server for frontend adjustments).
- **Production Build**: `npm run build` (Runs TypeScript compiler `tsc -b` and `vite build`). This is strictly required before testing changes to the CLI runtime, because the Express server serves files from the `dist` folder.
- **Start CLI/Backend Locally**: `node bin/draw.js` (Must run `npm run build` first).

### Linting & Formatting
- **Run Linter**: `npm run lint`
- The project uses ESLint v9 flat config (`eslint.config.js`).
- Fix all linting errors autonomously before reporting task completion to the user. Do not leave trailing whitespaces, unused variables, or missing dependencies in hooks.

### Testing
- **Current Status**: The project does not currently have a comprehensive automated test suite.
- **Adding Tests**: If instructed to write tests, configure **Vitest** for the frontend and **Mocha/Chai** or **Vitest** for the Node.js backend.
- **Running a Single Test**: Once configured, use `npx vitest run path/to/your.test.ts`. 
- Always prioritize testing core CLI arguments (e.g., `--clear`, `--version`) and Express API routes before testing UI components.

### Publishing & Releasing
To release a new version of the package to the public, follow this workflow:
1. Ensure the working directory is clean (`git status`).
2. Bump the package version using npm: `npm version <patch|minor|major> -m "chore: release %s"`
3. Push the commit and new tags to GitHub: `git push && git push --tags`
4. Create a GitHub release for the new tag: `gh release create v<version> --title "v<version>: <Summary>" --notes "<Description>"`
5. Publish to the npm registry: 
   - First, ensure you are logged in to npm via terminal: `npm login` (if not already logged in, check with `npm whoami`).
   - Then publish: `npm publish`

---

## 3. Code Style & Engineering Guidelines

Maintain strict consistency with the existing codebase by following these rules:

### A. Imports & Modules
- Group imports logically at the top of the file:
  1. Built-in Node modules (e.g., `import fs from 'fs/promises'`).
  2. External dependencies (e.g., `react`, `tldraw`, `express`).
  3. Internal files and CSS imports (e.g., `import './App.css'`).
- The project is strictly ESM (ECMAScript Modules). `package.json` specifies `"type": "module"`. Use `import`/`export` universally. Do NOT use `require()`.

### B. TypeScript and Typing
- **Strict Types**: Maximize type safety. Avoid using `any`. While some existing code may use `any` (e.g., for complex `tldraw` snapshot payloads), new code must be properly typed.
- **Interfaces vs Types**: Prefer `interface` for object shapes, component props, and API payloads. Use `type` for unions, intersections, or primitives.
- **Inference**: Rely on TypeScript's type inference for simple variable assignments, but always explicitly type function return values and React component parameters.

### C. Naming Conventions
- **React Components**: Use `PascalCase` for both the component name and its filename (e.g., `Sidebar.tsx`, `MainCanvas.tsx`).
- **Functions and Variables**: Use `camelCase` (e.g., `loadFiles`, `saveStatus`, `activeFile`).
- **Backend Scripts**: Use `kebab-case` or `camelCase` for backend node scripts.
- **Constants**: Use `UPPER_SNAKE_CASE` for global, immutable constants.
- **API Endpoints**: Use standard RESTful conventions in `kebab-case` (e.g., `/api/save/:filename`).

### D. Error Handling
- **Backend (`bin/draw.js`)**: 
  - Always wrap file system operations (`fs.readFile`, `fs.writeFile`, `fs.mkdir`) in `try...catch` blocks.
  - Return meaningful HTTP status codes (e.g., `404` for not found, `500` for server errors) in Express routes. Do not crash the server on invalid user inputs.
- **Frontend (`src/App.tsx`)**:
  - Handle failed fetch requests to `/api/*` gracefully.
  - Provide visual feedback to the user (e.g., update the `saveStatus` string to indicate 'Error' instead of silently failing, ensure loading states clear properly).

### E. Formatting Conventions
- **Indentation**: 2 spaces per indentation level.
- **Semicolons**: The backend Node script (`bin/draw.js`) uses semicolons. The React frontend generally omits them where possible but allows them. Follow the local file's established convention.
- **Quotes**: Prefer single quotes (`'`) for strings in JS/TS. Use double quotes (`"`) strictly for JSX attributes (`<div className="main-content">`).

### F. Styling (CSS)
- Use plain CSS (`.css` files) imported directly into components.
- Avoid utility classes like Tailwind unless explicitly added by the user. Use semantic class names (e.g., `app-container`, `sidebar-header`).
- Ensure all styles are responsive and account for a resizable sidebar.

---

## 4. Working with tldraw

`tldraw` is a powerful, complex canvas library. When interacting with it:
- Do not mutate the `tldraw` state outside of its provided APIs (e.g., `getSnapshot(editor.store)`, `editor.store.listen`).
- Refer to standard `tldraw` documentation regarding the `Editor` object lifecycle.
- Asset loading is customized locally; ensure any new fonts or assets are mapped in the `assetUrls` configuration.
- UI elements (like the sidebar toggler) should integrate cleanly with `tldraw`'s `<DefaultMainMenu>`.

---

## 5. Agent Verification Loop

As an AI, before finalizing your response:
1. **Understand First**: Read files entirely before attempting edits. Never guess file paths.
2. **Self-Correction**: Use the `bash` tool to run `npm run lint` and `npm run build` to verify your changes introduced no syntax or typing errors.
3. **Review Diff**: Ensure you haven't accidentally deleted unrelated code. Use `git diff` to review your own changes.
4. **Commit**: If asked to commit, remind the user of the Git Mandate at the top of this file and explain that you are forbidden from running `git commit`. Do not do it.
