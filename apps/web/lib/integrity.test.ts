import { describe, expect, it } from "vitest";
import { canonicalJson, findCredential, metadataDigest, sha256, validatePublicUrl, validateTextArtifact } from "./integrity";
describe("integrity", () => {
  it("matches fixed RFC 8785 and keccak vectors", () => { expect(canonicalJson({ z: 1, a: "Attestia" })).toBe('{"a":"Attestia","z":1}'); expect(metadataDigest({ z: 1, a: "Attestia" })).toBe("0x1f2926bf41d133133126d6712fa0a50f145b947585ebd23a73814220e84b6c42"); });
  it("matches the SHA-256 known answer", async () => { expect(await sha256(new TextEncoder().encode("abc"))).toBe("0xba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"); });
  it("rejects unsafe URLs and active files", () => {
    for (const url of ["http://example.com", "https://localhost/a", "https://10.0.0.1/a", "https://172.20.0.1", "https://192.168.1.1", "https://[::1]/a"]) expect(() => validatePublicUrl(url)).toThrow();
    expect(validatePublicUrl("https://github.com/attestia/example").hostname).toBe("github.com");
    expect(() => validateTextArtifact({ name: "x.html", size: 2, type: "text/plain" })).toThrow();
  });
  it("detects likely credentials", () => { expect(findCredential("API_KEY=abcdefghijklmnop")).toBe(true); expect(findCredential(`eyJ${"a".repeat(24)}.${"b".repeat(24)}.${"c".repeat(24)}`)).toBe(true); expect(findCredential("ordinary public text")).toBe(false); });
});
