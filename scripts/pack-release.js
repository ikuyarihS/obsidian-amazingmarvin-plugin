#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

// Usage: node scripts/pack-release.js [dest-dir]

const repoRoot = process.cwd();
const manifest = JSON.parse(fs.readFileSync(path.join(repoRoot, 'manifest.json'), 'utf8'));
const packageJson = JSON.parse(fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf8'));

const version = packageJson.version || manifest.version;
const pluginId = manifest.id;
const outDir = process.argv[2] || 'releases';
const outFile = `${pluginId}-v${version}.zip`;
const outPath = path.join(repoRoot, outDir);

if (!fs.existsSync(outPath)) fs.mkdirSync(outPath, { recursive: true });

const output = fs.createWriteStream(path.join(outPath, outFile));
const archive = archiver('zip', { zlib: { level: 9 } });

output.on('close', function () {
  console.log(`${outFile} created: ${archive.pointer()} total bytes`);
});

archive.on('warning', function (err) {
  if (err.code === 'ENOENT') console.warn(err);
  else throw err;
});

archive.on('error', function (err) {
  throw err;
});

archive.pipe(output);

const distFiles = ['manifest.json', 'main.js', 'styles.css', 'README.md', 'versions.json', 'LICENSE'];

for (const f of distFiles) {
  const src = path.join(repoRoot, f);
  if (fs.existsSync(src)) archive.file(src, { name: f });
}

archive.finalize();
