export const workspaceRoles = ["owner", "admin", "reviewer", "contributor", "viewer"] as const;
export type WorkspaceRole = (typeof workspaceRoles)[number];
export type MembershipStatus = "active" | "removed" | "suspended";
export type EvidencePermission = "read" | "export";

export function isWorkspaceRole(value: unknown): value is WorkspaceRole { return typeof value === "string" && workspaceRoles.includes(value as WorkspaceRole); }
export function canManageWorkspace(role: WorkspaceRole, status: MembershipStatus = "active") { return status === "active" && (role === "owner" || role === "admin"); }
export function canAccessPrivateEvidence(input: { membershipStatus: MembershipStatus | null; grantStatus: "active" | "revoked" | null; expiresAt?: Date | null }) {
  return input.membershipStatus === "active" && input.grantStatus === "active" && (!input.expiresAt || input.expiresAt > new Date());
}
export function validWorkspaceSlug(value: unknown) { return typeof value === "string" && /^[a-z0-9][a-z0-9-]{1,46}[a-z0-9]$/.test(value); }
