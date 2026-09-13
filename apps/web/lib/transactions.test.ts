import { describe, expect, it } from "vitest";
import { operationId, transitionOperation } from "./transactions";
describe("transaction lifecycle", () => {
  it("allows the declared sequence and lost-response recovery", () => { expect(transitionOperation("draft", "awaiting_signature")).toBe("awaiting_signature"); expect(transitionOperation("awaiting_signature", "draft")).toBe("draft"); expect(transitionOperation("awaiting_signature", "finalized")).toBe("finalized"); expect(transitionOperation("submitted", "finalized")).toBe("finalized"); });
  it("blocks skips and creates deterministic intent IDs", () => { expect(() => transitionOperation("draft", "submitted")).toThrow(); expect(operationId("publish", "0xAB", "0xCD")).toBe(operationId("publish", "0xab", "0xcd")); });
});
