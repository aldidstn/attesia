import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const template = await readFile(new URL('../.env.example', import.meta.url), 'utf8');
const ignore = await readFile(new URL('../.gitignore', import.meta.url), 'utf8');
const values = Object.fromEntries(
  template
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => {
      const separator = line.indexOf('=');
      return [line.slice(0, separator), line.slice(separator + 1)];
    }),
);

assert.equal(values.PRIVATE_KEY, '', 'PRIVATE_KEY must stay empty in .env.example');
assert.equal(values.ATTESTIA_ADMIN, '', 'ATTESTIA_ADMIN must stay environment-specific');
assert.match(values.ERC8004_IDENTITY_REGISTRY, /^0x[0-9a-fA-F]{40}$/);
assert.equal(values.ATTESTIA_MAINNET_APPROVED, 'false');
assert.match(ignore, /^\.env$/m, '.env must be ignored');
assert.match(ignore, /^!\.env\.example$/m, '.env.example must remain trackable');

console.log('Environment template: secret placeholders and deployment defaults are safe.');
