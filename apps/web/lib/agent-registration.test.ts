import { describe, expect, it } from "vitest";
import { encodeAbiParameters, encodeEventTopics, type Hex } from "viem";
import { agentRegistration, identityRegistry, registrationAbi, registeredAgentId } from "./agent-registration";

const owner = "0xe7cfE7f7FeBF4c5758bAFfD04e044FFF4A844B90";
const uri = "ipfs://example";
const log = { address: identityRegistry, topics: encodeEventTopics({ abi: registrationAbi, eventName: "Registered", args: { agentId: 42n, owner } }) as Hex[], data: encodeAbiParameters([{ type: "string" }], [uri]) };
describe("ERC-8004 registration", () => {
  it("publishes an inactive discovery identity without invented services", () => {
    expect(agentRegistration({ name: " Test ", description: "Acceptance identity", image: "", website: "" })).toMatchObject({ name: "Test", active: false, services: [], supportedTrust: [] });
  });
  it("rejects empty fields, credentials and unsafe endpoints", () => {
    for (const values of [{ name: " " }, { description: "private_key=abcdefghijklmno" }, { website: "http://example.com" }, { image: "https://localhost/a.png" }]) {
      expect(() => agentRegistration({ name: "Test", description: "Test identity", image: "", website: "", ...values })).toThrow();
    }
  });
  it("extracts agent ID only from successful matching registry, owner and URI", () => {
    expect(registeredAgentId({ status: "success", logs: [log] }, owner, uri)).toBe("42");
    expect(() => registeredAgentId({ status: "reverted", logs: [log] }, owner, uri)).toThrow();
    expect(() => registeredAgentId({ status: "success", logs: [{ ...log, address: owner }] }, owner, uri)).toThrow();
    expect(() => registeredAgentId({ status: "success", logs: [log] }, identityRegistry, uri)).toThrow();
    expect(() => registeredAgentId({ status: "success", logs: [log] }, owner, "ipfs://other")).toThrow();
  });
});
