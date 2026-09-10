import assert from 'node:assert/strict';
import { readdir, readFile, access } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const directory = resolve('docs/phase-0');
let checked = 0;
for (const name of ['../../README.md', ...await readdir(directory)]) {
  if (!name.endsWith('.md')) continue;
  const path = resolve(directory, name);
  const content = await readFile(path, 'utf8');
  for (const [, target] of content.matchAll(/\]\(([^\s)]+)\)/g)) {
    if (/^(https?:|mailto:|#)/.test(target)) continue;
    await access(resolve(dirname(path), target.split('#')[0]));
    checked++;
  }
}
const decisions = await readFile(resolve(directory, 'ARCHITECTURE.md'), 'utf8');
assert.ok(decisions.includes('attestia.counts.v1'));
assert.ok(decisions.includes('separate') && decisions.includes('dispute'));
console.log(`Documentation checks passed: ${checked} local links.`);
