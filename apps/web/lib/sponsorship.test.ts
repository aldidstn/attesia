import { describe, expect, it } from "vitest";
import { canOfferSelfPay, isSponsorshipEnabled } from "./sponsorship";

describe("sponsorship fallback", () => {
  it("supports a Vercel config flag and the legacy boolean flag", () => {
    expect(isSponsorshipEnabled({ NEXT_PUBLIC_SPONSORSHIP_MODE: "enabled" })).toBe(true);
    expect(isSponsorshipEnabled({ NEXT_PUBLIC_SPONSORSHIP_ENABLED: "true" })).toBe(true);
    expect(isSponsorshipEnabled({ NEXT_PUBLIC_SPONSORSHIP_ENABLED: "false" })).toBe(false);
  });
  it("offers an explicit self-paid retry for sponsorship configuration failures", () => {
    expect(canOfferSelfPay(new Error("Gas sponsorship is not enabled"))).toBe(true);
    expect(canOfferSelfPay(new Error("Paymaster policy rejected this request"))).toBe(true);
  });

  it("does not retry rejected or ambiguous transactions", () => {
    expect(canOfferSelfPay(new Error("User rejected the request"))).toBe(false);
    expect(canOfferSelfPay(new Error("RPC timeout"))).toBe(false);
  });
});
