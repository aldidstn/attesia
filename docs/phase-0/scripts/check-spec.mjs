import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import canonicalize from 'canonicalize';
import { keccak_256 } from '@noble/hashes/sha3.js';

// Executable acceptance examples, not application or contract implementation.
const root = new URL('../', import.meta.url);
const read = async (path) => JSON.parse(await readFile(new URL(path, root), 'utf8'));
const sha256 = (bytes) => `0x${createHash('sha256').update(bytes).digest('hex')}`;
const keccak256 = (bytes) => `0x${Buffer.from(keccak_256(bytes)).toString('hex')}`;
const metadataDigest = (value) => keccak256(Buffer.from(canonicalize(value), 'utf8'));
const ajv = new Ajv2020({ strict: true, allErrors: true });
addFormats(ajv);
const schema = await read('schemas/attestia.v1.schema.json');
const validate = ajv.compile(schema);
let checks = 0;

function check(name, run) {
  try {
    run();
    checks++;
  } catch (error) {
    throw new Error(name, { cause: error });
  }
}

const valid = {};
for (const name of (await readdir(new URL('fixtures/valid/', root))).sort()) {
  valid[name] = await read(`fixtures/valid/${name}`);
  check(`valid schema: ${name}`, () => {
    assert.equal(validate(valid[name]), true, ajv.errorsText(validate.errors));
  });
}

for (const example of await read('fixtures/invalid-cases.json')) {
  check(`invalid schema: ${example.name}`, () => {
    const value = structuredClone(valid[example.base]);
    const parent = example.path.slice(0, -1).reduce((object, key) => object[key], value);
    const field = example.path.at(-1);
    if (example.operation === 'delete') delete parent[field];
    else parent[field] = example.value;
    assert.equal(validate(value), false, 'Invalid example unexpectedly passed');
  });
}

const vectors = await read('fixtures/digest-vectors.json');
for (const vector of vectors.artifacts) {
  const bytes = vector.file
    ? await readFile(new URL(`fixtures/${vector.file}`, root))
    : Buffer.from(vector.utf8, 'utf8');
  check(`artifact vector: ${vector.name}`, () => assert.equal(sha256(bytes), vector.sha256));
}
check('Keccak-256 known answer; never substitute SHA3-256', () => {
  assert.equal(keccak256(Buffer.from(vectors.keccakKnownAnswer.utf8)), vectors.keccakKnownAnswer.keccak256);
  assert.notEqual(createHash('sha3-256').update('abc').digest('hex'), vectors.keccakKnownAnswer.keccak256.slice(2));
});
for (const vector of vectors.metadata) {
  const value = vector.file ? await read(`fixtures/${vector.file}`) : vector.value;
  check(`canonical metadata vector: ${vector.name}`, () => {
    assert.equal(canonicalize(value), vector.canonical);
    assert.equal(metadataDigest(value), vector.keccak256);
  });
}
check('key insertion order does not change digest; array order does', () => {
  assert.equal(metadataDigest({ a: 1, b: 2 }), metadataDigest({ b: 2, a: 1 }));
  assert.notEqual(metadataDigest([1, 2]), metadataDigest([2, 1]));
});
check('no Unicode normalization is performed', () => {
  assert.notEqual(metadataDigest({ value: 'é' }), metadataDigest({ value: 'e\u0301' }));
});

for (const example of await read('fixtures/integrity-cases.json')) {
  const metadata = await read(`fixtures/${example.metadata}`);
  if (example.kind === 'artifact') {
    let bytes = await readFile(new URL(`fixtures/${example.artifact}`, root));
    if (example.tamper === 'artifact') bytes = Buffer.concat([bytes, Buffer.from('changed')]);
    if (example.tamper === 'digest') metadata.artifact.sha256 = `0x${'0'.repeat(64)}`;
    check(`integrity rejection: ${example.name}`, () => {
      assert.equal(validate(metadata), true, 'Integrity mismatch remains structurally valid');
      assert.notEqual(sha256(bytes), metadata.artifact.sha256);
    });
  } else {
    check(`integrity rejection: ${example.name}`, () => {
      assert.notEqual(metadataDigest(metadata), example.anchoredDigest);
    });
  }
}

const rubric = valid['rubric.json'];
const quality = valid['claim-quality.json'];
function validateRubricReference(claim, rubricValue) {
  assert.equal(claim.workspaceId, rubricValue.workspaceId);
  assert.equal(claim.rubric.id, rubricValue.id);
  assert.equal(claim.rubric.version, rubricValue.version);
  assert.equal(claim.rubric.digest, metadataDigest(rubricValue));
  const criterionIds = rubricValue.criteria.map((criterion) => criterion.id);
  assert.equal(new Set(criterionIds).size, criterionIds.length);
  const results = claim.assessment.criterionResults;
  assert.deepEqual(results.map((result) => result.criterionId).sort(), [...criterionIds].sort());
  assert.equal(claim.result, results.every((result) => result.result === 1) ? 1 : -1);
}
check('quality binds published rubric and every criterion exactly once', () => {
  validateRubricReference(quality, rubric);
  assert.throws(() => validateRubricReference({ ...quality, workspaceId: `0x${'9'.repeat(64)}` }, rubric));
  assert.throws(() => validateRubricReference({ ...quality, rubric: { ...quality.rubric, version: 2 } }, rubric));
  assert.throws(() => validateRubricReference({ ...quality, assessment: { criterionResults: [] } }, rubric));
});

// Disputes annotate active claims; they never reduce raw counts.
function active(record, at) {
  return record.issuedAt <= at && !record.revoked && !record.supersededBy
    && (record.validUntil === 0 || at < record.validUntil);
}
function signals(records, at) {
  const external = records.filter((record) => !record.selfAtIssuance && record.issuedAt <= at);
  const current = external.filter((record) => active(record, at));
  return {
    rawActive: current.length,
    positive: current.filter((record) => record.result === 1).length,
    negative: current.filter((record) => record.result === -1).length,
    disputed: current.filter((record) => record.disputed).length,
    undisputed: current.filter((record) => !record.disputed).length,
    uniqueAttesters: new Set(current.map((record) => record.issuer)).size,
    historicalExternal: external.length,
  };
}
const base = { issuer: 'reviewer-a', contributionId: 'contribution-a', claimType: 'COMPLETION', result: 1, issuedAt: 10, validUntil: 0, revoked: false, supersededBy: null, disputed: false, selfAtIssuance: false };
check('disputes preserve raw active totals; negative outcomes count separately', () => {
  const records = [base, { ...base, issuer: 'reviewer-b', result: -1, disputed: true }];
  assert.deepEqual(signals(records, 20), { rawActive: 2, positive: 1, negative: 1, disputed: 1, undisputed: 1, uniqueAttesters: 2, historicalExternal: 2 });
  assert.equal(signals(records.map((record) => ({ ...record, disputed: true })), 20).rawActive, 2);
});
check('expired, revoked, superseded, future and self claims do not add active external counts', () => {
  const records = [base, { ...base, validUntil: 20 }, { ...base, revoked: true }, { ...base, supersededBy: 'replacement' }, { ...base, selfAtIssuance: true }, { ...base, issuedAt: 21 }];
  assert.equal(signals(records, 20).rawActive, 1);
  assert.equal(signals(records, 20).historicalExternal, 4);
  assert.equal(active({ ...base, validUntil: 20 }, 19), true);
  assert.equal(active({ ...base, validUntil: 20 }, 20), false);
  assert.equal(active({ ...base, revoked: true, validUntil: 0 }, 30), false);
});
check('revocation updates active totals without deleting history', () => {
  const records = [base, { ...base, issuer: 'reviewer-b', claimType: 'USAGE' }];
  const before = signals(records, 20);
  const after = signals([base, { ...records[1], revoked: true }], 20);
  assert.equal(before.rawActive - after.rawActive, 1);
  assert.equal(before.historicalExternal, after.historicalExternal);
});
check('self identity is captured from owner/delegates at issuance', () => {
  const owner = 'creator';
  const delegatesAtIssuance = new Set(['delegate']);
  const selfAtIssuance = (issuer) => issuer === owner || delegatesAtIssuance.has(issuer);
  const record = { ...base, issuer: 'delegate', selfAtIssuance: selfAtIssuance('delegate') };
  delegatesAtIssuance.clear();
  assert.equal(signals([record], 20).rawActive, 0);
  assert.equal(selfAtIssuance('reviewer-a'), false);
});

function validateReplacement(oldRecord, nextRecord, at) {
  assert.equal(active(oldRecord, at), true);
  for (const field of ['issuer', 'contributionId', 'claimType']) assert.equal(nextRecord[field], oldRecord[field]);
  assert.equal(nextRecord.supersedes, oldRecord.id);
}
check('supersession is issuer-scoped; stale or cross-issuer targets fail', () => {
  const oldRecord = { ...base, id: 'old' };
  const nextRecord = { ...base, id: 'new', supersedes: 'old' };
  validateReplacement(oldRecord, nextRecord, 20);
  assert.throws(() => validateReplacement(oldRecord, { ...nextRecord, issuer: 'reviewer-b' }, 20));
  assert.throws(() => validateReplacement({ ...oldRecord, supersededBy: 'new' }, nextRecord, 20));
  assert.throws(() => validateReplacement({ ...oldRecord, revoked: true }, nextRecord, 20));
  assert.equal(signals([base, { ...base, issuer: 'reviewer-b' }], 20).rawActive, 2);
});

function validateRevision(parent, child) {
  assert.equal(child.revision.parentId, parent.id);
  assert.equal(child.creatorProfileId, parent.metadata.creatorProfileId);
  assert.notEqual(metadataDigest(child), metadataDigest(parent.metadata));
}
check('same-artifact provenance revision permitted; duplicate roots and changed creator rejected', () => {
  const parent = { id: `0x${'3'.repeat(64)}`, metadata: valid['contribution.json'] };
  const child = valid['contribution-provenance-revision.json'];
  validateRevision(parent, child);
  assert.equal(child.artifact.sha256, parent.metadata.artifact.sha256);
  assert.throws(() => validateRevision(parent, { ...child, creatorProfileId: `0x${'9'.repeat(64)}` }));
  assert.throws(() => validateRevision(parent, { ...child, revision: { ...child.revision, parentId: null } }));
  const rootKey = (metadata) => `${metadata.creatorProfileId}:${metadata.artifact.sha256}`;
  assert.equal(new Set([rootKey(parent.metadata), rootKey(structuredClone(parent.metadata))]).size, 1);
  const childKey = (metadata) => `${metadata.creatorProfileId}:${metadata.revision.parentId}:${metadata.artifact.sha256}:${metadataDigest(metadata)}`;
  assert.equal(new Set([childKey(child), childKey(structuredClone(child))]).size, 1);
});
check('negative publication requires testnet or explicit legal-approved deployment policy', () => {
  const negative = valid['claim-negative-testnet.json'];
  const mayPublish = (claim, environment, approved) => claim.result === 1 || environment === 'testnet' || approved;
  assert.equal(mayPublish(negative, 'testnet', false), true);
  assert.equal(mayPublish(negative, 'mainnet', false), false);
  assert.equal(mayPublish(negative, 'mainnet', true), true);
});

console.log(`Phase 0 specification: ${checks} checks passed (${Object.keys(valid).length} valid fixtures; ${vectors.metadata.length} canonical metadata vectors).`);
console.log('Scope: schemas and executable acceptance examples only; no live contracts, partner validation, or production security proof.');
