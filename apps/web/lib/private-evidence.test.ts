import { describe, expect, it, vi } from "vitest";
import { MAX_PRIVATE_EVIDENCE_BYTES, privateEvidenceConfig, promoteQuarantineObject } from "./private-evidence";

const config = { url: "https://project.supabase.co", serviceRoleKey: "service-role", bucket: "private-evidence", ttlSeconds: 60 };

describe("private evidence storage", () => {
  it("fails closed until Supabase storage is configured", () => {
    expect(privateEvidenceConfig({})).toBeNull();
    expect(privateEvidenceConfig({ SUPABASE_URL: config.url, SUPABASE_SERVICE_ROLE_KEY: config.serviceRoleKey })?.ttlSeconds).toBe(60);
  });
  it("rejects signed URL lifetimes above one minute", () => {
    expect(() => privateEvidenceConfig({ SUPABASE_URL: config.url, SUPABASE_SERVICE_ROLE_KEY: config.serviceRoleKey, PRIVATE_EVIDENCE_UPLOAD_TTL_SECONDS: "61" })).toThrow("1-60");
    expect(MAX_PRIVATE_EVIDENCE_BYTES).toBe(10 * 1024 * 1024);
  });
  it("promotes clean quarantine content and removes the quarantine object", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
      const url = String(input);
      if (url.includes("/object/private-evidence/quarantine/")) return new Response("hello", { headers: { "content-type": "text/plain" } });
      if (url.includes("/object/private-evidence/vault/")) { expect(init?.method).toBe("POST"); return new Response(null, { status: 200 }); }
      return new Response(null, { status: 200 });
    });
    await expect(promoteQuarantineObject("quarantine/ws/evidence", config)).resolves.toMatchObject({ storageKey: "vault/ws/evidence", bytes: 5 });
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock).toHaveBeenLastCalledWith(`${config.url}/storage/v1/object/${config.bucket}`, expect.objectContaining({ method: "DELETE", body: JSON.stringify({ prefixes: ["quarantine/ws/evidence"] }) }));
    fetchMock.mockRestore();
  });
  it("rejects unsafe content before vault promotion", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("<script>", { headers: { "content-type": "text/html" } }));
    await expect(promoteQuarantineObject("quarantine/ws/bad", config)).rejects.toThrow("Unsafe private evidence type");
    vi.restoreAllMocks();
  });
});
