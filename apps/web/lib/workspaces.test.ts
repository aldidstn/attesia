import { describe, expect, it } from "vitest";
import { canAccessPrivateEvidence, canManageWorkspace, validWorkspaceSlug } from "./workspaces";

describe("workspace authorization", () => {
  it("limits workspace administration to active owners and admins", () => {
    expect(canManageWorkspace("owner")).toBe(true); expect(canManageWorkspace("admin")).toBe(true);
    expect(canManageWorkspace("reviewer")).toBe(false); expect(canManageWorkspace("admin", "suspended")).toBe(false);
  });
  it("requires both an active membership and explicit evidence grant", () => {
    expect(canAccessPrivateEvidence({ membershipStatus: "active", grantStatus: "active" })).toBe(true);
    expect(canAccessPrivateEvidence({ membershipStatus: "active", grantStatus: null })).toBe(false);
    expect(canAccessPrivateEvidence({ membershipStatus: "removed", grantStatus: "active" })).toBe(false);
    expect(canAccessPrivateEvidence({ membershipStatus: "active", grantStatus: "active", expiresAt: new Date(0) })).toBe(false);
  });
  it("accepts only public-safe workspace slugs", () => {
    expect(validWorkspaceSlug("monad-builders")).toBe(true); expect(validWorkspaceSlug("MonAD")).toBe(false);
    expect(validWorkspaceSlug("x")).toBe(false); expect(validWorkspaceSlug("private/evidence")).toBe(false);
  });
});
