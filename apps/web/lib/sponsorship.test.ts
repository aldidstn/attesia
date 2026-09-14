import { describe, expect, it } from "vitest";
import { canOfferSelfPay } from "./sponsorship";

describe("sponsorship fallback", () => {
  it("offers an explicit self-paid retry for sponsorship configuration failures", () => {
    expect(canOfferSelfPay(new Error("Gas sponsorship is not enabled"))).toBe(true);
    expect(canOfferSelfPay(new Error("Paymaster policy rejected this request"))).toBe(true);
  });

  it("does not retry rejected or ambiguous transactions", () => {
    expect(canOfferSelfPay(new Error("User rejected the request"))).toBe(false);
    expect(canOfferSelfPay(new Error("RPC timeout"))).toBe(false);
  });
});
