import { describe, expect, it } from "vitest";
import { addFeeBuffer } from "./use-attestia-write";

describe("addFeeBuffer", () => {
  it("adds a twenty percent buffer and rounds up", () => {
    expect(addFeeBuffer(100n)).toBe(120n);
    expect(addFeeBuffer(101n)).toBe(122n);
  });
});
