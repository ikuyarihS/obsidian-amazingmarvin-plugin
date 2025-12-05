#!/usr/bin/env node
/*
  dev-install.js
  Copies built plugin files into an Obsidian vault's .obsidian/plugins/<plugin-id> folder for testing.
  Usage:
    OBSIDIAN_VAULT="E:\\path\\to\\vault" npm run dev-install
    or
    npm run dev-install -- "E:\\path\\to\\vault"
*/

const fs = require('fs');
const path = require('path');

function exitWithMsg(msg) {
  console.error(msg);
  process.exit(1);
}

function fileExists(p) {
  try {
    return fs.existsSync(p);
  } catch (e) {
    return false;
  }
}

// Default vault path (used when no env var or argument is provided)
const DEFAULT_VAULT = 'D:\\Documents\\Obsidian\\Shirayuki';
const vaultArg = process.argv[2] || process.env.OBSIDIAN_VAULT || DEFAULT_VAULT;
if (!vaultArg) {
  exitWithMsg(
    '\nERROR: No vault path provided. Set OBSIDIAN_VAULT env var or pass a path as an argument.\n\nUsage:\n  OBSIDIAN_VAULT="E:\\\\path\\\\to\\\\vault" npm run dev-install\n  or\n  npm run dev-install -- "E:\\path\\to\\vault"\n'
  );
}

if (!process.argv[2] && !process.env.OBSIDIAN_VAULT) {
  console.log(`No vault path specified. Using default: ${DEFAULT_VAULT}`);
}

const vaultPath = path.resolve(vaultArg);
if (!fileExists(vaultPath)) exitWithMsg(`Vault path does not exist: ${vaultPath}`);

const pluginRoot = process.cwd();
const manifestPath = path.join(pluginRoot, 'manifest.json');
if (!fileExists(manifestPath)) exitWithMsg(`manifest.json not found in project root: ${manifestPath}`);

let manifest;
try {
  manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
} catch (e) {
  exitWithMsg('Failed to parse manifest.json: ' + e.message);
}

if (!manifest.id) exitWithMsg('manifest.json is missing `id` field');

const destDir = path.join(vaultPath, '.obsidian', 'plugins', manifest.id);

console.log(`Installing plugin ${manifest.id} to ${destDir}`);

try {
  fs.mkdirSync(destDir, { recursive: true });
} catch (e) {
  exitWithMsg(`Failed to create plugin directory: ${e.message}`);
}

const filesToCopy = ['manifest.json', 'main.js', 'styles.css'];
let copied = 0;
filesToCopy.forEach(file => {
  const src = path.join(pluginRoot, file);
  if (fileExists(src)) {
    const dest = path.join(destDir, path.basename(file));
    fs.copyFileSync(src, dest);
    console.log('Copied', file, '→', dest);
    copied++;
  }
});

if (copied === 0) exitWithMsg('No build artefacts found to install. Run `npm run build` first.');

console.log('Dev install completed successfully');
