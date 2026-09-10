# Phase 0 validation record

Checked 5 September 2026 on macOS arm64, Node 26.7.0 / pnpm 10.32.1, Chromium through Playwright 1.63.0. Tests cover specification fixtures and the standalone simulation; no product backend or contracts exist.

## Specification and review

- `pnpm check`: **68 specification checks passed** — 13 valid fixtures, structural invalid cases, 13 canonical metadata vectors, fixed artifact/keccak known answers, tamper detection and lifecycle examples.
- Seven additional metadata vectors were independently cross-checked against Cast keccak. Normal checks compare committed expected vectors and never regenerate them.
- Dependency audit: no known vulnerabilities reported for the pinned Phase 0 development dependencies on the check date. The prototype has no runtime packages.
- Independent document review fixed three conflicts: durable domain history versus temporary security-log retention, same-creator-profile revision authorization, and explicit API namespace scoping.
- Ponytail review retained one schema bundle, one checker and three standalone prototype files; no app framework, custom cryptography, production service or deployment scaffolding. Public URLs now reject embedded credentials.

## Browser acceptance

Browser suite covers:

- Draft → publication → completion/authorship claims → dispute annotation → issuer revocation → changed counts → JSON/CSV export.
- All six failure controls: rejection, session expiry, wallet mismatch, duplicates, inaccessible evidence and delayed indexing.
- Draft persistence, linked validation errors, keyboard skip link, self-claim exclusion and explicit supersession.
- Claim/revocation lag preserves the previous projection until recovery.
- Eight screens at desktop 1440×1000, mobile 360×800 and landscape 800×360, with reduced motion enabled and axe WCAG A/AA checks.

**Full suite: 12 browser tests passed.** All 24 screen/viewport combinations passed the configured axe rules and document-overflow checks. Mobile navigation received an additional visual spacing pass, followed by rerunning the responsive suite. Documentation checks passed for 49 local links; JavaScript syntax check passed.

Detected issues repaired during QA: 360px navigation/graph overflow, profile grid minimum width, keyboard access to horizontally scrollable counts and skip-link route changes. A test helper was also corrected to open failure controls only when closed.

## Evidence and limits

[Desktop capture](research/wireflow-desktop.png) · [Mobile capture](research/wireflow-mobile.png) · [Dated RPC observations](research/registry-observations.json).

Screenshots show synthetic UI. Automated axe and keyboard checks do not establish complete WCAG conformance or replace screen-reader/user testing. Other browser engines, 100-node graph performance, real signing/finality, production URL fetching/scanning, private ACL, billing, deployment verification and load/availability targets belong to later-phase tests.

Interviews conducted: **0**. Partner commitment: **pending**. Legal/privacy review: **pending**. Sponsorship: **documented candidate, untested with accounts**. Contract deployments and onchain writes: **0**. Full Phase 0 external gates therefore remain open.
