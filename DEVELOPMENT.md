# Development & Local Debug Guide

A private dev guide for working on this Obsidian plugin locally.

> Note: This file is for your local development workflow. Do not copy/paste back to the public README.

---

## Prerequisites

- Node.js (LTS recommended, e.g., 18.x)
- Yarn (v1) — this repo uses Yarn v1 commands in the guide.
- Obsidian installed and a vault created (your vault: `D:\Documents\Obsidian\Shirayuki`).

## Quick setup (one-time)

1. Install dependencies:

```bash
rm -rf node_modules yarn.lock
yarn install
```

2. Make sure `OBSIDIAN_VAULT` env var is set (optional). If you don't set it, the `dev-install` script uses the default vault `D:\Documents\Obsidian\Shirayuki`.

macOS/Linux example (PowerShell uses other syntax):
```bash
export OBSIDIAN_VAULT="D:/Documents/Obsidian/Shirayuki"
```
Windows PowerShell example:
```powershell
$env:OBSIDIAN_VAULT = 'D:\Documents\Obsidian\Shirayuki'
```

3. Build once to create `main.js` and `manifest.json`:

```bash
yarn build
```

4. Install (copy) the built plugin to your vault:

```bash
# uses the default vault unless you pass a vault argument or set OBSIDIAN_VAULT
npm run dev-install

# or explicitly pass a path
npm run dev-install -- "D:\Documents\Obsidian\Shirayuki"
```

This script will copy `main.js`, `manifest.json`, and `styles.css` into:

`<your-vault>/.obsidian/plugins/<manifest.id>/`

## Iterative development & fast reloads

- Option A (manual build & copy):
  - Build and install each time you want to test a change.

```bash
yarn build
npm run dev-install
```

- Option B (fast manual reload with symlink):
  - Create a symlink from your vault plugin folder to your repo (Windows PowerShell admin level):

```powershell
# Make the plugin folder
New-Item -ItemType Directory -Force -Path "D:\Documents\Obsidian\Shirayuki\.obsidian\plugins\obsidian-amazingmarvin-plugin"

# Replace the folder with a symlink to your repo (remove directory first)
Remove-Item -Force -Recurse "D:\Documents\Obsidian\Shirayuki\.obsidian\plugins\obsidian-amazingmarvin-plugin"
New-Item -ItemType SymbolicLink -Path "D:\Documents\Obsidian\Shirayuki\.obsidian\plugins\obsidian-amazingmarvin-plugin" -Target "E:\Projects\obsidian-amazingmarvin-plugin"
```

  - After creating the symlink, `npm run dev` (rollup watch) will rebuild `main.js` and Obsidian will pick up changes after you reload the app (Ctrl+R).

- Option C (auto-copy on build):
  - The repo includes `npm run dev-install` which builds and copies; you can re-run after changes. To automate it, consider `chokidar-cli` or `concurrently` to watch and auto-copy (not implemented by default to keep dependencies minimal).

## Enable the plugin in Obsidian

- Open Obsidian → Settings → Community plugins.
- Enable community plugins (if Safe Mode is on) — toggle Safe Mode off.
- Click "Installed plugins" and find `Amazing Marvin` (search or enable by `manifest.json` id). If it does not appear, confirm copied files exist in the correct plugin folder.
- Toggle the plugin on.

## Debugging & Observability

- Show Developer Tools (Chrome DevTools in Obsidian): `Ctrl+Shift+I` (Windows) or `Cmd+Option+I` (macOS). This is a key debugging tool — you can see console logs, errors, and use the Debugger.

- Quick debug patterns:
  - Add `console.log()` to code and rebuild (`yarn build`) then reload Obsidian.
  - To debug a runtime error, look at the console stack trace in Developer Tools.
  - To inspect DOM and Svelte components, use DevTools and expand nodes/app-state. You can also use Svelte DevTools (works in Electron if enabled).
  \n+## Writing logs to file (optional)

  You can see console logs using Developer Tools, but if you prefer persistent logs, the repo includes a small `createLogger` helper in `src/utils/logger.ts` which:
  - Logs messages to the browser console (Renderer) so they appear in DevTools.
  - Optionally appends logs to a file in your vault at `.obsidian/plugins/<manifest.id>/plugin.log`.

  Example usage in your plugin (e.g., in `src/main.ts`):

  ```ts
  import createLogger from './utils/logger';
  // Inside your plugin class
  const logger = createLogger(this, { writeToFile: true, filename: 'dev.log' });
  logger.info('plugin loaded');
  ```

  You can then open the file at `<vault>/.obsidian/plugins/<manifest.id>/dev.log` to inspect the running logs persistently across plugin reloads.

  Notes:
  - The logger uses `app.vault` to create/modify a file inside your vault. Use `writeToFile: true` only for development; consider removing in production.
  - If you need more advanced log rotation, filtering or levels, extend the utility accordingly.

- Understand the plugin lifecycle and logged messages:
  - `onload()` — called when plugin loads; good place to log plugin start state.
  - `onunload()` — called when plugin unloads; log it to confirm proper cleanup.
  - Svelte components should be destroyed to avoid memory leaks; watch for logs or `Cannot read property` errors that indicate destroyed components remain referenced.

## Common troubleshooting

- TypeScript errors while building:
  - Ensure `node_modules` and `yarn.lock` are updated for the pinned TypeScript version (we use `resolutions` to pin `4.9.5`).
  - Remove `node_modules` and `yarn.lock` and reinstall if needed.

- Build fails on CSS imports (e.g., `Unexpected token` referencing `.css` files):
  - Check `rollup.config.js` includes `rollup-plugin-postcss` and `svelte({ preprocess: autoPreprocess(...) })`.

- Obsidian does not see the plugin:
  - Confirm files copied to `<vault>/.obsidian/plugins/<manifest.id>/` include `manifest.json` and `main.js`.
  - Ensure `manifest.json.minAppVersion` is compatible with your Obsidian (1.10.3 or later). If not, update accordingly.

- Code changes have no effect after reloading:
  - Check Developer Tools console for errors.
  - Press `Ctrl+R` to reload the entire Obsidian app.
  - Try disabling/re-enabling the plugin from Settings.

## Useful commands summary

```bash
# Install dependencies
rm -rf node_modules yarn.lock
yarn install

# Build production (output to repository root)
yarn build

# Build and copy to your vault
npm run dev-install

# Dev watch (rebuild on file changes)
yarn dev  # rollup -c -w
```

## Optional automation (watch & auto-copy)

If you want an automated flow that watches `main.js` and copies to your vault on every build, consider adding `chokidar-cli` and `concurrently`:

```bash
yarn add -D chokidar-cli concurrently
```

Then add to `package.json` scripts:

```json
"dev:install:watch": "concurrently -k \"yarn dev\" \"chokidar 'main.js' -c 'npm run dev-install'\""
```

This will run Rollup in watch mode and run the dev-install script each time `main.js` changes (so no manual copy). Remove the `concurrently` and `chokidar-cli` additions if you do not want these packages.

## Tips for testing plugin UI/commands

- Commands: After enabling plugin, open Command Palette (`Ctrl+P`) and search for the plugin's commands (e.g., "Add scheduled tasks to daily note") to test behavior.
- Markdown processor: To see Markdown post-processor behavior, create a note with the appropriate code block (or place the right markup) and refresh the note to render.

---

If you'd like, I can also:
- Add the optional `dev:install:watch` script now to automate copying on edits, or
- Add a small utility to clear plugin files from the vault before each install.

Tell me which options you'd like; otherwise this guide should enable you to debug locally and start working quickly.