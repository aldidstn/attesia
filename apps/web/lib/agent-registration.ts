import { decodeEventLog, parseAbi, type Hex } from "viem";
import { findCredential, validatePublicUrl } from "./integrity";

export const identityRegistry = "0x8004A818BFB912233c491871b3d84c89A494BD9e" as const;
export const registrationAbi = parseAbi([
  "function register(string agentURI) returns (uint256 agentId)",
  "event Registered(uint256 indexed agentId, string agentURI, address indexed owner)",
]);

export function agentRegistration(input: { name: string; description: string; image: string; website: string }) {
  const name = input.name.trim(), description = input.description.trim();
  if (!name || name.length > 80 || !description || description.length > 1000) throw new Error("Enter a name (1–80 characters) and description (1–1000 characters).");
  if (findCredential(JSON.stringify(input))) throw new Error("Remove credentials before publication.");
  const image = input.image.trim(), website = input.website.trim();
  if (image) validatePublicUrl(image);
  if (website) validatePublicUrl(website);
  return { type: "https://eips.ethereum.org/EIPS/eip-8004#registration-v1", name, description, ...(image ? { image } : {}), services: website ? [{ name: "web", endpoint: website }] : [], active: false, x402Support: false, registrations: [], supportedTrust: [] };
}

export function registeredAgentId(receipt: { status: string; logs: readonly { address: string; topics: readonly Hex[]; data: Hex }[] }, owner: string, uri: string) {
  if (receipt.status !== "success") throw new Error("Registration reverted. No agent was created by this transaction.");
  for (const log of receipt.logs) {
    if (log.address.toLowerCase() !== identityRegistry.toLowerCase()) continue;
    try {
      const { args } = decodeEventLog({ abi: registrationAbi, eventName: "Registered", topics: [...log.topics] as [Hex, ...Hex[]], data: log.data });
      if (args.owner.toLowerCase() === owner.toLowerCase() && args.agentURI === uri) return args.agentId.toString();
    } catch { /* Other registry events are not registration evidence. */ }
  }
  throw new Error("Receipt does not match this registry, owner and metadata URI.");
}
