const fs = require('fs');
const crypto = require('crypto');
const glob = require('glob');
const path = require('path');

const hash = crypto.createHash('sha256');

const getAllFiles = (g) => glob.sync(g, {
  cwd: root
});

const root = path.join(__dirname, '..', '..');
const files = [
  __filename,
  ...getAllFiles('./src/scaffolding/**/*'),
  ...getAllFiles('./src/addons/**/*'),
  ...getAllFiles('./src/common/**/*'),
  path.join(root, 'webpack.config.js'),
  path.join(root, 'package.json'),
  path.join(root, 'package-lock.json'),
  // PenguinMod Desktop: also the lockfile Bun installs from and the VM / Render that are actually
  // built in (CI swaps in the editor's copies), so a new engine never reuses an old cached one.
  path.join(root, 'bun.lock'),
  ...getAllFiles('./node_modules/scratch-vm/{package.json,bun.lock,src/**/*}'),
  ...getAllFiles('./node_modules/scratch-render/{package.json,bun.lock,src/**/*}')
];
for (const file of files) {
  const stat = fs.statSync(file);
  if (!stat.isDirectory()) {
    hash.update(fs.readFileSync(file, 'utf-8'));
  }
}

const hex = hash.digest('hex');
console.log('Scaffolding build ID: ' + hex);
module.exports = hex;
