import { afterEach, describe, expect, it } from "vitest";
import { normalizePrivyVerificationKey, privyAppId } from "./config";

afterEach(() => { delete process.env.NEXT_PUBLIC_PRIVY_CLIENT_ID; delete process.env.NEXT_PUBLIC_PRIVY_APP_ID; });

describe("public application config", () => {
  it("prefers the Vercel config App ID and supports the legacy name", () => {
    process.env.NEXT_PUBLIC_PRIVY_CLIENT_ID = "vercel-app";
    process.env.NEXT_PUBLIC_PRIVY_APP_ID = "legacy-app";
    expect(privyAppId()).toBe("vercel-app");
    delete process.env.NEXT_PUBLIC_PRIVY_CLIENT_ID;
    expect(privyAppId()).toBe("legacy-app");
  });
});

describe("Privy verification key", () => {
  it("wraps a dashboard base64 key as SPKI PEM", () => {
    expect(normalizePrivyVerificationKey("YWJj")).toBe("-----BEGIN PUBLIC KEY-----\nYWJj\n-----END PUBLIC KEY-----");
  });

  it("preserves an existing PEM key", () => {
    const pem = "-----BEGIN PUBLIC KEY-----\nYWJj\n-----END PUBLIC KEY-----";
    expect(normalizePrivyVerificationKey(pem)).toBe(pem);
  });
});
