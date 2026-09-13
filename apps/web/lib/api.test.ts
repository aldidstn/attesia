import { describe, expect, it } from "vitest";
import { decodeCursor, encodeCursor } from "./api";

describe("opaque pagination cursor", () => {
  it("round-trips without exposing the record ID", () => {
    const id = "0x1234";
    const cursor = encodeCursor(id);
    expect(cursor).not.toContain(id);
    expect(decodeCursor(cursor)).toBe(id);
  });
});
