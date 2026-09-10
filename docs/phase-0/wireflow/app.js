"use strict";

// This prototype owns one synthetic contribution. No wallet, RPC, API, or analytics calls.
const STORAGE_KEY = "attestia.phase0.wireflow.v1";
const people = {
  mira: { name: "Mira Chen", initials: "MC", role: "Contributor" },
  jules: { name: "Jules Park", initials: "JP", role: "Reviewer" },
  noor: { name: "Noor Ali", initials: "NA", role: "Reviewer" },
};
const categories = {
  COMPLETION: "Delivery",
  AUTHORSHIP: "Authorship",
  QUALITY: "Quality",
  USAGE: "Usage",
  PROVENANCE: "Provenance",
};
const claimDescriptions = {
  COMPLETION: "The stated deliverable exists.",
  AUTHORSHIP: "The creator materially contributed to this work.",
  QUALITY: "The work satisfies the published workspace rubric.",
  USAGE: "The work was merged, deployed, used, or accepted.",
  PROVENANCE: "The disclosure is consistent with available evidence.",
};
const icons = {
  grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  layers: '<path d="m12 3 9 5-9 5-9-5 9-5Zm-9 9 9 5 9-5M3 16l9 5 9-5"/>',
  graph:
    '<circle cx="6" cy="6" r="3"/><circle cx="18" cy="9" r="3"/><circle cx="9" cy="19" r="3"/><path d="m9 7 6 1M7 9l1 7m4 1 4-5"/>',
  shield:
    '<path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Z"/><path d="m8 12 3 3 5-6"/>',
  arrow: '<path d="M5 12h14m-5-5 5 5-5 5"/>',
  back: '<path d="M19 12H5m5 5-5-5 5-5"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  branch:
    '<circle cx="7" cy="5" r="2"/><circle cx="7" cy="19" r="2"/><circle cx="17" cy="5" r="2"/><path d="M7 7v10m10-10v3c0 3-10 2-10 6"/>',
  link: '<path d="m10 13 4-4m-6 7-1 1a4 4 0 0 1-6-6l5-5a4 4 0 0 1 6 0m0 2 1-1a4 4 0 0 1 6 6l-5 5a4 4 0 0 1-6 0" transform="translate(2 1) scale(.9)"/>',
  file: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9l-6-6Z"/><path d="M14 3v6h6M8 13h8M8 17h5"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v.1"/>',
  person: '<circle cx="12" cy="7" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/>',
  download: '<path d="M12 3v12m-5-5 5 5 5-5M4 15v5h16v-5"/>',
  spark:
    '<path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3Z"/>',
  eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
  alert: '<path d="m12 3 10 18H2L12 3Z"/><path d="M12 9v5m0 3v.1"/>',
};
const icon = (name, className = "") =>
  `<svg class="${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name] || icons.file}</svg>`;
const escapeHTML = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ],
  );
const draftDefaults = () => ({
  title: "Make contribution history easier to follow",
  type: "pull request",
  summary:
    "A clearer revision timeline for an open-source documentation site. This illustrative pull request adds accessible revision links and preserves the original authorship trail.",
  source: "https://github.com/example/attestia-demo/pull/42",
  humanWork:
    "I designed the revision timeline, wrote the implementation, and tested keyboard navigation.",
  aiLevel: "assistive",
  tools: "AI coding assistant · code suggestions and test ideas",
  collaborator: "Jules Park · review (claimed; not accepted)",
  visibility: "public",
});
function freshState() {
  return {
    version: 1,
    actor: "mira",
    scenario: "normal",
    draft: draftDefaults(),
    contribution: null,
    claims: [],
    history: [],
    verified: false,
    evidenceVisible: false,
    nextId: 1,
  };
}
let state;
let storageAvailable = true;
try {
  const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
  state =
    saved?.version === 1 && saved.draft && Array.isArray(saved.claims)
      ? saved
      : freshState();
} catch {
  state = freshState();
  storageAvailable = false;
}
let errors = {};
let notice = null;
let writeTimer = null;
let claimDraft = state.claimDraft || null;
let revokeReason = "";
const main = document.getElementById("main");

function save() {
  state.claimDraft = claimDraft;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    storageAvailable = false;
    announce(
      "Browser storage is unavailable. This session remains usable; reload will lose changes.",
    );
  }
}
function announce(message) {
  document.getElementById("announcement").textContent = message;
}
function route() {
  return location.hash.slice(1).split("/")[0] || "dashboard";
}
function go(path) {
  if (location.hash === `#${path}`) render();
  else location.hash = path;
}
function claimStatus(claim) {
  return claim.status === "active" &&
    claim.validUntil &&
    Date.parse(claim.validUntil) <= Date.now()
    ? "expired"
    : claim.status;
}
function activeClaims() {
  return state.claims.filter(
    (claim) =>
      claim.status === "active" &&
      (!claim.validUntil || Date.parse(claim.validUntil) > Date.now()),
  );
}
function externalClaims() {
  return activeClaims().filter((claim) => claim.actor !== "mira");
}
function countClaims(type, result) {
  return externalClaims().filter(
    (claim) =>
      (!type || claim.type === type) && (!result || claim.result === result),
  ).length;
}
function badge(text, kind = "") {
  return /* HTML */ `<span class="badge ${kind}"
    >${kind === "positive" ? '<span class="status-dot" aria-hidden="true"></span>' : ""}${escapeHTML(text)}</span
  >`;
}
function button(label, action, kind = "", iconName = "arrow") {
  return /* HTML */ `<button
    type="button"
    class="button ${kind}"
    data-action="${action}"
  >
    ${escapeHTML(label)}${icon(iconName)}
  </button>`;
}
function linkButton(label, path, kind = "", iconName = "arrow") {
  return /* HTML */ `<a class="button ${kind}" href="#${path}"
    >${escapeHTML(label)}${icon(iconName)}</a
  >`;
}
function safeURL(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password;
  } catch {
    return false;
  }
}
function field(name, label, value, hint, options = {}) {
  const error = errors[name];
  const description = `${name}-hint${error ? ` ${name}-error` : ""}`;
  const attrs = `id="${name}" name="${name}" aria-describedby="${description}" ${error ? 'aria-invalid="true"' : ""}`;
  let control;
  if (options.values)
    control = `<select ${attrs}>${options.values
      .map((item) => {
        const [key, text] = typeof item === "string" ? [item, item] : item;
        return /* HTML */ `<option
          value="${escapeHTML(key)}"
          ${key === value ? "selected" : ""}
        >
          ${escapeHTML(text)}
        </option>`;
      })
      .join("")}</select>`;
  else if (options.textarea)
    control = `<textarea ${attrs} rows="${options.rows || 3}" maxlength="${options.max || 1500}">${escapeHTML(value)}</textarea>`;
  else
    control = `<input ${attrs} type="${options.type || "text"}" value="${escapeHTML(value)}" maxlength="${options.max || 300}" ${options.readonly ? "readonly" : ""}>`;
  return /* HTML */ `<div class="field scroll-target">
    <label for="${name}">${escapeHTML(label)}</label>${control}
    <p class="field-hint" id="${name}-hint">${hint}</p>
    ${error ? `<p class="field-error" id="${name}-error">${escapeHTML(error)}</p>` : ""}
  </div>`;
}
function errorSummary() {
  return Object.keys(errors).length
    ? `<div class="alert" id="error-summary" role="alert" tabindex="-1"><h2>Check these details</h2><ul>${Object.entries(
        errors,
      )
        .map(
          ([key, message]) =>
            `<li><a href="#${key}" data-focus="${key}">${escapeHTML(message)}</a></li>`,
        )
        .join("")}</ul></div>`
    : "";
}
function noticeHTML() {
  return notice
    ? `<div class="alert" id="state-notice" role="alert" tabindex="-1"><h2>${escapeHTML(notice.title)}</h2><p>${escapeHTML(notice.message)}</p>${notice.action ? button(notice.label, notice.action, "small secondary") : ""}</div>`
    : "";
}
function header(eyebrow, title, description = "", action = "") {
  return /* HTML */ `<div class="page-heading">
    <div>
      <p class="eyebrow">${eyebrow}</p>
      <h1>${title}</h1>
      ${description ? `<p>${description}</p>` : ""}
    </div>
    ${action}
  </div>`;
}
function stepper(current) {
  return /* HTML */ `<div class="form-stepper" aria-label="Publication steps">
    ${["Contribution & provenance", "Publication review", "Simulated publication"].map((step, index) => `${index ? icon("arrow") : ""}<span class="${index === current ? "current" : ""}" ${index === current ? 'aria-current="step"' : ""}>${index + 1}. ${step}</span>`).join("")}
  </div>`;
}
function graph(large = false) {
  const published = Boolean(state.contribution);
  const claims = externalClaims().length;
  return /* HTML */ `<figure
    class="orbit-figure ${large ? "" : "dashboard-orbit"}"
  >
    <svg
      viewBox="0 0 430 285"
      role="img"
      aria-label="Illustrative provenance graph: Mira claims authorship of a pull request, with a disclosed AI assistant. ${claims} active external claims are shown as a solid cyan connection."
    >
      <ellipse
        class="orbit-path"
        cx="218"
        cy="140"
        rx="172"
        ry="93"
        transform="rotate(-21 218 140)"
      />
      <ellipse
        class="orbit-path"
        cx="218"
        cy="140"
        rx="126"
        ry="115"
        transform="rotate(32 218 140)"
      />
      <circle class="orbit-path" cx="218" cy="140" r="65" />
      <path
        class="claimed-edge"
        d="m115 90 100 49m7 2 102 68m-106-65 127-67M216 140l-81 79"
      />
      <path
        class="${claims ? "attested-edge" : "claimed-edge"}"
        d="m215 137 91-100"
      />
      <circle cx="54" cy="165" r="3" fill="#b1a6f6" />
      <circle cx="264" cy="249" r="2" fill="#b1a6f6" />
      <circle cx="390" cy="98" r="2" fill="#b1a6f6" />
      <path class="decorative" d="M52 51v10m-5-5h10m301 176v8m-4-4h8" />
      <g transform="translate(164 97)">
        <rect class="node-bg" width="110" height="85" rx="22" />
        <path
          d="m39 25 13-7 13 7v15l-13 7-13-7V25Z"
          stroke="#00b1ff"
          fill="none"
        />
        <path d="m46 32 5 5 9-11" stroke="#00b1ff" fill="none" />
        <text x="55" y="65" text-anchor="middle">PR #42</text>
        <text x="55" y="78" text-anchor="middle" class="tiny-text">
          ${published ? "SIMULATED RECORD" : "DRAFT EVIDENCE"}
        </text>
      </g>
      <g transform="translate(69 44)">
        <rect class="node-bg" width="86" height="72" rx="18" />
        <circle cx="43" cy="25" r="10" stroke="#b1a6f6" fill="none" />
        <path d="M32 37c1-12 21-12 22 0" stroke="#b1a6f6" fill="none" />
        <text x="43" y="53" text-anchor="middle">Mira Chen</text>
        <text x="43" y="65" text-anchor="middle" class="tiny-text">
          CREATOR
        </text>
      </g>
      <g transform="translate(287 185)">
        <rect class="node-bg" width="103" height="64" rx="17" />
        <path
          d="m51 12 3 7 7 3-7 3-3 7-3-7-7-3 7-3 3-7Z"
          stroke="#b1a6f6"
          fill="none"
        />
        <text x="51" y="46" text-anchor="middle">AI assistance</text>
        <text x="51" y="58" text-anchor="middle" class="tiny-text">
          DECLARED
        </text>
      </g>
      <g transform="translate(276 12)">
        <rect class="node-bg" width="98" height="52" rx="16" />
        <text x="49" y="22" text-anchor="middle">
          ${claims ? `${claims} external claims` : "Peer review"}
        </text>
        <text x="49" y="38" text-anchor="middle" class="tiny-text">
          ${claims ? "SIMULATED · ACTIVE" : "NEXT CONNECTION"}
        </text>
      </g>
      <circle class="node-bg" cx="124" cy="219" r="19" />
      <path d="m117 219 5 5 8-10" stroke="#b1a6f6" fill="none" />
      <text x="123" y="254" text-anchor="middle" class="tiny-text">
        SOURCE TRAIL
      </text>
      <circle cx="345" cy="74" r="6" fill="#232269" stroke="#b1a6f6" />
    </svg>
    <figcaption>Every connection has a context.</figcaption>
  </figure>`;
}
function signalPanel() {
  return /* HTML */ `<section
    class="panel signals-panel"
    aria-labelledby="signals-title"
  >
    <div class="panel-header">
      <h2 id="signals-title">Your evidence signals</h2>
      ${badge("v1 · counts")}
    </div>
    <div class="signal-summary">
      <span class="signal-number"
        >${externalClaims().length.toString().padStart(2, "0")}</span
      >
      <p>
        active external claims<br />${countClaims(null, "positive")} positive ·
        ${countClaims(null, "negative")} negative
      </p>
    </div>
    <div class="signal-list">
      ${Object.entries(categories)
        .map(
          ([type, label]) =>
            `<div class="signal-line"><span>${label}</span><span class="track" aria-hidden="true"><span style="width:${Math.min(100, countClaims(type) * 35)}%"></span></span><span class="data">${countClaims(type, "positive")} + / ${countClaims(type, "negative")} −</span></div>`,
        )
        .join("")}
    </div>
    <p class="signal-footer">
      ${icon("info")}Each signal opens a trail. No universal trust score.
    </p>
  </section>`;
}
function dashboard() {
  const item = state.contribution || state.draft;
  return /* HTML */ `<section class="hero">
      <div class="hero-copy">
        <p class="eyebrow">A LITTLE CONTEXT GOES A LONG WAY</p>
        <h1>Good work.<br />Real <span class="word-box">receipts.</span></h1>
        <p>
          Bring your contributions, their provenance, and the people who can
          speak for them together.
        </p>
        <div class="hero-actions">
          ${linkButton(state.contribution ? "View your contribution" : "Add a contribution", state.contribution ? "contribution" : "compose", "", "plus")}<a
            class="text-button"
            href="#profile"
            >Follow your evidence ${icon("arrow")}</a
          >
        </div>
      </div>
      ${graph()}
    </section>
    <div class="dashboard-grid">
      <section class="panel">
        <div class="panel-header">
          <h2>Your work, in progress</h2>
          <span class="eyebrow" style="margin:0">01 CONTRIBUTION</span>
        </div>
        <article class="work-item">
          <div class="work-top">
            ${icon("branch", "artifact-glyph")}<span
              >Open Source Lab / PR #42</span
            >${badge(state.contribution ? `${state.contribution.status} · simulated` : "Saved draft", state.contribution?.status === "Indexed" ? "positive" : "")}
          </div>
          <h3>
            <a href="#${state.contribution ? "contribution" : "compose"}"
              >${escapeHTML(item.title)}</a
            >
          </h3>
          <p>${escapeHTML(item.summary)}</p>
          <div class="evidence-row">
            <span>${icon("link")}1 source artifact</span
            ><span>${icon("spark")}AI assistance disclosed</span
            ><span
              >${icon("clock")}${state.contribution ? "Local simulation" : "Ready when you are"}</span
            >
          </div>
          <div class="work-bottom">
            <div class="tiny-people">
              <span class="avatar">MC</span
              ><span>Mira Chen · synthetic profile</span>
            </div>
            ${linkButton(state.contribution ? "View evidence" : "Continue draft", state.contribution ? "contribution" : "compose", "small secondary")}
          </div>
        </article>
      </section>
      ${signalPanel()}
    </div>
    <section class="journey-section">
      <div class="section-label">
        <h2>A record worth carrying.</h2>
        <span>YOUR FIRST CONTRIBUTION</span>
      </div>
      <div class="journey-grid">
        <div class="journey-step">
          <span class="step-num">01</span>
          <div>
            <h3>Start with the work</h3>
            <p>
              Link an artifact. Describe your contribution and how it was made.
            </p>
          </div>
        </div>
        <div class="journey-step">
          <span class="step-num">02</span>
          <div>
            <h3>Add an independent voice</h3>
            <p>
              Give reviewers evidence to make a specific, accountable claim.
            </p>
          </div>
        </div>
        <div class="journey-step">
          <span class="step-num">03</span>
          <div>
            <h3>Take the context with you</h3>
            <p>Inspect the history. Verify the record. Export your evidence.</p>
          </div>
        </div>
      </div>
    </section>`;
}
function composer() {
  return /* HTML */ `${header("CONTRIBUTIONS / NEW RECORD", "What did you contribute?", "Start with something people can inspect. Your draft stays in this browser.")}${stepper(0)}
    <div class="two-column">
      <form class="panel form-panel" id="contribution-form" novalidate>
        ${errorSummary()}${noticeHTML()}
        <section class="form-section">
          <h2>The work itself</h2>
          <p>
            Example details are prefilled. All records in this prototype are
            synthetic.
          </p>
          ${field("title", "Contribution title", state.draft.title, "A clear name for the deliverable.", { max: 160 })}
          <div class="field-pair">
            ${field("type", "Contribution type", state.draft.type, "All seven MVP types are represented.", { values: ["research", "pull request", "design", "smart contract", "bounty", "community task", "other"] })}
            ${field("visibility", "Evidence visibility", "public", "Private evidence is planned for Phase 4.", { values: [["public", "Public evidence"]] })}
          </div>
          ${field("summary", "What changed?", state.draft.summary, "Describe the outcome, not a reputation claim.", { textarea: true })}
          ${field("source", "Public evidence URL", state.draft.source, "HTTPS only. The prefilled example GitHub URL is fictional; it will not be fetched.", { type: "url", max: 2048 })}
        </section>
        <section class="form-section">
          <h2>How it came together</h2>
          <p>
            Provenance is your signed declaration. It is not automatic AI
            detection.
          </p>
          ${field("humanWork", "Your contribution", state.draft.humanWork, "Explain the work you personally performed.", { textarea: true })}
          ${field(
  "aiLevel",
  "AI assistance",
  state.draft.aiLevel,
  "An honest disclosure gives reviewers useful context.",
  {
    values: [
      ["none", "None"],
      ["assistive", "Assistive"],
      ["substantial", "Substantial"],
      ["agent-led", "Agent-led"],
      ["unknown", "Undisclosed / unknown"],
    ],
  },
)}
          ${field("tools", "Tools or models (optional)", state.draft.tools, "Names only. Never include sensitive prompts, credentials, or private data.")}
          ${field("collaborator", "Collaborators and roles (optional)", state.draft.collaborator, "Attribution remains claimed until accepted. It gives no automatic reputation credit.")}
        </section>
        <div class="form-actions">
          <span class="saved-hint" id="draft-save-status"
            >${storageAvailable ? "Draft saved on this browser" : "Storage unavailable · this session only"}</span
          ><button type="submit" class="button">
            Review publication ${icon("arrow")}
          </button>
        </div>
      </form>
      <aside class="side-guide">
        <p class="eyebrow">A USEFUL EVIDENCE TRAIL</p>
        <ol class="guide-list">
          <li>
            <span class="step-num">1</span>
            <div>
              <p>Keep the source close</p>
              <small
                >Choose a stable, public artifact that lets someone inspect the
                work.</small
              >
            </div>
          </li>
          <li>
            <span class="step-num">2</span>
            <div>
              <p>Describe your part</p>
              <small
                >Separate personal work, AI assistance, and collaborator
                roles.</small
              >
            </div>
          </li>
          <li>
            <span class="step-num">3</span>
            <div>
              <p>Check before publishing</p>
              <small
                >Real onchain references are permanent. Review the public
                payload first.</small
              >
            </div>
          </li>
        </ol>
        <div class="guide-note">
          ${icon("shield")}Only public, non-sensitive metadata belongs in the
          first release. This prototype sends nothing to a network.
        </div>
      </aside>
    </div>`;
}
function review() {
  return /* HTML */ `${header("CONTRIBUTIONS / PUBLICATION REVIEW", "Check what becomes public.", "Inspect this disclosure before simulating publication. Nothing leaves this browser.")}${stepper(1)}
    <div class="two-column">
      <form id="publication-form" class="panel form-panel" novalidate>
        ${errorSummary()}${noticeHTML()}
        <h2>${escapeHTML(state.draft.title)}</h2>
        <dl class="review-grid">
          <dt>Creator</dt>
          <dd>Mira Chen · synthetic profile</dd>
          <dt>Contribution type</dt>
          <dd>${escapeHTML(state.draft.type)}</dd>
          <dt>Public source</dt>
          <dd class="data-value">${escapeHTML(state.draft.source)}</dd>
          <dt>Summary</dt>
          <dd>${escapeHTML(state.draft.summary)}</dd>
          <dt>Your contribution</dt>
          <dd>${escapeHTML(state.draft.humanWork)}</dd>
          <dt>AI declaration</dt>
          <dd>
            ${escapeHTML(state.draft.aiLevel)}${state.draft.tools ? ` · ${escapeHTML(state.draft.tools)}` : ""}
          </dd>
          <dt>Collaborators</dt>
          <dd>
            ${escapeHTML(state.draft.collaborator || "None declared")}
            <p class="field-hint">
              Claimed attribution only; no automatic reputation credit.
            </p>
          </dd>
        </dl>
        <div class="review-section">
          <h3>Publication changes the audience</h3>
          <p>
            In the live product, metadata and digest references become public
            and cannot be erased from chain history. Private files, credentials,
            and sensitive prompts must stay out.
          </p>
        </div>
        <label class="check-label" for="publication-check"
          ><input
            id="publication-check"
            name="publication-check"
            type="checkbox"
            ${errors["publication-check"] ? 'aria-invalid="true" aria-describedby="publication-check-error"' : ""}
          /><span
            >I reviewed the public fields and excluded private files,
            credentials, and sensitive prompts.</span
          ></label
        >${errors["publication-check"] ? `<p id="publication-check-error" class="field-error">${errors["publication-check"]}</p>` : ""}
        <div class="form-actions">
          <a class="text-button" href="#compose">${icon("back")}Edit draft</a
          ><button type="submit" class="button">
            Simulate publication ${icon("arrow")}
          </button>
        </div>
        <p class="notice">
          ${icon("info")}No signature, gas payment, transaction hash, or chain
          record will be created.
        </p>
      </form>
      <aside class="side-guide">
        <p class="eyebrow">PUBLICATION RECEIPT</p>
        <ol class="guide-list">
          <li>
            <span class="step-num">1</span>
            <div>
              <p>Canonical metadata</p>
              <small
                >Production: RFC 8785 canonical JSON, UTF-8 bytes, keccak256
                digest.</small
              >
            </div>
          </li>
          <li>
            <span class="step-num">2</span>
            <div>
              <p>Artifact fingerprint</p>
              <small
                >Production: SHA-256 of artifact bytes. A source URL alone is
                not a verified fingerprint.</small
              >
            </div>
          </li>
          <li>
            <span class="step-num">3</span>
            <div>
              <p>Independent indexing</p>
              <small
                >Finality and index freshness appear separately so pending data
                stays visible.</small
              >
            </div>
          </li>
        </ol>
      </aside>
    </div>`;
}
function blankContribution() {
  return /* HTML */ `${header("CONTRIBUTIONS", "Build your first evidence trail.")}
    <section class="panel blank-state">
      <h2>A contribution comes first.</h2>
      <p>
        The merged-PR example is ready as a saved draft. Review its provenance
        and simulate publication to explore claims, revocation, and export.
      </p>
      ${linkButton("Continue example draft", "compose")}
    </section>`;
}
function lifecycle() {
  const steps = [
    "Draft",
    "Awaiting signature",
    "Submitted",
    "Proposed",
    "Finalized",
    "Indexed",
  ];
  const current = steps.indexOf(state.contribution.status);
  return /* HTML */ `<ol
    class="chain-strip"
    aria-label="Simulated transaction progress"
  >
    ${steps.map((step, index) => `<li class="${index < current ? "done" : index === current ? "current" : ""}" ${index === current ? 'aria-current="step"' : ""}>${step}</li>`).join("")}
  </ol>`;
}
function claimRows() {
  if (!state.claims.length)
    return /* HTML */ `<div class="empty-claims">
      <h3>Make room for an independent voice.</h3>
      <p>
        No claims yet. Start with a completion claim, then add authorship from a
        second synthetic reviewer.
      </p>
      <a href="#attest" class="text-button"
        >Add the first claim ${icon("arrow")}</a
      >
    </div>`;
  return state.claims
    .map(
      (claim) =>
        /* HTML */ `<article class="claim-row">
          <span class="avatar outline" aria-hidden="true"
            >${people[claim.actor].initials}</span
          >
          <div>
            <div class="claim-heading">
              <h3>
                ${escapeHTML(claim.type)} ·
                ${escapeHTML(people[claim.actor].name)}
              </h3>
              ${badge(claimStatus(claim) === "active" ? `${claim.result} · active` : claimStatus(claim), claimStatus(claim) === "active" && claim.result === "positive" ? "positive" : "")}
            </div>
            <p>${escapeHTML(claim.reason)}</p>
            <div class="claim-meta">
              <span>${escapeHTML(claim.id)} · synthetic</span
              ><span
                >${claim.actor === "mira" ? "Self-claim · zero external weight" : "External reviewer"}</span
              >${claim.disputed ? '<span class="badge">Disputed subset</span>' : ""}${claimStatus(claim) === "active" ? `<a class="text-button" href="#revoke/${claim.id}">Revoke claim</a><button class="text-button" data-action="dispute" data-id="${claim.id}" type="button">${claim.disputed ? "Resolve dispute" : "Simulate dispute"}</button>` : ""}
            </div>
            ${claim.conflicts ? `<p>Conflict disclosure: ${escapeHTML(claim.conflicts)}</p>` : ""}${claim.validUntil ? `<p>Valid until: ${escapeHTML(new Date(claim.validUntil).toLocaleString())}</p>` : ""}${claim.rubric ? `<p>Rubric: ${escapeHTML(claim.rubric)} · immutable snapshot</p>` : ""}${claim.pendingRevocation ? "<p>Revocation awaiting indexer recovery; active count shows the last projection.</p>" : ""}${claim.revokeReason ? `<p>Revocation reason: ${escapeHTML(claim.revokeReason)}</p>` : ""}${claim.supersedes ? `<p>Supersedes ${escapeHTML(claim.supersedes)}; original record remains visible.</p>` : ""}
          </div>
        </article>`,
    )
    .join("");
}
function contribution() {
  if (!state.contribution) return blankContribution();
  const item = state.contribution;
  const ready = item.status === "Indexed";
  return /* HTML */ `<a href="#dashboard" class="back-link"
      >${icon("back")}Your workspace</a
    >
    <div class="page-heading">
      <div>
        <div class="detail-topline">
          ${badge(item.type, "blue")}${badge("Synthetic record")}
          <p>${escapeHTML(item.id)} · Open Source Lab</p>
        </div>
        <h1 class="detail-title">${escapeHTML(item.title)}</h1>
        <p>
          Created by Mira Chen · illustrative identity · all activity is
          simulated
        </p>
      </div>
    </div>
    ${noticeHTML()}${lifecycle()}${item.status === "Finalized" ? `<div class="alert" role="status"><h2>Finalized in simulation. Waiting for the indexer.</h2><p>The contribution is saved. Fresh claims remain unavailable until the projection catches up.</p>${button("Simulate indexer recovery", "recover-indexer", "small secondary")}</div>` : ""}
    <div class="detail-layout">
      <div>
        <section class="panel evidence-document">
          <div class="panel-header">
            <h2>Start with the evidence</h2>
            ${badge("Not verified")}
          </div>
          <p>${escapeHTML(item.summary)}</p>
          <div class="source-block">
            ${icon("branch")}
            <div>
              <strong>PR #42 · synthetic merged pull request</strong>
              <p>${escapeHTML(item.source)}</p>
            </div>
            <button type="button" class="text-button" data-action="evidence">
              ${state.evidenceVisible ? "Hide example" : "Inspect example"}${icon("eye")}
            </button>
          </div>
          ${state.evidenceVisible ? '<div class="rubric-note"><strong>Synthetic artifact preview</strong><p>Example repository · PR #42 · merged state simulated. Changed: revision navigation, authorship links, keyboard focus styles. No URL was fetched, no GitHub merge checked, and no artifact bytes verified.</p></div>' : ""}
          <div class="review-section">
            <h3>Provenance declaration</h3>
            <p>${escapeHTML(item.humanWork)}</p>
            <div class="provenance-line">
              ${icon("spark")}
              <div>
                AI assistance: ${escapeHTML(item.aiLevel)}
                <p>
                  ${escapeHTML(item.tools || "No tools voluntarily disclosed")}
                </p>
              </div>
              ${badge("Declared")}
            </div>
            <div class="provenance-line">
              ${icon("person")}
              <div>
                ${escapeHTML(item.collaborator || "No collaborators declared")}
                <p>Claimed relationship · acceptance has not been recorded</p>
              </div>
            </div>
            <p class="notice">
              ${icon("info")}Provenance is a declaration, not automatic
              detection or independent verification.
            </p>
          </div>
        </section>
        <section class="claims-section">
          <div class="section-label">
            <h2>
              Claims, with context
              <span class="table-data"
                >${state.claims.length.toString().padStart(2, "0")}</span
              >
            </h2>
            ${ready ? linkButton("Add a claim", "attest", "small secondary", "plus") : "<span>Waiting for indexing</span>"}
          </div>
          ${claimRows()}
        </section>
      </div>
      <aside class="detail-stack">
        <section class="panel">
          <div class="panel-header"><h2>Integrity & freshness</h2></div>
          <ul class="integrity-items">
            <li>
              ${icon("shield")}
              <div>
                Unverified prototype record<small
                  >Metadata digest: not computed<br />Artifact digest: not
                  computed</small
                >
              </div>
            </li>
            <li>
              ${icon("layers")}
              <div>
                ${escapeHTML(item.status)} · simulated<small
                  >Chain ID: none<br />Contract address: none<br />Block /
                  transaction hash: none</small
                >
              </div>
            </li>
            <li>
              ${icon("clock")}
              <div>
                Local projection only<small
                  >${ready ? "Caught up in simulation" : "Indexing is incomplete"}.
                  No chain finality is asserted.</small
                >
              </div>
            </li>
          </ul>
          <a href="#verify" class="text-button" style="margin-top:18px"
            >Inspect verification ${icon("arrow")}</a
          >
        </section>
        <section class="panel">
          <div class="panel-header"><h2>Record history</h2></div>
          <ul class="history-list">
            ${state.history
              .slice()
              .reverse()
              .slice(0, 6)
              .map(
                (event) =>
                  `<li><div>${escapeHTML(event.label)}<small>Local simulation · ${escapeHTML(event.time)}</small></div></li>`,
              )
              .join("")}
          </ul>
        </section>
      </aside>
    </div>`;
}
function initClaimDraft() {
  if (!claimDraft)
    claimDraft = {
      type: state.claims.some((claim) => claim.type === "COMPLETION")
        ? "AUTHORSHIP"
        : "COMPLETION",
      actor: state.claims.some((claim) => claim.actor === "jules")
        ? "noor"
        : "jules",
      result: "positive",
      reason:
        "I reviewed the illustrative merged diff and the stated contribution. The synthetic evidence supports this claim.",
      evidence: state.contribution?.source || state.draft.source,
      merge: "PR #42 · merged in synthetic example",
      conflicts: "No conflicts declared in this synthetic example.",
      validUntil: "",
      supersede: false,
    };
}
function attest() {
  if (!state.contribution) return blankContribution();
  if (state.contribution.status !== "Indexed") return contribution();
  initClaimDraft();
  const old = activeClaims().find(
    (claim) =>
      claim.actor === claimDraft.actor && claim.type === claimDraft.type,
  );
  return /* HTML */ `${header("REVIEW / STRUCTURED CLAIM", "Say exactly what you can attest.", "Each claim belongs to its issuer. Evidence stays attached; outcomes stay separate.")}${stepperForClaim()}
    <div class="two-column">
      <form class="panel form-panel" id="attestation-form" novalidate>
        ${errorSummary()}${noticeHTML()}
        <div class="work-top">
          ${icon("branch", "artifact-glyph")}<span
            >${escapeHTML(state.contribution.id)} · synthetic contribution</span
          >
        </div>
        <h2>${escapeHTML(state.contribution.title)}</h2>
        <div class="field-pair">
          ${field("claim-actor", "Act as synthetic issuer", claimDraft.actor, "No wallet or identity verification occurs.", { values: Object.entries(people).map(([id, person]) => [id, `${person.name} · ${person.role}`]) })}
          ${field("claim-type", "Claim type", claimDraft.type, claimDescriptions[claimDraft.type], { values: Object.keys(categories) })}
        </div>
        ${field(
          "claim-result",
          "Outcome",
          claimDraft.result,
          "Negative claims are testnet-only until the production legal gate clears.",
          {
            values: [
              ["positive", "Positive / pass"],
              ["negative", "Negative / fail · testnet simulation only"],
            ],
          },
        )}
        ${claimDraft.actor === "mira" ? '<div class="rubric-note">Self-claim: visible in history, with zero external reputation weight.</div>' : ""}
        ${claimDraft.type === "QUALITY" ? '<div class="rubric-note"><strong>Published example rubric · Open Source Lab / v1</strong><p>Criteria: accessible keyboard flow; inspectable source changes; accurate authorship disclosure. This synthetic version is fixed on issuance and cannot rewrite earlier claims.</p></div>' : ""}
        ${claimDraft.type === "USAGE" ? field("claim-merge", "Merged PR evidence", claimDraft.merge, "Identify the merged pull request. In production, evidence must support the merge event.") : ""}
        ${field("claim-reason", "Reason and evidence context", claimDraft.reason, "Required for every claim. Explain what you inspected and what it supports.", { textarea: true })}
        ${field("claim-evidence", "Evidence URL", claimDraft.evidence, "Public HTTPS evidence. This example will not fetch or verify its contents.", { type: "url", max: 2048 })}
        ${field("claim-conflicts", "Conflicts of interest (optional)", claimDraft.conflicts, "Disclose relevant collaboration, payment, or personal relationships.", { textarea: true, rows: 2 })}
        ${field("claim-expiry", "Valid until (optional)", claimDraft.validUntil, "Local date and time. Leave blank for no expiry. Expired claims stay in history and leave active counts.", { type: "datetime-local" })}
        ${old ? `<div class="rubric-note"><strong>An active ${escapeHTML(claimDraft.type)} claim already exists from this issuer.</strong><p>A replacement must explicitly supersede ${escapeHTML(old.id)}. Different issuers can independently attest.</p><label class="check-label"><input type="checkbox" name="supersede" id="supersede" ${errors.supersede ? 'aria-invalid="true" aria-describedby="supersede-error"' : ""} ${claimDraft.supersede ? "checked" : ""}><span>Supersede this issuer’s existing claim; preserve its history.</span></label>${errors.supersede ? `<p class="field-error" id="supersede-error">${escapeHTML(errors.supersede)}</p>` : ""}</div>` : ""}
        <div class="form-actions">
          <a class="text-button" href="#contribution"
            >${icon("back")}Back to contribution</a
          ><button class="button" type="submit">
            Simulate claim ${icon("arrow")}
          </button>
        </div>
      </form>
      <aside class="side-guide">
        <p class="eyebrow">A CLAIM IS A STATEMENT</p>
        <ol class="guide-list">
          <li>
            <span class="step-num">1</span>
            <div>
              <p>Anyone may attest</p>
              <small
                >External claims count by category and outcome. Workspace
                membership adds context.</small
              >
            </div>
          </li>
          <li>
            <span class="step-num">2</span>
            <div>
              <p>Specificity builds context</p>
              <small
                >Completion is not authorship. A positive delivery claim is not
                a universal quality score.</small
              >
            </div>
          </li>
          <li>
            <span class="step-num">3</span>
            <div>
              <p>Accountability remains</p>
              <small
                >Issuers may revoke. Records remain in history, including
                reasons and replacement links.</small
              >
            </div>
          </li>
        </ol>
      </aside>
    </div>`;
}
function stepperForClaim() {
  return /* HTML */ `<div class="detail-topline" style="margin-bottom:25px">
    ${badge("Synthetic issuer")}${badge("Public evidence")}${badge("Declared claim · not verified")}
  </div>`;
}
function selectedClaim() {
  return state.claims.find((claim) => claim.id === location.hash.split("/")[1]);
}
function revoke() {
  const claim = selectedClaim();
  if (!claim || claim.status !== "active")
    return /* HTML */ `${header("CLAIM HISTORY", "This claim is not active.", "Historical records cannot be reactivated. Return to inspect the current claim states.")}${linkButton("View contribution", "contribution", "secondary")}`;
  return /* HTML */ `${header("CLAIM / REVOCATION", "Withdraw the claim. Keep the history.", "This simulation switches to the original issuer. Production requires that issuer’s wallet signature.")}
    <div class="verify-layout">
      <form id="revocation-form" class="panel form-panel" novalidate>
        ${errorSummary()}${noticeHTML()}
        <div class="detail-topline">${badge(claim.type)}${badge(claim.id)}</div>
        <dl class="review-grid">
          <dt>Issuer</dt>
          <dd>${escapeHTML(people[claim.actor].name)} · synthetic identity</dd>
          <dt>Original statement</dt>
          <dd>${escapeHTML(claim.reason)}</dd>
          <dt>Current outcome</dt>
          <dd>
            ${escapeHTML(claim.result)} ·
            active${claim.disputed ? " · disputed subset" : ""}
          </dd>
        </dl>
        <div class="danger-box">
          <strong>Revocation cannot erase the original claim.</strong>Its active
          count decreases after indexing. The historical claim and your reason
          remain visible. A revoked claim cannot become active again.
        </div>
        ${field("revoke-reason", "Why are you revoking this claim?", revokeReason, "Required. Explain the change without adding private information.", { textarea: true })}
        <div class="form-actions">
          <a href="#contribution" class="text-button">Cancel revocation</a
          ><button type="submit" class="button">
            Simulate revocation ${icon("arrow")}
          </button>
        </div>
      </form>
    </div>`;
}
function profile() {
  const claims = externalClaims();
  const unique = new Set(claims.map((claim) => claim.actor)).size;
  const disputed = claims.filter((claim) => claim.disputed).length;
  return /* HTML */ `${header("PUBLIC PROFILE / EXPLANATION", "An evidence trail, not a score.", "Signals belong to the contribution creator. Every count has a reason you can inspect.")}
    <div class="detail-layout">
      <section class="panel">
        <div class="profile-header">
          <span class="avatar large" aria-hidden="true">MC</span>
          <div>
            <h2 style="font-size:30px">Mira Chen</h2>
            <p>
              Contributor · accessibility & open source<br />Synthetic profile ·
              no wallet address
            </p>
          </div>
        </div>
        <div class="profile-stats">
          <div>
            <strong>${state.contribution ? "01" : "00"}</strong
            ><span>published in simulation</span>
          </div>
          <div>
            <strong>${String(unique).padStart(2, "0")}</strong
            ><span>unique external issuers</span>
          </div>
          <div>
            <strong>${claims.length ? "100%" : "—"}</strong
            ><span>evidence links supplied (unverified)</span>
          </div>
        </div>
        <div class="panel-header">
          <h2>Active external claims</h2>
          ${badge("rules v1")}
        </div>
        <div class="table-scroll" tabindex="0" role="region" aria-label="Category counts; scroll horizontally to inspect all columns">
          <table>
            <caption class="sr-only">
              Category counts in the local simulation; disputed claims remain
              included in active totals.
            </caption>
            <thead>
              <tr>
                <th scope="col">Category</th>
                <th scope="col">Positive</th>
                <th scope="col">Negative</th>
                <th scope="col">Disputed subset</th>
                <th scope="col">Unique issuers</th>
              </tr>
            </thead>
            <tbody>
              ${Object.entries(categories)
                .map(
                  ([type, label]) =>
                    `<tr><th scope="row" style="font-size:11px;color:var(--pearl)">${label}</th><td class="table-data">${countClaims(type, "positive")}</td><td>${countClaims(type, "negative")}</td><td>${claims.filter((claim) => claim.type === type && claim.disputed).length}</td><td>${new Set(claims.filter((claim) => claim.type === type).map((claim) => claim.actor)).size}</td></tr>`,
                )
                .join("")}
            </tbody>
          </table>
        </div>
        <p class="profile-note">
          <strong>${claims.length} active external claims</strong> =
          ${claims.length - disputed} undisputed + ${disputed} disputed.
          Disputes annotate the active total; they do not suppress it. Link
          completeness is not verified evidence coverage. Integrity coverage is
          unavailable in this prototype.
        </p>
        <div class="review-section">
          <h3>What stays out of active counts</h3>
          <p class="profile-note">
            ${state.claims.filter((claim) => claim.actor === "mira" && claim.status === "active").length}
            active self-claims have zero external weight.
            ${state.claims.filter((claim) => claim.status === "revoked").length}
            revoked and
            ${state.claims.filter((claim) => claim.status === "superseded").length}
            superseded claims remain in history. Expired claims are also
            excluded in production. Claimed collaborators receive no automatic
            credit.
          </p>
          <a href="#contribution" class="text-button"
            >Inspect every claim ${icon("arrow")}</a
          >
        </div>
      </section>
      <aside class="detail-stack">
        <section class="panel">
          <div class="panel-header"><h2>Context, connected</h2></div>
          ${graph(true)}
          <div class="graph-legend">
            <span><i></i>Claimed relationship</span
            ><span><i class="solid"></i>Attested · simulated</span>
          </div>
          <details class="graph-list">
            <summary>Read the graph as a list</summary>
            <ul>
              <li>Mira Chen → PR #42: claimed creator.</li>
              <li>PR #42 → AI assistance: declared use.</li>
              <li>
                Jules Park → PR #42: claimed collaborator; acceptance not
                recorded.
              </li>
              <li>
                ${claims.length} active external claims → Mira’s contribution:
                simulated attestations.
              </li>
            </ul>
          </details>
        </section>
        <section class="panel">
          <h2 style="font-size:18px">How to read this</h2>
          <p class="profile-note">
            <span class="policy-number">01</span>Counts are grouped by claim
            type and outcome.
          </p>
          <p class="profile-note">
            <span class="policy-number">02</span>A high count is evidence of
            activity, not objective trustworthiness.
          </p>
          <p class="profile-note">
            <span class="policy-number">03</span>Issuers, evidence, disputes,
            and history stay visible.
          </p>
        </section>
      </aside>
    </div>`;
}
function verify() {
  return /* HTML */ `${header("PUBLIC VERIFICATION", "Check the record. Keep the context.", "Public reads need no wallet. This prototype can inspect only its own synthetic local record.")}
    <div class="verify-layout">
      <form class="panel form-panel" id="verification-form" novalidate>
        ${errorSummary()}${noticeHTML()}
        <h2>Look up a contribution</h2>
        ${field("verification-id", "Contribution reference", state.contribution?.id || "SIM-CONTRIBUTION-0001", "SIM references are local labels, not transaction hashes or chain identifiers.")}
        <div class="form-actions">
          <span class="saved-hint">No wallet required</span
          ><button class="button" type="submit">
            Inspect local record ${icon("shield")}
          </button>
        </div>
      </form>
      ${state.verified && state.contribution ? `<section class="panel verify-result"><div class="panel-header"><h2>Unverified · simulation only</h2>${badge("No chain proof")}</div><p class="profile-note">This is an inspectable prototype record. Neither onchain existence nor artifact integrity has been verified.</p><dl class="review-grid"><dt>Local reference</dt><dd class="verification-value">${escapeHTML(state.contribution.id)}</dd><dt>Chain / registry</dt><dd>None / none</dd><dt>Block / transaction</dt><dd>None / none</dd><dt>Metadata integrity</dt><dd>Unverified · keccak256 not computed</dd><dt>Artifact integrity</dt><dd>Unverified · SHA-256 not computed</dd><dt>Projection state</dt><dd>${escapeHTML(state.contribution.status)} · simulated</dd><dt>Active claims</dt><dd>${countClaims(null, "positive")} positive · ${countClaims(null, "negative")} negative · ${externalClaims().filter((claim) => claim.disputed).length} disputed subset</dd><dt>Rules version</dt><dd>v1 · active external evidence counts</dd></dl><div class="export-actions">${button("Export JSON", "export-json", "secondary", "download")}${button("Export CSV", "export-csv", "secondary", "download")}<a class="text-button" href="#contribution">Read full history ${icon("arrow")}</a></div><p class="external-label">Exports include simulated: true and unverified integrity fields. No private files or wallet addresses.</p><p id="export-notice" class="action-notice" role="status"></p></section>` : ""}
    </div>`;
}
function render() {
  const current = route();
  const active = [
    "compose",
    "review",
    "contribution",
    "attest",
    "revoke",
  ].includes(current)
    ? "contribution"
    : current;
  document.getElementById("navigation").innerHTML = [
    ["dashboard", "Overview", "grid"],
    ["contribution", "Contributions", "layers"],
    ["profile", "Reputation", "graph"],
    ["verify", "Verify", "shield"],
  ]
    .map(
      ([path, label, glyph]) =>
        `<a href="#${path}" class="nav-link ${active === path ? "active" : ""}" ${active === path ? 'aria-current="page"' : ""}>${icon(glyph)}<span>${label}</span>${path === "contribution" ? `<span class="nav-count">${state.contribution ? 1 : 0}</span>` : ""}</a>`,
    )
    .join("");
  const names = {
    dashboard: "Overview",
    contribution: "Contributions",
    compose: "New contribution",
    review: "Publication review",
    attest: "Add claim",
    revoke: "Revoke claim",
    profile: "Reputation",
    verify: "Verification",
  };
  document.getElementById("breadcrumb").innerHTML =
    `Workspace <span aria-hidden="true">/</span> ${names[current] || "Overview"}`;
  document.getElementById("actor").value = state.actor;
  document.getElementById("actor-avatar").textContent =
    people[state.actor]?.initials || "MC";
  document.getElementById("scenario").value = state.scenario;
  document.title = `${names[current] || "Overview"} · Attestia prototype`;
  const pages = {
    dashboard,
    compose: composer,
    review,
    contribution,
    attest,
    revoke,
    profile,
    verify,
  };
  main.innerHTML = (pages[current] || dashboard)();
}
function pushHistory(label) {
  state.history.push({
    label,
    time: new Intl.DateTimeFormat("en", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date()),
  });
}
const failureMessages = {
  reject: {
    title: "Signature rejected. Your draft is safe.",
    message:
      "Nothing was submitted. Review the details and try the simulated signature again.",
    action: "recover-write",
    label: "Return to normal flow",
  },
  session: {
    title: "Session expired. Your draft is safe.",
    message:
      "Production requires a fresh nonce-bound login. Reconnect in this simulation to continue without re-entering your draft.",
    action: "recover-write",
    label: "Simulate fresh session",
  },
  mismatch: {
    title: "The active wallet does not own this action.",
    message:
      "Publication requires Mira, the creator. Revocation requires the original issuer. The simulated write is blocked and all entered data is preserved.",
    action: "recover-write",
    label: "Use the expected demo identity",
  },
  duplicate: {
    title: "Duplicate submission detected.",
    message:
      "The same creator and artifact must not create an unlinked duplicate. Inspect the existing record, or return to the preserved draft; nothing new was written.",
    action: "recover-duplicate",
    label: "Inspect existing record or draft",
  },
  evidence: {
    title: "Evidence is unavailable.",
    message:
      "The artifact cannot be retrieved. Its integrity remains unverified. Restore access or choose an accessible public source before continuing.",
    action: "recover-evidence",
    label: "Simulate restored evidence access",
  },
  lag: {
    title: "Indexer is behind the finalized record.",
    message:
      "The simulated write is saved but its projection is not fresh. Avoid resubmitting; wait for indexing or use the recovery action.",
    action: "recover-indexer",
    label: "Simulate indexer recovery",
  },
};
function showNotice(value) {
  notice = value;
  render();
  requestAnimationFrame(() => document.getElementById("state-notice")?.focus());
  announce(`${value.title} ${value.message}`);
}
function consumeFailure() {
  const scenario = state.scenario;
  state.scenario = "normal";
  save();
  if (scenario !== "normal" && scenario !== "lag") {
    showNotice(failureMessages[scenario]);
    return "blocked";
  }
  return scenario;
}
function reportErrors(nextErrors) {
  errors = nextErrors;
  render();
  requestAnimationFrame(() =>
    document.getElementById("error-summary")?.focus(),
  );
}
function publish() {
  const check = document.getElementById("publication-check");
  if (!check.checked)
    return reportErrors({
      "publication-check":
        "Confirm you reviewed the public fields before publication.",
    });
  if (state.contribution) return showNotice(failureMessages.duplicate);
  if (state.actor !== "mira") return showNotice(failureMessages.mismatch);
  errors = {};
  const outcome = consumeFailure();
  if (outcome === "blocked") return;
  state.contribution = {
    ...state.draft,
    id: "SIM-CONTRIBUTION-0001",
    simulated: true,
    status: "Awaiting signature",
  };
  notice = null;
  pushHistory("Publication started");
  save();
  go("contribution");
  const steps = [
    "Submitted",
    "Proposed",
    "Finalized",
    ...(outcome === "lag" ? [] : ["Indexed"]),
  ];
  const advance = () => {
    if (!state.contribution || !steps.length) return;
    state.contribution.status = steps.shift();
    if (state.contribution.status === "Indexed")
      pushHistory("Contribution indexed");
    save();
    if (route() === "contribution") render();
    announce(`${state.contribution.status} in simulation.`);
    if (steps.length) writeTimer = setTimeout(advance, 430);
  };
  writeTimer = setTimeout(advance, 430);
}
function issueClaim() {
  const form = document.getElementById("attestation-form");
  const data = new FormData(form);
  claimDraft = {
    type: data.get("claim-type"),
    actor: data.get("claim-actor"),
    result: data.get("claim-result"),
    reason: String(data.get("claim-reason")).trim(),
    evidence: String(data.get("claim-evidence")).trim(),
    merge: String(data.get("claim-merge") || ""),
    conflicts: String(data.get("claim-conflicts") || ""),
    validUntil: String(data.get("claim-expiry") || ""),
    supersede: data.get("supersede") === "on",
  };
  const invalid = {};
  if (claimDraft.reason.length < 12)
    invalid["claim-reason"] =
      "Explain your reason using at least 12 characters.";
  if (!safeURL(claimDraft.evidence))
    invalid["claim-evidence"] =
      "Enter a public HTTPS evidence URL without credentials.";
  if (
    claimDraft.validUntil &&
    (!Number.isFinite(Date.parse(claimDraft.validUntil)) ||
      Date.parse(claimDraft.validUntil) <= Date.now())
  )
    invalid["claim-expiry"] =
      "Choose a future expiry time, or leave the field blank.";
  if (claimDraft.type === "USAGE" && claimDraft.merge.trim().length < 5)
    invalid["claim-merge"] =
      "Identify the merged PR that supports this usage claim.";
  const old = activeClaims().find(
    (claim) =>
      claim.actor === claimDraft.actor && claim.type === claimDraft.type,
  );
  if (old && !claimDraft.supersede)
    invalid.supersede =
      "Explicitly supersede the existing claim, or choose a different issuer or type.";
  if (Object.keys(invalid).length) return reportErrors(invalid);
  errors = {};
  const outcome = consumeFailure();
  if (outcome === "blocked") return;
  if (old && outcome !== "lag") old.status = "superseded";
  const claim = {
    ...claimDraft,
    id: `SIM-CLAIM-${String(state.nextId++).padStart(4, "0")}`,
    status: outcome === "lag" ? "pending" : "active",
    simulated: true,
    disputed: false,
    supersedes: old?.id || null,
    rubric: claimDraft.type === "QUALITY" ? "Open Source Lab / v1" : null,
  };
  state.claims.push(claim);
  state.actor = claim.actor;
  pushHistory(`${claim.type} claim issued by ${people[claim.actor].name}`);
  claimDraft = null;
  if (outcome === "lag") state.contribution.status = "Finalized";
  notice = {
    title: "Claim recorded in simulation.",
    message:
      outcome === "lag"
        ? "The simulated chain accepted the claim, but active counts await indexer recovery. All records remain synthetic."
        : "The local projection now includes this claim. All issuers and records remain synthetic.",
  };
  save();
  go("contribution");
  announce("Claim recorded in simulation.");
}
function exportRecord(format) {
  const envelope = {
    simulated: true,
    integrity: {
      status: "unverified",
      chainId: null,
      contractAddress: null,
      transactionHash: null,
      sourceBlock: null,
      metadataDigest: null,
      artifactDigest: null,
      projectionState: state.contribution.status,
      scoreVersion: "attestia.counts.v1",
    },
    contribution: state.contribution,
    claims: state.claims,
    activeExternalClaims: {
      positive: countClaims(null, "positive"),
      negative: countClaims(null, "negative"),
      disputedSubset: externalClaims().filter((claim) => claim.disputed).length,
    },
    history: state.history,
  };
  // CSV cells cannot become executable formulas when opened in a spreadsheet.
  const csvCell = (value) =>
    `"${String(value ?? "")
      .replace(/^[=+\-@\t\r]/, (match) => `'${match}`)
      .replaceAll('"', '""')}"`;
  const content =
    format === "json"
      ? JSON.stringify(envelope, null, 2)
      : [
          [
            "simulated",
            "integrity",
            "contribution",
            "claim",
            "type",
            "issuer",
            "outcome",
            "status",
            "disputed",
          ],
          ...state.claims.map((claim) => [
            true,
            "unverified",
            state.contribution.id,
            claim.id,
            claim.type,
            people[claim.actor].name,
            claim.result,
            claim.status,
            claim.disputed,
          ]),
          ...(state.claims.length
            ? []
            : [
                [
                  true,
                  "unverified",
                  state.contribution.id,
                  "",
                  "",
                  "",
                  "",
                  "",
                  "",
                ],
              ]),
        ]
          .map((row) => row.map(csvCell).join(","))
          .join("\r\n");
  const url = URL.createObjectURL(
    new Blob([content], {
      type: format === "json" ? "application/json" : "text/csv;charset=utf-8",
    }),
  );
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `attestia-simulated-unverified.${format}`;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  document.getElementById("export-notice").textContent =
    `${format.toUpperCase()} export prepared. All records are explicitly simulated and unverified.`;
}

document.addEventListener("submit", (event) => {
  event.preventDefault();
  if (event.target.id === "contribution-form") {
    const data = new FormData(event.target);
    for (const key of Object.keys(state.draft))
      if (data.has(key)) state.draft[key] = String(data.get(key)).trim();
    save();
    const invalid = {};
    if (state.draft.title.length < 5)
      invalid.title =
        "Give this contribution a title of at least 5 characters.";
    if (state.draft.summary.length < 20)
      invalid.summary = "Describe the outcome using at least 20 characters.";
    if (!safeURL(state.draft.source))
      invalid.source =
        "Enter a public HTTPS source URL without embedded credentials.";
    if (state.draft.humanWork.length < 12)
      invalid.humanWork =
        "Describe your personal contribution using at least 12 characters.";
    if (Object.keys(invalid).length) return reportErrors(invalid);
    errors = {};
    notice = null;
    go("review");
  } else if (event.target.id === "publication-form") publish();
  else if (event.target.id === "attestation-form") issueClaim();
  else if (event.target.id === "revocation-form") {
    const claim = selectedClaim();
    if (!claim || claim.status !== "active") return;
    revokeReason = document.getElementById("revoke-reason").value.trim();
    if (revokeReason.length < 12)
      return reportErrors({
        "revoke-reason": "Explain the revocation using at least 12 characters.",
      });
    errors = {};
    const outcome = consumeFailure();
    if (outcome === "blocked") return;
    if (outcome === "lag") claim.pendingRevocation = true;
    else claim.status = "revoked";
    claim.revokeReason = revokeReason;
    state.actor = claim.actor;
    pushHistory(`${claim.type} claim revoked by its issuer`);
    if (outcome === "lag") state.contribution.status = "Finalized";
    revokeReason = "";
    notice = {
      title: "Claim revoked in simulation.",
      message:
        outcome === "lag"
          ? "The revocation is recorded in simulation. Active counts retain the last projection until indexer recovery."
          : "The active count is reduced. The original claim and revocation reason remain in history.",
    };
    save();
    go("contribution");
  } else if (event.target.id === "verification-form") {
    const reference = document.getElementById("verification-id").value.trim();
    if (!state.contribution || reference !== state.contribution.id) {
      state.verified = false;
      save();
      return reportErrors({
        "verification-id":
          "No matching local record. Publish the example contribution first, then use its SIM reference.",
      });
    }
    errors = {};
    state.verified = true;
    save();
    render();
    announce(
      "Local record found. Integrity is unverified; no chain proof exists.",
    );
    document
      .querySelector(".verify-result")
      ?.scrollIntoView({ block: "nearest" });
  }
});
document.addEventListener("input", (event) => {
  if (
    event.target.closest("#contribution-form") &&
    Object.hasOwn(state.draft, event.target.name)
  ) {
    state.draft[event.target.name] = event.target.value;
    save();
    document.getElementById("draft-save-status").textContent = storageAvailable
      ? "Draft saved on this browser"
      : "This session only · storage unavailable";
  }
  if (event.target.id === "revoke-reason") revokeReason = event.target.value;
  if (claimDraft && event.target.closest("#attestation-form")) {
    const keys = {
      "claim-reason": "reason",
      "claim-evidence": "evidence",
      "claim-merge": "merge",
      "claim-conflicts": "conflicts",
      "claim-expiry": "validUntil",
    };
    if (keys[event.target.id])
      claimDraft[keys[event.target.id]] = event.target.value;
    save();
  }
});
document.addEventListener("change", (event) => {
  if (event.target.id === "actor") {
    state.actor = event.target.value;
    save();
    document.getElementById("actor-avatar").textContent =
      people[state.actor].initials;
    announce(`Using synthetic identity ${people[state.actor].name}.`);
  }
  if (event.target.id === "scenario") {
    state.scenario = event.target.value;
    save();
    document.getElementById("lab-feedback").textContent =
      state.scenario === "normal"
        ? "Normal simulation restored."
        : `${event.target.selectedOptions[0].text} is armed for the next simulated write.`;
  }
  if (
    claimDraft &&
    ["claim-type", "claim-actor", "claim-result"].includes(event.target.id)
  ) {
    const id = event.target.id;
    claimDraft[
      {
        "claim-type": "type",
        "claim-actor": "actor",
        "claim-result": "result",
      }[id]
    ] = event.target.value;
    claimDraft.supersede = false;
    save();
    if (id === "claim-actor") {
      state.actor = event.target.value;
      save();
    }
    errors = {};
    render();
    document.getElementById(id).focus();
  }
});
document.addEventListener("click", (event) => {
  const focusLink = event.target.closest("[data-focus]");
  if (focusLink) {
    event.preventDefault();
    document.getElementById(focusLink.dataset.focus)?.focus();
    return;
  }
  const target = event.target.closest("[data-action]");
  if (!target) return;
  const action = target.dataset.action;
  if (action === "reset") {
    clearTimeout(writeTimer);
    state = freshState();
    claimDraft = null;
    revokeReason = "";
    notice = null;
    errors = {};
    save();
    document.getElementById("lab-feedback").textContent =
      "Prototype reset. The original example draft is ready.";
    go("dashboard");
    announce("Prototype reset. Only synthetic local records were removed.");
  } else if (action === "preview-failure") {
    if (state.scenario === "normal") {
      document.getElementById("lab-feedback").textContent =
        "Normal flow selected. Choose a failure scenario to preview its recovery.";
      return;
    }
    const failure = state.scenario;
    if (failure === "lag" && state.contribution) {
      state.contribution.status = "Finalized";
      save();
    }
    showNotice(failureMessages[failure]);
    if (route() === "dashboard" || route() === "profile") {
      go(state.contribution ? "contribution" : "review");
    }
    document.getElementById("lab-feedback").textContent =
      `Previewing: ${failureMessages[failure].title}`;
  } else if (action === "recover-write") {
    state.actor =
      route() === "revoke"
        ? selectedClaim()?.actor || "mira"
        : route() === "attest"
          ? claimDraft?.actor || "jules"
          : "mira";
    state.scenario = "normal";
    notice = null;
    errors = {};
    save();
    render();
    announce("Simulation recovered. Your entered data is preserved.");
  } else if (action === "recover-duplicate") {
    notice = null;
    state.scenario = "normal";
    save();
    go(state.contribution ? "contribution" : "compose");
  } else if (action === "recover-evidence") {
    notice = null;
    state.scenario = "normal";
    save();
    render();
    announce(
      "Evidence access restored in simulation only. Integrity remains unverified.",
    );
  } else if (action === "recover-indexer") {
    if (state.contribution) {
      clearTimeout(writeTimer);
      for (const claim of state.claims) {
        if (claim.status === "pending") {
          const prior = state.claims.find(
            (item) => item.id === claim.supersedes,
          );
          if (prior) prior.status = "superseded";
          claim.status = "active";
        }
        if (claim.pendingRevocation) {
          claim.status = "revoked";
          delete claim.pendingRevocation;
        }
      }
      state.contribution.status = "Indexed";
      pushHistory("Indexer recovered in simulation");
    }
    state.scenario = "normal";
    notice = null;
    save();
    render();
    announce("Local projection caught up in simulation.");
  } else if (action === "evidence") {
    if (state.scenario === "evidence") {
      state.scenario = "normal";
      save();
      showNotice(failureMessages.evidence);
    } else {
      state.evidenceVisible = !state.evidenceVisible;
      save();
      render();
      announce(
        state.evidenceVisible
          ? "Synthetic artifact preview opened. No source was fetched."
          : "Artifact preview closed.",
      );
    }
  } else if (action === "dispute") {
    const claim = state.claims.find((item) => item.id === target.dataset.id);
    claim.disputed = !claim.disputed;
    pushHistory(
      `${claim.id}: dispute ${claim.disputed ? "opened" : "resolved"}`,
    );
    save();
    render();
    announce(
      `Dispute ${claim.disputed ? "opened" : "resolved"} in simulation. Active claim totals are unchanged.`,
    );
  } else if (action === "export-json" || action === "export-csv")
    exportRecord(action.slice(7));
});
window.addEventListener("hashchange", () => {
  errors = {};
  if (!["contribution", "review"].includes(route())) notice = null;
  render();
  main.focus({ preventScroll: true });
  window.scrollTo({ top: 0 });
});
// A reload during a pending animation recovers to a visible, actionable indexing state.
if (
  state.contribution &&
  !["Indexed", "Finalized"].includes(state.contribution.status)
) {
  state.contribution.status = "Finalized";
  save();
}
render();
