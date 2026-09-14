import { describe, expect, it } from "vitest";
import { operationId, transitionOperation } from "./transactions";
const wallet = "0x52908400098527886e0f7030069857d2e4169ee7";
const digest = `0x${"cd".repeat(32)}`;
describe("transaction lifecycle", () => {
  it("allows the declared sequence and lost-response recovery", () => { expect(transitionOperation("draft", "awaiting_signature")).toBe("awaiting_signature"); expect(transitionOperation("awaiting_signature", "draft")).toBe("draft"); expect(transitionOperation("awaiting_signature", "finalized")).toBe("finalized"); expect(transitionOperation("submitted", "finalized")).toBe("finalized"); });
  it("accepts an idempotent state update after a safe retry", () => { expect(transitionOperation("awaiting_signature", "awaiting_signature")).toBe("awaiting_signature"); });
  it("blocks skips and creates deterministic intent IDs", () => { expect(() => transitionOperation("draft", "submitted")).toThrow(); expect(operationId("register_contribution", "0x52908400098527886E0F7030069857D2E4169EE7", `0x${"CD".repeat(32)}`)).toBe(operationId("register_contribution", wallet, digest)); });
  it("rejects malformed transaction intents", () => {
    expect(() => operationId("publish", wallet, digest)).toThrow("kind");
    expect(() => operationId("register_contribution", "0xAB", digest)).toThrow("wallet");
    expect(() => operationId("register_contribution", wallet, "0xCD")).toThrow("digest");
  });
});
