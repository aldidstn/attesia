# Phase 0 discovery and analytics

Status: **prepared, not validated**. No stakeholder interviews, organization commitment, willingness-to-pay evidence, or privacy/legal approval have been supplied. The prototype uses synthetic records and simulated transactions. The former external Phase 0 exit gates are deprecated and non-blocking; these artifacts still do not claim production readiness or partner validation.

Source: [PRD](../../Attestia-PRD.md) §§2–6, 16–20. Engineering decisions live in [Architecture](ARCHITECTURE.md), canonical data in [Specification](SPECIFICATION.md), and release gates in [Handoff](HANDOFF.md).

## Pilot scenario and hypotheses

The initial workflow is one public merged GitHub pull request. A contributor publishes an artifact snapshot, source/merge links, revision notes, collaborators, and voluntary AI disclosure. Reviewer A issues `COMPLETION`; reviewer B issues `AUTHORSHIP`. They use independent wallets, and neither is the contributor. Reviewer A then revokes their own claim with a reason. A visitor inspects the changed Delivery count, historical claims, integrity references, and export without connecting a wallet.

The merge supports a separate `USAGE` claim if someone actually reviews its evidence. Completion does not automatically imply usage, quality, or authorship. The primary scenario requires two claim types from two external reviewers; it does not require a quality judgment. All seven PRD contribution types remain in the schemas.

For the wireflow, all people, workspace names, results, identifiers, and activity are illustrative. Before a real testnet pilot, replace them with a consenting contributor's public artifact and two recruited reviewers. Synthetic activity stays excluded from product metrics. A self-seeded demo can test engineering; partner commitment is optional research evidence rather than a Phase 0 exit gate.

| Hypothesis | Test in discovery/pilot | Evidence required to change status |
|---|---|---|
| Maintainers value claim-specific history beyond raw GitHub activity | Ask about a recent contribution decision; compare current evidence with prototype | Recorded example of a decision the record helps make, including counterexamples |
| Contributors understand permanent public anchors and voluntary AI disclosure | Ask them to explain the publication review in their own words | Accurate explanation of public bytes, permanent references, and disclosure limits |
| Reviewers can make a narrow decision without a reward | Time one evidence-led review; ask what would make them return | Actual decision, elapsed time, friction, and stated incentive; no reward assumed |
| Admins can recruit two independent reviewers per contribution | Walk through their real recruitment/approval process | Identified reviewer pool and owner for reminders/escalation |
| Public-only evidence supports the first pilot | Classify a real candidate artifact and its review evidence | Artifact owner permits publication; privacy checklist has no critical ambiguity |
| A second community can reuse the record | Ask a verifier to assess an exported/public record | Independent verification or documented reason the record cannot be used |
| Workflow or API reliability merits payment | Ask current spend, budget authority, alternatives, and tradeoffs | Unprompted budget range, approval path, and later explicit paid-pilot intent |
| Wallet/signature steps are tolerable | Observe rejected signature and recovery; compare connect-at-publish timing | Completion and confusion observations; sponsorship remains a dependency test |

### Roles, needs, and support

These are assumptions to validate, not observed personas. Workspace membership organizes workflow and controls private access in Phase 4; it does not determine who may issue public claims or suppress otherwise active external counts.

| Role | Working assumption and supported task | Help/escalation path to establish before pilot |
|---|---|---|
| Contributor | Owns or has authorization to publish evidence; needs saved drafts, disclosure review, two reviews, and portable profile | Workspace admin for invitations; product operator for failed writes; privacy contact for exposure/removal requests |
| Reviewer | Can inspect evidence and state a narrow claim; can decline, disclose conflicts, and revoke own claim | Admin for rubric clarification/access; product operator for signing failures; direct contract revoke documented as fallback |
| Community admin | Recruits reviewers, configures accepted types/rubrics, handles queue and export | Product operator for service issues; moderation owner for disputes; designated privacy reviewer for data classification |
| Agent operator | Controls an ERC-8004 identity and understands a policy declaration does not enforce actions | Product operator for registry/ownership mismatch; no promise of custody or enforcement support |
| Public verifier | Needs evidence, current/historical status, source chain, and freshness without a wallet | Published support channel for broken evidence/API; dispute/report path for contested claims |

Before pilot, publish one real support channel (email or Discord), owner, backup owner, business-day calendar, and timezone. None has been assigned yet. First-response target: within two business days; this is an acknowledgement/triage target, not a resolution guarantee. Classify requests as access/transaction, evidence privacy, dispute/moderation, or service availability; keep private reports outside public analytics. An imminent evidence exposure goes directly to the incident/privacy owner rather than waiting in the ordinary support queue.

## Interview pack

Recruit **3–5 distinct people**: one contributor, two independent reviewers, and one admin/budget owner; add one external verifier if available. If only three can attend, a reviewer may also cover admin responsibilities; record the overlap and resulting sampling limitation. Do not count multiple roles from one interview as independent validation.

Run 35–45 minutes per person. Obtain consent for notes, separately for recording. Explain that the prototype is simulated and all prices are hypotheses. Ask about past behavior before showing product concepts; record objections and disconfirming evidence. Store identifiable notes in an approved private location, not this repository. Use participant codes in the decision log.

| Segment | Questions/tasks | Capture |
|---|---|---|
| Context, 5 minutes | “Describe the last contribution you submitted, reviewed, or accepted. What evidence did you actually use? What failed?” | Current workflow, tools, role, actual outcome |
| Taxonomy, 8 minutes | “What would completion, authorship, quality, usage, and provenance each establish? Which must remain separate? What evidence would let you make or refuse each claim?” | Ambiguous terms, evidence needed, mistaken implications |
| Walkthrough, 10 minutes | Publish a synthetic PR, inspect evidence, issue an authorship claim, locate its source reference, revoke a claim, compare claimed and attested provenance | Task completion, errors, time, confidence, facilitator assistance |
| Privacy, 5 minutes | “Which fields could you publish today? Whose permission is needed? What do you expect deletion to remove? Does AI disclosure expose prompts, credentials, or client information?” | Candidate public evidence and unresolved consent/privacy questions |
| Incentives, 5 minutes | “Why would you review this? How many reviews can you do weekly? What is a reasonable deadline? What would make you decline or stop? Who can remind you?” | Reviewer capacity, expected effort, conflicts, fatigue, reason to return |
| Payment/commitment, 7 minutes | Use role-specific questions below; ask for a next step without implying commitment | Budget authority, alternatives, experiment consent, follow-up owner/date |

### Role-specific prompts

- **Contributor:** “What proof would help with your next application? Would you expose this artifact and collaborator attribution? What would prevent a second submission? Which signature step is unclear?”
- **Reviewer:** “Which evidence must you inspect yourself? What conflict should you disclose? Can you defend this exact claim if challenged? Would visible review history help, or create pressure? What nonfinancial benefit makes repeat reviewing worthwhile?”
- **Admin:** “How do you recruit and replace reviewers? Who owns rubric versions? Can outsiders issue useful claims? What do you need to hide from a queue without changing public history? Who handles an allegation or removal request?”
- **Verifier:** “Would you use this record to make a real decision? What would you independently check? Does a count communicate more certainty than the evidence warrants? What context is missing when exported?”
- **Agent operator, if recruited:** “How do you prove ownership? What would ‘declared policy’ mean to you? Which actions do you incorrectly expect the product to block?”

### Willingness-to-pay questions

Ask the admin/budget owner, not only enthusiastic end users. Ask current spend and an unprompted budget first to reduce price anchoring.

1. What do you currently spend on review coordination, reporting, identity tooling, and staff time? What invoice or recent process supports that estimate?
2. Who can authorize a purchase, from which budget, and what security/procurement steps apply?
3. Which outcome would justify payment: less coordination time, private review, audit export, custom rubrics, or a reliable verification API? What would you remove first?
4. What monthly amount is plausible at your organization size? At what amount would you use the current process instead?
5. Only then test the PRD's **$29–$99 Community** and **$199–$499 Organization** monthly ranges. These are unvalidated hypotheses, not published offers. Ask which included benefit changes the answer and why.
6. What evidence and trial duration would you need before agreeing to a paid pilot? Would you name a decision owner and review date?

Do not charge for a positive attestation or reward a reviewer for a favorable result. Record willingness to consider, verbal intent, approved budget, and signed/paid commitment as different evidence levels. No market-size or revenue claim follows from this small sample.

### Evidence log template

All rows below are unfilled. Add de-identified observations only after interviews; quotes need consent and must not contain private evidence.

| Participant code / role | Interview date / consent | Observed workflow or quote | Supports / contradicts hypothesis | Artifact reference in private notes | Decision / owner / follow-up |
|---|---|---|---|---|---|
| Pending | Pending | No interview conducted | Unvalidated | Pending | Pending |

After interviews, record claim terminology changes, minimum evidence per claim, median observed review effort, privacy exclusions, incentive findings, and WTP evidence strength. Revise schemas/interfaces through a versioned decision; never rewrite results to fit the current design. Five usability participants provide directional feedback, not statistical proof.

## Optional partner and privacy research

This checklist is retained for a future real pilot, but it no longer controls Phase 0 acceptance. Phase 0 is complete from its engineering artifacts; later production and negative-claim reviews keep their own explicit gates.

- [ ] Organization and authorized contact identified; their role and consent recorded privately.
- [ ] A named workflow owner agrees to test one real public contribution.
- [ ] Contributor has permission to publish artifact, source references, and collaborator information.
- [ ] Two independent reviewers agree to review; available dates and decline/replacement path recorded.
- [ ] Accepted claim types and minimum evidence agreed; `QUALITY` rubric owner/version named if quality is used.
- [ ] Public-evidence classification reviewed; credentials, private prompts, sensitive or unconsented personal information removed.
- [ ] Contributor can explain permanent anchors and limits of deletion; privacy reviewer records approval or outstanding questions.
- [ ] Testnet scope, simulated versus real records, support channel, and success criteria acknowledged.
- [ ] Pilot dates, feedback session, and follow-up owner recorded.
- [ ] Budget conversation recorded as a hypothesis or commitment at its actual evidence level.
- [ ] Written commitment reference/date recorded; no commitment inferred from a prototype walkthrough.

Current result: **no partner evidence or privacy review recorded; non-blocking for Phase 0**. No real negative-claim pilot or EU personal-data anchoring proceeds without the separate later-phase review gates in [Security](SECURITY.md).

## Analytics specification

### Source and privacy contract

Canonical business metrics use server/indexer records after finality, never button clicks or browser-only events. Store timestamps in UTC and durations in seconds. Deduplicate chain events by `(chainId, transactionHash, logIndex)` and invitation decisions by internal invitation/decision ID. Preserve source block and algorithm version internally so a corrected projection can reproduce a report.

Tag each environment and record class (`synthetic`, `internal-test`, `consenting-pilot`, `production`). Synthetic/internal tests never enter adoption metrics. Report testnet and mainnet cohorts separately. Report both numerator and denominator; show “not available” for a zero denominator. A late-indexed event triggers an identified report revision, not a silent historical change.

Generic analytics receives only an allowlisted event name, app/schema version, environment, coarse role, funnel step, enumerated outcome/error category, duration bucket, and consented random internal actor/session IDs. IDs must not be hashes of wallets. Do **not** send wallet addresses, signatures, transaction hashes, raw record URLs/IDs, evidence contents/digests, metadata, free text, private workspace names, contact details, IPs, or page/query strings containing them. Keep wallet-to-internal-ID mapping and operational correlation logs in restricted first-party storage. Disable autocapture, session replay, and automatic page properties until the redaction/consent path has been verified. Withdrawal stops future analytics collection; retention/deletion rules require privacy approval before a real pilot.

Financial/billing and service-reliability records required to operate the service remain separate from optional product analytics. Product events never affect reputation. Retention and cross-workspace verification are computed first-party and exported only as cohort aggregates; a public anonymous view cannot establish a person's second-workspace use.

### Metric definitions

The pilot's required review set is one positive `COMPLETION` and one positive `AUTHORSHIP`, issued by two distinct external reviewers. Freeze this rule with the cohort; a later workspace rubric/policy change does not alter its historical completion rule. Lifecycle eligibility and self-claim classification use the versioned reputation specification. Disputed active claims remain active and count; report the disputed subset separately.

| Metric | Exact numerator / denominator or computation | Window / caveats |
|---|---|---|
| VCCR | Contributions whose required positive claims were issued and remain active at their seven-day cutoff / all submitted contributions in the matured cohort | Submission time `t0` is registration block time for a finalized record; cutoff is `t0 + 604800s`. Cohort includes only records whose cutoff has passed. Include archived/disputed records in denominator; exact duplicate retries are one record. Report disputed-completion subset. Later revocation changes current counts, not this frozen seven-day outcome. |
| Activation | New authenticated actors who finalize a first contribution within seven days of first successful authentication / new authenticated actors with a complete seven-day observation window | Count actors once; walletless visitors are not the denominator. PRD hypothesis: ≥40%. |
| Reviewer conversion | Distinct invited reviewers who record an authenticated attestation or explicit decline within seven days of first invitation / distinct reviewers first invited in the matured window | Re-invites to the same reviewer/contribution form one invitation episode. A recorded decline counts as a decision, not a positive claim. Show attestation and decline subtotals. PRD hypothesis: ≥50%. |
| Time to first attestation | Median `(first finalized external attestation block time − contribution t0)` for contributions with a first claim in the cohort | Report unanswered count and age separately to expose censoring; do not treat pending contributions as zero. PRD hypothesis: median <48h. |
| Accessible evidence | Public contribution pages whose declared primary evidence is retrievable and matches its digest at the check / all public contribution pages checked | Daily safe-fetch/integrity checks; failed/timeout/mismatched evidence is failure, private evidence excluded. Report sample coverage. PRD hypothesis: ≥90%. |
| External reuse | Distinct first-party verified reads from a workspace other than the contribution's originating workspace | Require explicit authenticated workspace/API-key context; anonymous/unattributable reads reported separately. Referrer alone is not reuse proof. Track baseline. |
| 60-day retention | Actors with a second distinct finalized contribution or verified read of their profile from a second identified workspace within 60 days of first finalized contribution / actors with a complete 60-day window | Count each actor once in combined numerator; also report repeat-submission and cross-workspace subtotals and overlap. Synthetic activity excluded; track baseline. |
| Write reliability | Submitted unique transactions finalized successfully within 30 minutes / submitted unique transactions with a full 30-minute window | User rejection before submission excluded; reverted, replaced-without-success, dropped, and unreconciled outcomes count as failures at cutoff. Reconcile transaction replacements as one operation. Show late success separately; PRD hypothesis ≥98%. |
| Indexing latency | p50/p95 and fraction <10s of `(projection visible time − observed finalized time)` | Count each indexed event once; separately report finalized events still unindexed and their maximum age. Chain receipt time and indexer time require synchronized clocks. |
| Web/API availability | Successful eligible synthetic probe intervals / total scheduled eligible intervals | Monthly pilot target ≥99.5%; one-minute web/API probes. Classify chain/RPC incidents separately and disclose excluded minutes; never omit app-caused failures. |
| Core usability completion | Participants completing all five PRD tasks without facilitator rescue / participants attempting the session | Record task-level success, mistakes, time, confidence, and assistance too. Target ≥4 of 5, directional only. |
| Performance | LCP p75 for eligible page views; p95 latency for cached profile API responses | Separate viewport/route and cache hit status; targets <2.5s and <500ms. Never label a local synthetic benchmark production performance. |
| Support response | Time from received request to first human acknowledgement within published business hours | Report count within two business days and unresolved backlog; clock/calendar set before pilot. |

### Events and trustworthy triggers

Use the PRD's names for continuity. “Submitted” events describe submission, not successful confirmation.

| Events | Trigger / source |
|---|---|
| `wallet_connected`, `auth_verified`, `profile_created` | Wallet adapter connection; successful server verification; finalized profile creation respectively |
| `contribution_draft_started`, `artifact_hashed`, `transaction_submitted`, `contribution_confirmed` | First saved draft; completed byte hashing; accepted broadcast with known operation; finalized contribution event |
| `review_invited`, `review_opened`, `review_decision_recorded` | Server-created invitation; first eligible open; authenticated recorded attestation/decline. Last event extends PRD taxonomy for decision conversion. |
| `attestation_submitted`, `attestation_revoked` | Broadcast operation; finalized issuer-revocation event respectively. Count finalized claim records for business metrics. |
| `score_explanation_opened`, `profile_shared`, `verification_api_called` | Consented interaction; explicit share action; first-party API receipt. Calls alone do not establish external reuse. |
| `agent_registered`, `policy_published` | Finalized registry events; never emit for a simulated prototype or an unconfirmed request |
| `second_contribution_submitted`, `profile_verified_from_new_workspace` | First-party derived finalized second contribution / first validated second-workspace verification; deduplicate per retention cohort |
| `projection_visible`, `write_reconciled` | First-party operational timestamps for finalized-event materialization and resolved write status; not generic product analytics |

### Initial experiments

Run one small experiment at a time after interviews, so a tiny pilot remains interpretable. Assign variants before exposure; keep assignment stable for each invitation/user. Preserve privacy and full workflow in both variants.

| Experiment | Variants | Primary measure / guardrail |
|---|---|---|
| Review invitation | Evidence checklist vs open request | Seven-day reviewer decision conversion / time spent and reviewer confusion |
| Wallet timing | Connect at entry vs before publish | Seven-day activation / lost drafts and rejection rate |
| Explanation | Category bars plus evidence counts vs compact category table | Correct explanation of count, evidence, and revocation / no universal score variant |
| Badge utility | Public verification link available on a consenting application | Identified external verification / anonymous views kept separate |
| Repeat contribution | Prompt after first attestation vs delayed prompt | Matured 60-day retention / opt-outs and unwanted reminders |

No experiment is running. Numeric PRD targets remain hypotheses until real, consented cohorts have matured.
