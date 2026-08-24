export const createFallbackDetail = (matter) => ({
  overview: `${matter.title} is a synthetic ${matter.type.toLowerCase()} matter in the ${matter.stage.toLowerCase()} stage. This record is provided to explore the workspace layout and review controls.`,
  briefUpdated: "09:30 today",
  confidence: 88,
  facts: [
    { label: "Client", value: matter.client, source: "Matter card" },
    { label: "Practice area", value: matter.type, source: "Matter card" },
    { label: "Current stage", value: matter.stage, source: "Workflow" },
    { label: "Matter value", value: matter.value, source: "Matter metadata" },
  ],
  risks: [{ tone: matter.risk === "High" ? "danger" : "warning", title: `${matter.risk} review priority`, detail: "This is a review cue, not an automated legal risk assessment." }],
  parties: [{ role: "Client", name: matter.client, meta: "Synthetic demo party" }, { role: "Matter owner", name: matter.owner, meta: "Internal team" }],
  codes: [matter.code],
  keyDates: [{ date: matter.nextDeadline.split(",")[0], time: matter.nextDeadline.includes(",") ? matter.nextDeadline.split(",")[1] : "", title: "Next matter deadline", status: "Review", source: "Matter card" }],
  workflow: {
    stages: ["Intake", "Assessment", "Active work", "Client review", "Closing"], current: matter.stage === "Intake" ? 0 : 2,
    blockers: [],
    checks: [
      { id: `${matter.id}-1`, title: "Confirm instructions", owner: matter.owner, due: "Complete", done: true },
      { id: `${matter.id}-2`, title: "Review current stage documents", owner: matter.owner, due: "This week", done: false },
      { id: `${matter.id}-3`, title: "Confirm next action with client", owner: matter.owner, due: "This week", done: false },
    ],
  },
  communications: [{ id: `${matter.id}-MSG`, side: "in", sender: matter.client, time: "Yesterday", text: "This is a synthetic message for exploring the matter communication workspace.", status: "Filed" }],
  audit: [{ time: "09:30", actor: matter.owner, action: "Matter opened", detail: "Synthetic demo audit event" }],
});

const matterDetail = (data, matter) => data.matterDetails[matter.id] || createFallbackDetail(matter);

function workspaceHeader(matter, detail, tab, helpers) {
  const { icon, escapeHtml, badge } = helpers;
  const tabs = [
    ["overview", "Overview"], ["workflow", "Workflow"], ["documents", "Documents"], ["communications", "Communications"],
    ["time", "Time & fees"], ["ledger", "Client ledger"], ["audit", "Audit trail"],
  ];
  return `
    <a class="back-link" href="#/matters">${icon("chevron", 14)}Back to matters</a>
    <section class="matter-hero">
      <div class="matter-identity"><span class="matter-type-large">${matter.type.slice(0, 2).toUpperCase()}</span><div><div class="matter-meta-line"><span>${matter.id}</span><span>·</span><span>${escapeHtml(matter.code)}</span>${badge(matter.status, matter.status === "Attention" ? "danger" : matter.status === "On track" ? "success" : "warning")}</div><h1>${escapeHtml(matter.title)}</h1><p>${escapeHtml(matter.client)} · ${escapeHtml(matter.type)} · Owned by ${escapeHtml(matter.owner)}</p></div></div>
      <div class="matter-actions"><button class="button button-secondary" data-action="open-ai-matter" data-id="${matter.id}">${icon("sparkles", 16)}Ask this matter</button><button class="button button-secondary" data-action="matter-time" data-id="${matter.id}">${icon("clock", 16)}Add time</button><button class="button button-primary" data-action="matter-next" data-id="${matter.id}">Next action${icon("chevron", 15)}</button></div>
      <div class="matter-stat-strip">
        <div><small>Stage</small><strong>${escapeHtml(matter.stage)}</strong></div>
        <div><small>Next deadline</small><strong class="${matter.risk === "High" ? "text-danger" : ""}">${escapeHtml(matter.nextDeadline)}</strong></div>
        <div><small>Matter value</small><strong>${escapeHtml(matter.value)}</strong></div>
        <div><small>AI brief</small><strong>${detail.confidence}% confidence</strong></div>
      </div>
      <nav class="matter-tabs" aria-label="Matter workspace tabs">${tabs.map(([id, label]) => `<a href="#/matters/${matter.id}?tab=${id}" class="${tab === id ? "active" : ""}" aria-current="${tab === id ? "page" : "false"}">${label}${id === "documents" ? `<small>${helpers.state.data.documents.filter((document) => document.matterId === matter.id).length}</small>` : ""}</a>`).join("")}</nav>
    </section>
  `;
}

function renderOverview(matter, detail, { icon, escapeHtml }) {
  return `
    <div class="matter-layout">
      <div class="matter-main-column">
        <section class="panel ai-brief-card">
          <div class="section-header"><div><p class="section-kicker">Grounded matter intelligence</p><h2>${icon("sparkles", 17)}AI matter brief</h2></div><div class="brief-meta"><span>Updated ${detail.briefUpdated}</span><strong>${detail.confidence}% confidence</strong></div></div>
          <div class="brief-body"><p class="brief-summary">${escapeHtml(detail.overview)}</p><div class="brief-facts">${detail.facts.map((fact) => `<div><small>${escapeHtml(fact.label)}</small><strong>${escapeHtml(fact.value)}</strong><button data-action="source-chip" data-source="${escapeHtml(fact.source)}">${icon("file", 12)}${escapeHtml(fact.source)}</button></div>`).join("")}</div><div class="brief-footer"><span>${icon("activity", 14)}Generated from matter sources. Verify before relying on any fact or date.</span><div><button class="text-button" data-action="refresh-brief" data-id="${matter.id}">Refresh brief</button><button class="button button-quiet" data-action="approve-brief" data-id="${matter.id}">Mark reviewed</button></div></div></div>
        </section>
        <section class="panel risk-card">
          <div class="section-header"><div><p class="section-kicker">Exceptions</p><h2>Risks & open decisions</h2></div><a href="#/matters/${matter.id}?tab=workflow">Open workflow</a></div>
          <div class="risk-list">${detail.risks.map((risk) => `<article><span class="risk-symbol risk-${risk.tone}">${risk.tone === "danger" ? "!" : "i"}</span><div><strong>${escapeHtml(risk.title)}</strong><p>${escapeHtml(risk.detail)}</p></div><button class="button button-quiet" data-action="review-risk" data-risk="${escapeHtml(risk.title)}">Review${icon("chevron", 13)}</button></article>`).join("")}</div>
        </section>
        <section class="panel dates-card">
          <div class="section-header"><div><p class="section-kicker">Human-confirmed calendar</p><h2>Key dates</h2></div><button class="text-button" data-action="add-date">Add date</button></div>
          <div class="date-list">${detail.keyDates.map((item) => `<article><time><strong>${escapeHtml(item.date)}</strong><small>${escapeHtml(item.time)}</small></time><span class="date-line"></span><div><strong>${escapeHtml(item.title)}</strong><small>${icon("file", 11)}${escapeHtml(item.source)}</small></div><span class="date-status">${escapeHtml(item.status)}</span></article>`).join("")}</div>
        </section>
      </div>
      <aside class="matter-side-column">
        <section class="panel detail-card"><div class="section-header"><div><p class="section-kicker">People & organisations</p><h2>Parties</h2></div><button class="text-button" data-action="add-party">Add</button></div><div class="party-list">${detail.parties.map((party) => `<button data-action="party-detail"><span class="avatar avatar-small">${party.name.split(" ").map((p) => p[0]).slice(0,2).join("")}</span><span><small>${escapeHtml(party.role)}</small><strong>${escapeHtml(party.name)}</strong><em>${escapeHtml(party.meta)}</em></span>${icon("chevron", 13)}</button>`).join("")}</div></section>
        <section class="panel detail-card"><div class="section-header"><div><p class="section-kicker">Cross-system matching</p><h2>Matter references</h2></div></div><div class="code-list">${detail.codes.map((code, index) => `<div><span>${index === 0 ? "Primary" : "External"}</span><code>${escapeHtml(code)}</code><button data-action="copy-code" data-code="${escapeHtml(code)}" aria-label="Copy ${escapeHtml(code)}">Copy</button></div>`).join("")}</div></section>
        <section class="panel detail-card compact-financial"><div class="section-header"><div><p class="section-kicker">At a glance</p><h2>Time & financials</h2></div><a href="#/matters/${matter.id}?tab=time">View</a></div><dl><div><dt>Unbilled time</dt><dd>${matter.id === "MAT-2026-0142" ? "€3,840" : "€1,240"}</dd></div><div><dt>Client funds</dt><dd>${matter.type === "Conveyancing" || matter.type === "Probate" ? (matter.id === "MAT-2026-0142" ? "€48,500" : "€12,800") : "€0.00"}</dd></div><div><dt>Budget used</dt><dd>${matter.progress}%</dd></div><div><dt>Last entry</dt><dd>${escapeHtml(matter.updated)}</dd></div></dl></section>
      </aside>
    </div>
  `;
}

function renderWorkflow(matter, detail, { icon, escapeHtml }) {
  const flow = detail.workflow;
  return `
    <div class="matter-layout matter-layout-single">
      <div class="matter-main-column">
        <section class="panel workflow-stage-card">
          <div class="section-header"><div><p class="section-kicker">${escapeHtml(matter.type)} workflow</p><h2>Stage progression</h2></div><button class="button button-primary" data-action="advance-workflow" data-id="${matter.id}">Advance stage${icon("chevron", 14)}</button></div>
          <div class="stage-track">${flow.stages.map((stage, index) => `<div class="stage-step ${index < flow.current ? "complete" : index === flow.current ? "current" : ""}"><span>${index < flow.current ? "✓" : index + 1}</span><strong>${escapeHtml(stage)}</strong><small>${index < flow.current ? "Complete" : index === flow.current ? "In progress" : "Not started"}</small></div>`).join("")}</div>
          ${flow.blockers.length ? `<div class="blocker-callout"><span class="risk-symbol risk-danger">!</span><div><strong>${flow.blockers.length} controls block the next stage</strong><p>Human review is required. This prototype does not verify legal readiness.</p><ul>${flow.blockers.map((blocker) => `<li>${escapeHtml(blocker)}</li>`).join("")}</ul></div><button class="button button-secondary" data-action="review-blockers">Review controls</button></div>` : `<div class="success-callout"><span>✓</span><p><strong>Checklist ready for human review</strong><small>No configured demo blockers remain.</small></p></div>`}
        </section>
        <section class="panel checklist-card"><div class="section-header"><div><p class="section-kicker">Current stage</p><h2>${escapeHtml(matter.stage)} checklist</h2></div><span>${flow.checks.filter((check) => check.done).length} of ${flow.checks.length} complete</span></div><div class="checklist">${flow.checks.map((check) => `<button class="check-row ${check.done ? "complete" : ""}" data-action="toggle-check" data-id="${check.id}" data-matter="${matter.id}" aria-pressed="${check.done}"><span class="check-box">${check.done ? "✓" : ""}</span><span><strong>${escapeHtml(check.title)}</strong><small>${escapeHtml(check.owner)}</small></span><em>${escapeHtml(check.due)}</em>${icon("chevron", 13)}</button>`).join("")}</div></section>
        <section class="panel automation-card"><div class="section-header"><div><p class="section-kicker">Next-stage automation</p><h2>What happens after approval</h2></div><span class="ai-label">Preview only</span></div><div class="automation-flow"><div>${icon("mail", 18)}<span><strong>Draft client update</strong><small>Requires approval before mock send</small></span></div><i>${icon("chevron", 13)}</i><div>${icon("calendar", 18)}<span><strong>Create follow-up tasks</strong><small>Assign after human confirmation</small></span></div><i>${icon("chevron", 13)}</i><div>${icon("file", 18)}<span><strong>Prepare next-stage folder</strong><small>Copies approved templates</small></span></div></div></section>
      </div>
    </div>
  `;
}

function documentPreview(document, { icon, escapeHtml }) {
  if (!document) return `<div class="empty-state">${icon("file", 24)}<h3>Select a document</h3><p>Choose a file to inspect its preview and extracted fields.</p></div>`;
  return `<div class="doc-preview-header"><div><small>${escapeHtml(document.folder)} · ${document.type}</small><strong>${escapeHtml(document.name)}</strong></div><button class="icon-button" data-action="document-menu" aria-label="Document options">•••</button></div><div class="paper-preview">${document.content.map((line, index) => `<p class="${index === 0 ? "paper-title" : ""}">${escapeHtml(line)}</p>`).join("")}<span>DEMO DOCUMENT</span></div><div class="extraction-panel"><div><span>${icon("sparkles", 14)}AI extraction</span><strong>Review required</strong></div><p>${escapeHtml(document.summary)}</p><dl>${document.extracted.map(([label, value, confidence]) => `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)} <small>${escapeHtml(confidence)}</small></dd></div>`).join("")}</dl><button class="button button-secondary" data-action="approve-extraction" data-id="${document.id}">Mark extraction reviewed</button></div>`;
}

function renderMatterDocuments(matter, data, selectedDocument, helpers) {
  const { icon, escapeHtml } = helpers;
  const documents = data.documents.filter((document) => document.matterId === matter.id);
  const folders = [...new Set(documents.map((document) => document.folder))];
  const activeFolder = helpers.state.documentFolder || "all";
  const visibleDocuments = activeFolder === "all" ? documents : documents.filter((document) => document.folder === activeFolder);
  const selected = visibleDocuments.find((document) => document.id === selectedDocument) || visibleDocuments[0];
  return `
    <section class="panel document-workspace">
      <div class="document-toolbar"><div><p class="section-kicker">Digital matter file</p><h2>${documents.length} documents · ${folders.length} folders</h2></div><label class="search-field">${icon("search", 15)}<input data-action="document-search" placeholder="Search this matter…" /></label><button class="button button-secondary" data-action="build-bundle" data-matter="${matter.id}">${icon("file", 15)}Build bundle</button><button class="button button-primary" data-action="mock-upload" data-matter="${matter.id}">Upload mock file</button></div>
      <div class="document-grid">
        <aside class="folder-tree"><p class="nav-label">Folders</p><button class="${activeFolder === "all" ? "active" : ""}" data-action="folder-filter" data-folder="all">${icon("briefcase", 15)}All documents <small>${documents.length}</small></button>${folders.map((folder) => `<button class="${activeFolder === folder ? "active" : ""}" data-action="folder-filter" data-folder="${escapeHtml(folder)}">${icon("file", 15)}${escapeHtml(folder)}<small>${documents.filter((doc) => doc.folder === folder).length}</small></button>`).join("")}<div class="folder-footer"><strong>Storage</strong><small>Prototype only · no secure storage</small><div><span style="width:28%"></span></div></div></aside>
        <div class="document-list"><div class="document-list-head"><span>Name</span><span>Updated</span></div>${visibleDocuments.length ? visibleDocuments.map((document) => `<button class="document-row ${selected?.id === document.id ? "selected" : ""}" data-action="select-doc" data-id="${document.id}"><span class="file-type">${document.type.slice(0, 3).toUpperCase()}</span><span><strong>${escapeHtml(document.name)}</strong><small>${escapeHtml(document.folder)} · ${document.size}</small></span><span><strong>${escapeHtml(document.date)}</strong><small>${escapeHtml(document.status)}</small></span></button>`).join("") : `<div class="empty-state"><h3>No documents here</h3><p>Choose another folder or add a mock file.</p></div>`}</div>
        <aside class="document-preview">${documentPreview(selected, helpers)}</aside>
      </div>
    </section>
  `;
}

function renderCommunications(matter, detail, { icon, escapeHtml }) {
  return `<section class="panel communication-workspace"><aside class="thread-list"><div class="thread-list-head"><div><p class="section-kicker">Unified inbox</p><h2>Conversations</h2></div><button class="icon-button" data-action="new-message" aria-label="New message">${icon("plus")}</button></div><label class="search-field">${icon("search", 14)}<input placeholder="Search messages…" /></label><button class="thread active"><span class="avatar avatar-small">SO</span><span><strong>${escapeHtml(matter.client)}</strong><small>Address evidence and closing date</small></span><em>08:51</em></button><button class="thread"><span class="avatar avatar-small">DL</span><span><strong>Demo Legal LLP</strong><small>Replies to Requisitions on Title</small></span><em>Yesterday</em></button><button class="thread"><span class="avatar avatar-small">EB</span><span><strong>Example Bank plc</strong><small>Loan documentation</small></span><em>Fri</em></button></aside><div class="conversation"><div class="conversation-head"><div><strong>${escapeHtml(matter.client)}</strong><small>${matter.id} · Portal + email thread</small></div><div>${badgeLabel("Matter filed")}<button class="button button-secondary" data-action="draft-reply" data-id="${matter.id}">${icon("sparkles", 15)}Draft reply</button></div></div><div class="message-stream">${detail.communications.map((message) => `<article class="message ${message.side === "out" ? "message-out" : ""}"><div><strong>${escapeHtml(message.sender)}</strong><time>${escapeHtml(message.time)}</time></div><p>${escapeHtml(message.text)}</p><small>${escapeHtml(message.status)}</small></article>`).join("")}</div><form class="composer" data-action="send-message"><div class="composer-tools"><button type="button" data-action="attach-mock">${icon("file", 14)}Attach</button><button type="button" data-action="insert-template">Template</button><span>Mock message — not sent externally</span></div><textarea name="message" rows="3" placeholder="Write a synthetic demo reply…" required></textarea><div><small>${icon("sparkles", 12)}AI suggestions require review</small><button class="button button-primary" type="submit" data-matter="${matter.id}">Send mock update</button></div></form></div></section>`;
}

const badgeLabel = (label) => `<span class="badge badge-success"><span></span>${label}</span>`;

function renderAudit(detail, { icon, escapeHtml }) {
  return `<section class="panel audit-card"><div class="section-header"><div><p class="section-kicker">Review trail</p><h2>Human and AI activity</h2></div><div class="audit-legend"><span><i class="human"></i>Human</span><span><i class="ai"></i>AI suggestion</span></div></div><div class="audit-timeline">${detail.audit.map((entry) => `<article><span class="audit-dot ${entry.actor.includes("AI") ? "ai" : "human"}"></span><time>${escapeHtml(entry.time)}</time><div><strong>${escapeHtml(entry.action)}</strong><p>${escapeHtml(entry.detail)}</p><small>${escapeHtml(entry.actor)}</small></div><button class="button button-quiet" data-action="audit-detail">Details</button></article>`).join("")}</div><div class="audit-boundary">${icon("activity", 15)}Prototype trail only. Production immutability, retention and permissions are not implemented.</div></section>`;
}

export function renderMatterWorkspace(context, id, tab = "overview") {
  const matter = context.state.data.matters.find((item) => item.id === id);
  if (!matter) return `<section class="panel empty-state"><h1>Matter not found</h1><p>This demo record may have been reset.</p><a class="button button-secondary" href="#/matters">Back to matters</a></section>`;
  const detail = matterDetail(context.state.data, matter);
  const header = workspaceHeader(matter, detail, tab, context);
  if (tab === "workflow") return header + renderWorkflow(matter, detail, context);
  if (tab === "documents") return header + renderMatterDocuments(matter, context.state.data, context.state.selectedDocument, context);
  if (tab === "communications") return header + (matter.id === "MAT-2026-0142" ? renderCommunications(matter, detail, context) : `<section class="panel placeholder-panel"><span class="metric-icon tone-navy">${context.icon("mail", 22)}</span><h2>No spotlight thread seeded</h2><p>This matter has a coherent fallback record but no synthetic communication history. Use the Alder Quay matter to explore drafting and mock-send flows.</p><a class="button button-secondary" href="#/matters/MAT-2026-0142?tab=communications">Open communication demo</a></section>`);
  if (tab === "audit") return header + renderAudit(detail, context);
  if (tab === "time") return header + context.renderMatterTime(context, matter);
  if (tab === "ledger") return header + context.renderMatterLedger(context, matter);
  return header + renderOverview(matter, detail, context);
}

export function renderIntake(context) {
  const { state, icon, escapeHtml, pageHeader, badge } = context;
  const selected = state.data.intake.find((item) => item.id === state.selectedIntake) || state.data.intake[0];
  return `
    ${pageHeader("Intake & instructions", "Consolidate email, CSV, portal and shared-drive instructions into reviewable matter suggestions.", `<button class="button button-secondary" data-action="intake-rules">Matching rules</button><button class="button button-primary" data-action="sample-import">${icon("plus", 16)}Use sample batch</button>`)}
    <section class="intake-metrics"><article><span class="tone-navy">${icon("inbox")}</span><div><small>Unprocessed</small><strong>12</strong><em>Across 4 sources</em></div></article><article><span class="tone-amber">${icon("activity")}</span><div><small>Needs review</small><strong>3</strong><em>2 code conflicts</em></div></article><article><span class="tone-teal">${icon("sparkles")}</span><div><small>Auto-match rate</small><strong>91%</strong><em>Last 30 demo items</em></div></article><article><span class="tone-green">${icon("clock")}</span><div><small>Median review</small><strong>1m 42s</strong><em>Prototype estimate</em></div></article></section>
    <section class="panel intake-workspace"><div class="intake-list"><div class="section-header"><div><p class="section-kicker">Review queue</p><h2>Incoming instructions</h2></div><label class="select-field"><select><option>All sources</option><option>Email</option><option>Portal</option><option>CSV</option></select></label></div>${state.data.intake.map((item) => `<button class="intake-item ${selected.id === item.id ? "selected" : ""}" data-action="select-intake" data-id="${item.id}"><span class="source-icon">${icon(item.source.includes("email") || item.source.includes("Outlook") ? "mail" : item.source.includes("portal") ? "users" : "file", 17)}</span><span><small>${escapeHtml(item.source)} · ${escapeHtml(item.received)}</small><strong>${escapeHtml(item.subject)}</strong><em>${escapeHtml(item.sender)}</em></span>${badge(item.status, item.status === "Matched" || item.status === "Ready to file" ? "success" : item.status === "Manual review" ? "danger" : "warning")}</button>`).join("")}</div><div class="intake-detail"><div class="intake-detail-head"><div><p class="section-kicker">${selected.id} · ${selected.confidence}% match confidence</p><h2>${escapeHtml(selected.subject)}</h2><p>${escapeHtml(selected.issue)}</p></div><span class="confidence-ring" style="--confidence:${selected.confidence * 3.6}deg"><strong>${selected.confidence}%</strong><small>match</small></span></div><div class="cross-check-card"><div><span>${icon("sparkles", 15)}AI cross-check</span><strong>Human confirmation required</strong></div><p>Suggested match: <a href="#/matters/${selected.proposedMatter}">${escapeHtml(selected.proposedMatter)}</a></p><div class="code-chips">${selected.codes.map((code) => `<code>${escapeHtml(code)}</code>`).join("")}</div></div><div class="extracted-table"><div><span>Extracted field</span><span>Value</span><span>Source</span></div>${selected.extracted.map(([field, value, source]) => `<div><strong>${escapeHtml(field)}</strong><span>${escapeHtml(value)}</span><button data-action="source-chip" data-source="${escapeHtml(source)}">${icon("file", 12)}${escapeHtml(source)}</button></div>`).join("")}</div><div class="intake-actions"><button class="button button-secondary" data-action="manual-intake" data-id="${selected.id}">Send to manual review</button><button class="button button-primary" data-action="accept-intake" data-id="${selected.id}" ${selected.proposedMatter === "Unmatched" ? "disabled" : ""}>Confirm & file to matter</button></div><div class="demo-callout"><strong>Prototype boundary</strong><span>No email, portal, CSV or drive is connected. Matching is deterministic demo data.</span></div></div></section>
  `;
}

export function renderDocumentsPage(context) {
  const { state, icon, escapeHtml, pageHeader, badge } = context;
  const selected = state.data.documents.find((document) => document.id === state.selectedDocument) || state.data.documents[0];
  return `
    ${pageHeader("Documents", "Search across matter files, inspect extracted facts and assemble reviewable bundles.", `<button class="button button-secondary" data-action="build-bundle">${icon("file", 15)}Build bundle</button><button class="button button-primary" data-action="mock-upload">Upload mock file</button>`)}
    <section class="panel global-documents"><div class="table-toolbar"><label class="search-field">${icon("search", 15)}<input data-action="global-document-search" placeholder="Search names, matters or extracted text…" /></label><label class="select-field"><select><option>All practice areas</option><option>Conveyancing</option><option>Corporate</option><option>Probate</option></select></label><div class="toolbar-spacer"></div><span class="result-count">${state.data.documents.length} spotlight documents</span></div><div class="global-document-grid"><div class="global-document-list"><div class="document-list-head"><span>Document</span><span>Matter</span><span>Status</span></div>${state.data.documents.map((document) => `<button data-action="select-doc" data-id="${document.id}" class="global-doc-row ${selected.id === document.id ? "selected" : ""}"><span class="file-type">${document.type.slice(0,3).toUpperCase()}</span><span><strong>${escapeHtml(document.name)}</strong><small>${escapeHtml(document.folder)} · ${document.size} · ${escapeHtml(document.date)}</small></span><span><strong>${document.matterId}</strong><small>${escapeHtml(state.data.matters.find((m) => m.id === document.matterId)?.title || "Demo matter")}</small></span>${badge(document.status, document.status === "Filed" || document.status === "AI reviewed" ? "success" : "warning")}</button>`).join("")}</div><aside class="document-preview global-preview">${documentPreview(selected, context)}</aside></div></section>
  `;
}

export function renderWorkflows(context) {
  const { state, icon, escapeHtml, pageHeader } = context;
  return `
    ${pageHeader("Tasks & workflows", "Track stage gates, work queues, critical dates and human handoffs across the firm.", `<button class="button button-secondary" data-action="workflow-library">Workflow library</button><button class="button button-primary" data-action="new-task">${icon("plus", 16)}New task</button>`)}
    <section class="workflow-summary"><article class="panel"><small>Due today</small><strong>7</strong><span class="text-danger">2 critical</span></article><article class="panel"><small>Stage blockers</small><strong>11</strong><span>Across 9 matters</span></article><article class="panel"><small>Ready to advance</small><strong>8</strong><span class="tone-text-teal">Awaiting human review</span></article><article class="panel"><small>Automations this week</small><strong>146</strong><span>All simulated</span></article></section>
    <section class="panel workflow-board-panel"><div class="section-header"><div><p class="section-kicker">Firm caseload</p><h2>Active matter stages</h2></div><div class="board-filters"><button class="active" data-action="workflow-filter" data-type="All">All areas</button><button data-action="workflow-filter" data-type="Conveyancing">Conveyancing</button><button data-action="workflow-filter" data-type="Litigation">Litigation</button><button data-action="workflow-filter" data-type="Probate">Probate</button></div></div><div class="workflow-board">${state.data.workflowBoard.map((column) => `<section><header><strong>${escapeHtml(column.stage)}</strong><span>${column.count}</span></header>${column.matters.map((item, index) => `<article data-matter-type="${escapeHtml(state.data.matters.find((matter) => matter.id === item.id)?.type || "Other")}"><div><small>${index === 0 ? "Priority review" : "Active matter"}</small><strong>${escapeHtml(item.title)}</strong></div><span class="owner"><span class="avatar avatar-small">${["NK","FD","EW"][index]}</span></span><div class="mini-progress"><span style="width:${35 + index * 22}%"></span></div><button class="text-button" data-action="workflow-card" data-matter="${item.id}">Open matter${icon("chevron", 12)}</button></article>`).join("")}</section>`).join("")}</div></section>
    <div class="workflow-lower-grid"><section class="panel"><div class="section-header"><div><p class="section-kicker">Exception queue</p><h2>Controls blocking progress</h2></div><button class="text-button" data-action="review-blockers">Review all</button></div><div class="risk-list"><article><span class="risk-symbol risk-danger">!</span><div><strong>Alder Quay proof of address missing</strong><p>Exchange stage remains blocked · MAT-2026-0142</p></div><a class="button button-quiet" href="#/matters/MAT-2026-0142?tab=workflow">Review</a></article><article><span class="risk-symbol risk-warning">i</span><div><strong>Section 150 cost estimate review due</strong><p>Expected costs changed · MAT-2026-0119</p></div><button class="button button-quiet" data-action="workflow-card" data-matter="MAT-2026-0119">Review</button></article></div></section><section class="panel"><div class="section-header"><div><p class="section-kicker">My queue</p><h2>Next tasks</h2></div><span>${state.data.tasks.length} today</span></div><div class="checklist">${state.data.tasks.map((task) => `<button class="check-row" data-action="task" data-id="${task.id}"><span class="check-box"></span><span><strong>${escapeHtml(task.title)}</strong><small>${task.matter} · ${task.owner}</small></span><em>${escapeHtml(task.due)}</em>${icon("chevron", 13)}</button>`).join("")}</div></section></div>
  `;
}
