import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const text = await readFile(new URL("../PRIVACY-THREAT-MODEL.md", import.meta.url), "utf8");
for (const requirement of [
  "SSE-KMS",
  "TTL <= 60 seconds",
  "No `NEXT_PUBLIC_*` storage secret",
  "Private evidence never changes public reputation counts",
  "P4-T01",
  "P4-T12",
  "No public IPFS",
  "not end-to-end encrypted",
]) assert.match(text, new RegExp(requirement.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
console.log("Phase 4 privacy model: required boundaries present.");
