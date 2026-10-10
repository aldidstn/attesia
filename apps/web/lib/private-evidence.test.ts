import { describe, expect, it } from "vitest";
import { MAX_PRIVATE_EVIDENCE_BYTES, privateEvidenceConfig } from "./private-evidence";

describe("private evidence storage configuration", () => {
  it("fails closed until bucket, region, and KMS key are configured", () => {
    expect(privateEvidenceConfig({})).toBeNull();
    expect(privateEvidenceConfig({ SUPABASE_URL: "https://project.supabase.co", SUPABASE_SERVICE_ROLE_KEY: "service-role" })?.ttlSeconds).toBe(60);
  });
  it("rejects signed URL lifetimes above one minute", () => {
    expect(() => privateEvidenceConfig({ SUPABASE_URL: "https://project.supabase.co", SUPABASE_SERVICE_ROLE_KEY: "service-role", PRIVATE_EVIDENCE_UPLOAD_TTL_SECONDS: "61" })).toThrow("1-60");
    expect(MAX_PRIVATE_EVIDENCE_BYTES).toBe(10 * 1024 * 1024);
  });
});
