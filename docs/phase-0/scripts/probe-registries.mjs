// Read-only dependency probe. No accounts, signing, sponsorship, or transactions.
import { keccak_256 } from '@noble/hashes/sha3.js';
const hash = (bytes) => `0x${Buffer.from(keccak_256(bytes)).toString('hex')}`;
const selector = (signature) => hash(new TextEncoder().encode(signature)).slice(0, 10);
const networks = [
  { name: 'Monad Testnet', chainId: 10143, rpc: 'https://testnet-rpc.monad.xyz', identity: '0x8004A818BFB912233c491871b3d84c89A494BD9e', reputation: '0x8004B663056A597Dffe9eCcC1965A193B7388713' },
  { name: 'Monad Mainnet', chainId: 143, rpc: 'https://rpc.monad.xyz', identity: '0x8004A169FB4a3325136EB29fA0ceB6D2e539a432', reputation: '0x8004BAa17C55a88189AE136b182e5fdA19dE9b63' },
];
async function probe(network) {
  const rpc = async (method, params = []) => {
    const response = await fetch(network.rpc, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }), signal: AbortSignal.timeout(15000) });
    if (!response.ok) throw Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (data.error) throw Error(JSON.stringify(data.error));
    return data.result;
  };
  try {
    const chain = await rpc('eth_chainId');
    if (Number(BigInt(chain)) !== network.chainId) throw Error(`Wrong chain: ${chain}`);
    const block = await rpc('eth_getBlockByNumber', ['finalized', false]);
    if (!block?.number) throw Error('Finalized block unavailable');
    const records = {};
    for (const key of ['identity', 'reputation']) {
      const code = await rpc('eth_getCode', [network[key], block.number]);
      if (!/^0x[0-9a-f]+$/i.test(code) || code === '0x') throw Error(`${key}: no valid runtime bytecode`);
      const versionResult = await rpc('eth_call', [{ to: network[key], data: selector('getVersion()') }, block.number]);
      if (!/^0x[0-9a-f]{192,}$/i.test(versionResult)) throw Error(`${key}: invalid version response`);
      const implementationSlot = await rpc('eth_getStorageAt', [network[key], '0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc', block.number]);
      records[key] = { address: network[key], codeBytes: (code.length - 2) / 2, codeKeccak256: hash(Buffer.from(code.slice(2), 'hex')), getVersionRaw: versionResult, implementationSlot };
    }
    const identityResult = await rpc('eth_call', [{ to: network.reputation, data: selector('getIdentityRegistry()') }, block.number]);
    if (!identityResult?.toLowerCase().endsWith(network.identity.slice(2).toLowerCase())) throw Error('Reputation registry points to unexpected identity registry');
    return { ...network, observedAt: new Date().toISOString(), status: 'read-only probe succeeded', blockNumber: BigInt(block.number).toString(), blockHash: block.hash, records, reputationIdentityRaw: identityResult, identityMatches: identityResult.toLowerCase().endsWith(network.identity.slice(2).toLowerCase()) };
  } catch (error) {
    return { ...network, observedAt: new Date().toISOString(), status: 'unverified', error: error.message };
  }
}
console.log(JSON.stringify({ purpose: 'Dependency observations, not an Attestia deployment manifest', networks: await Promise.all(networks.map(probe)) }, null, 2));
