import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ session: vi.fn(), select: vi.fn(), update: vi.fn(), returning: vi.fn(), where: vi.fn() }));
vi.mock("./auth", () => ({ currentSession: mocks.session }));
vi.mock("@/db/client", () => ({ db: () => ({ select: () => ({ from: () => ({ where: () => ({ limit: mocks.select }) }) }), update: mocks.update }) }));
import { PATCH } from "@/app/api/operations/route";
const request = () => new Request("https://example.com/api/operations", { method: "PATCH", body: JSON.stringify({ id: "intent", state: "awaiting_signature" }) });
beforeEach(() => {
  vi.clearAllMocks();
  mocks.session.mockResolvedValue({ subject: "owner" });
  mocks.select.mockResolvedValue([{ id: "intent", ownerSubject: "owner", kind: "register_agent", state: "draft" }]);
  mocks.where.mockReturnValue({ returning: mocks.returning });
  mocks.update.mockReturnValue({ set: () => ({ where: mocks.where }) });
});
it("refuses an already claimed registration intent", async () => {
  mocks.select.mockResolvedValue([{ id: "intent", ownerSubject: "owner", kind: "register_agent", state: "awaiting_signature" }]);
  expect((await PATCH(request())).status).toBe(409);
  expect(mocks.update).not.toHaveBeenCalled();
});
it("rejects the loser of a concurrent intent claim", async () => {
  mocks.returning.mockResolvedValue([]);
  expect((await PATCH(request())).status).toBe(409);
  expect(mocks.where).toHaveBeenCalled();
});
it("allows the single successful claimant", async () => {
  mocks.returning.mockResolvedValue([{ id: "intent", state: "awaiting_signature" }]);
  expect((await PATCH(request())).status).toBe(200);
});
it("rejects another subject before any mutation", async () => {
  mocks.session.mockResolvedValue({ subject: "other" });
  expect((await PATCH(request())).status).toBe(404);
  expect(mocks.update).not.toHaveBeenCalled();
});
