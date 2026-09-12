import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { keccak_256 } from '@noble/hashes/sha3.js';

const contracts = [
  ['AttestiaProfileRegistry', 'src/AttestiaProfileRegistry.sol'],
  ['ContributionRegistry', 'src/ContributionRegistry.sol'],
  ['AttestationRegistry', 'src/AttestationRegistry.sol'],
];

const args = Object.fromEntries(
  process.argv.slice(2).map((arg) => {
    const [key, ...value] = arg.replace(/^--/, '').split('=');
    return [key, value.join('=')];
  }),
);
const output = args.output ?? 'deployments/build-manifest.json';
const deployment = args.deployment
  ? JSON.parse(await readFile(args.deployment, 'utf8'))
  : { status: 'undeployed-build', contracts: {} };
const deployed = deployment.status === 'deployed';
const addressPattern = /^0x[0-9a-fA-F]{40}$/;
const transactionPattern = /^0x[0-9a-fA-F]{64}$/;

if (!deployed && deployment.status !== 'undeployed-build') {
  throw new Error('status must be deployed or undeployed-build');
}
if (deployed) {
  if (!args['rpc-url']) throw new Error('--rpc-url is required for a deployed manifest');
  if (!Number.isSafeInteger(deployment.chainId) || !Number.isSafeInteger(deployment.blockNumber)) {
    throw new Error('deployed manifest requires integer chainId and blockNumber');
  }
  for (const field of ['pauseAuthority', 'erc8004IdentityRegistry']) {
    if (!addressPattern.test(deployment[field] ?? '')) throw new Error(`invalid ${field}`);
  }
  if (typeof deployment.negativeClaimsEnabled !== 'boolean') {
    throw new Error('negativeClaimsEnabled must be boolean');
  }
  if (
    !Array.isArray(deployment.transactionHashes) || deployment.transactionHashes.length === 0
    || deployment.transactionHashes.some((hash) => !transactionPattern.test(hash))
  ) throw new Error('invalid transactionHashes');
}

const sha256 = (value) => `0x${createHash('sha256').update(value).digest('hex')}`;
const keccak256 = (hex) => `0x${Buffer.from(keccak_256(Buffer.from(hex, 'hex'))).toString('hex')}`;
const git = (...command) => execFileSync('git', command, { encoding: 'utf8' }).trim();
const rpc = async (method, params) => {
  const response = await fetch(args['rpc-url'], {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
  });
  const payload = await response.json();
  if (!response.ok || payload.error) throw new Error(payload.error?.message ?? response.statusText);
  return payload.result;
};

if (deployed) {
  const rpcChainId = Number(BigInt(await rpc('eth_chainId', [])));
  if (rpcChainId !== deployment.chainId) {
    throw new Error(`RPC chain ${rpcChainId} does not match manifest chain ${deployment.chainId}`);
  }
}

const entries = {};
for (const [name, source] of contracts) {
  const artifact = JSON.parse(await readFile(`out/${name}.sol/${name}.json`, 'utf8'));
  const address = deployment.contracts?.[name] ?? null;
  if (deployed && !addressPattern.test(address ?? '')) throw new Error(`invalid ${name} address`);
  const deploymentBlock = deployed ? `0x${deployment.blockNumber.toString(16)}` : null;
  const deployedCode = deployed ? await rpc('eth_getCode', [address, deploymentBlock]) : null;
  if (deployed && (!deployedCode || deployedCode === '0x')) throw new Error(`no code at ${address}`);
  entries[name] = {
    address,
    source,
    abiSha256: sha256(JSON.stringify(artifact.abi)),
    creationBytecodeKeccak256: keccak256(artifact.bytecode.object.replace(/^0x/, '')),
    compiledRuntimeTemplateKeccak256: keccak256(
      artifact.deployedBytecode.object.replace(/^0x/, ''),
    ),
    deployedRuntimeBytecodeKeccak256: deployedCode
      ? keccak256(deployedCode.replace(/^0x/, ''))
      : null,
  };
}

const manifest = {
  schemaVersion: 1,
  status: deployment.status ?? 'deployed',
  generatedAt: new Date().toISOString(),
  source: {
    commit: git('rev-parse', 'HEAD'),
    dirty: git('status', '--porcelain').length > 0,
  },
  toolchain: {
    foundry: '1.8.0',
    solidity: '0.8.28',
    openzeppelinContracts: git('-C', 'lib/openzeppelin-contracts', 'rev-parse', 'HEAD'),
    forgeStd: git('-C', 'lib/forge-std', 'rev-parse', 'HEAD'),
    foundryNetwork: 'monad',
  },
  deployment: {
    chainId: deployment.chainId ?? null,
    blockNumber: deployment.blockNumber ?? null,
    transactionHashes: deployment.transactionHashes ?? null,
    pauseAuthority: deployment.pauseAuthority ?? null,
    erc8004IdentityRegistry: deployment.erc8004IdentityRegistry ?? null,
    negativeClaimsEnabled: deployment.negativeClaimsEnabled ?? null,
  },
  contracts: entries,
};

await mkdir(dirname(output), { recursive: true });
await writeFile(output, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(output);
