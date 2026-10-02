# Phase 3 threat controls

| Threat | Control |
| --- | --- |
| Reputation gaming | Self claims have zero external weight; unique issuers and reciprocal clusters are exposed |
| Dispute erasure | Active disputed claims remain counted and appear as a named subset |
| Lifecycle replay | Revoked, superseded, and expired states remain historical; projection tests rebuild deterministically |
| Stale score | Responses expose indexed block/timestamp; UI degrades explicitly when Envio is unavailable |
| Agent impersonation | Ownership comes from live ERC-8004 `ownerOf`; Attestia contract repeats the check on writes |
| Misleading capability claims | Policy UI always labels records as declared and does not imply enforcement |
| Trust-source mixing | ERC-8004 feedback and Attestia contribution claims render in separate sections |
| Malicious metadata | Server retrieval uses HTTPS/IPFS gateway validation, five-second timeout, and 512 KB response cap |
| Feed manipulation | Ranking inputs and order are displayed; mutual clusters are flagged without secret weighting |
| Analytics disclosure | New events use the existing primitive allowlist and reject addresses, URLs, evidence, and metadata |
