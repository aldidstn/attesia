import { afterEach, describe, expect, it } from "vitest";
import { privyAppId } from "./config";

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
