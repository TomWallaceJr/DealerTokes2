#!/usr/bin/env node
// scripts/clean.js
// Cross-platform cache cleanup: removes Next.js build cache and TS build info
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
console.log('Clean complete.');

