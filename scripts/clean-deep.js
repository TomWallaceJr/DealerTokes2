#!/usr/bin/env node
// scripts/clean-deep.js
// Deeper cleanup: removes caches, node_modules, and lockfile
const fs = require('fs');
const path = require('path');

function rm(target) {
  const p = path.resolve(process.cwd(), target);
  if (!fs.existsSync(p)) return;
  try {
    fs.rmSync(p, { recursive: true, force: true });
    console.log('Removed', target);
  } catch (e) {
    console.error('Failed to remove', target, e.message);
    process.exitCode = 1;
  }
}

rm('.next');
rm('tsconfig.tsbuildinfo');
rm('node_modules');
rm('package-lock.json');

console.log('Deep clean complete. Run `npm install` next.');

