const fs = require('fs');
const path = require('path');
const target = path.resolve(__dirname, '..', 'test', 'setup', 'TronWeb.ts');

try {
    fs.unlinkSync(target);
} catch (ex) {}

fs.copyFileSync(
    path.resolve(__dirname, '..', 'test', 'setup', 'node.ts'),
    target,
);
