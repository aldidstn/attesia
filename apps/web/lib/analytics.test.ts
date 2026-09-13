import { describe, expect, it } from "vitest";
import { sanitizeAnalyticsProperties } from "./analytics";

describe("privacy-safe analytics", () => {
  it("keeps only declared primitive dimensions", () => {
    expect(sanitizeAnalyticsProperties("activation", { contributionType: "pull_request", anonymousId: "anon-1" })).toEqual({ contributionType: "pull_request", anonymousId: "anon-1" });
    expect(() => sanitizeAnalyticsProperties("activation", { details: { wallet: "0x123" } })).toThrow("Unexpected analytics property");
    expect(() => sanitizeAnalyticsProperties("activation", { contributionType: `0x${"1".repeat(40)}` })).toThrow("Wallet addresses are not accepted");
  });
});
