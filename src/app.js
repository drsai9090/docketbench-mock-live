import { cloneSeedData } from "./data.js";
import { CRO_TEST_SEARCHES, croAddress, formatCroDate, normaliseCroResults, validateCroQuery } from "./cro.js";
import { createFallbackDetail, renderDocumentsPage, renderIntake, renderMatterWorkspace, renderWorkflows } from "./legal-pages.js";
import { renderDataImport, sampleImportFile } from "./import-pages.js";
import { isTransferReadyInvoice, renderAccounts, renderClients, renderMatterLedger, renderMatterTime, renderReports, renderTimeBilling, transferRemaining } from "./operations-pages.js";
import { moveTourIndex, shouldStartTour, TOUR_STEPS, TOUR_STORAGE_KEY } from "./tour.js";

const STORAGE_KEY = "docketbench-mock-v6";
const iconPaths = {
  activity: '<path d="M3 12h4l2-7 4 14 2-7h6"/>',
  bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/>',
  briefcase: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18M10 12v2h4v-2"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/>',
  chevron: '<path d="m9 18 6-6-6-6"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  file: '<path d="M6 2h8l4 4v16H6z"/><path d="M14 2v5h5M9 13h6M9 17h6"/>',
  filter: '<path d="M4 5h16M7 12h10M10 19h4"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.6 9a2.5 2.5 0 1 1 3.9 2.1c-.9.6-1.5 1-1.5 2.4M12 17h.01"/>',
  inbox: '<path d="M4 4h16v14H4z"/><path d="M4 13h5l2 3h2l2-3h5"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
  sparkles: '<path d="m12 3 1.3 3.7L17 8l-3.7 1.3L12 13l-1.3-3.7L7 8l3.7-1.3zM5 14l.9 2.1L8 17l-2.1.9L5 20l-.9-2.1L2 17l2.1-.9zM19 14l.7 1.3L21 16l-1.3.7L19 18l-.7-1.3L17 16l1.3-.7z"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
  wallet: '<path d="M4 5h14a2 2 0 0 1 2 2v12H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h12"/><path d="M15 11h7v5h-7a2 2 0 0 1 0-5z"/>',
  x: '<path d="m6 6 12 12M18 6 6 18"/>',
};

const icon = (name, size = 18) => `<svg class="icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${iconPaths[name] || iconPaths.activity}</svg>`;
const escapeHtml = (value = "") => String(value).replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#039;", '"': "&quot;" }[char]));

function loadData() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return saved?.version === 6 && saved?.profile && Array.isArray(saved?.matters) ? saved : cloneSeedData();
  } catch {
    return cloneSeedData();
  }
}

function loadTourChoice() {
  try {
    return localStorage.getItem(TOUR_STORAGE_KEY);
  } catch {
    return null;
  }
}

const state = {
  data: loadData(),
  mobileNav: false,
  notificationsOpen: false,
  modal: null,
  matterQuery: "",
  matterType: "All types",
  selectedDocument: "DOC-101",
  selectedIntake: "INT-0841",
  importStage: "upload",
  importFileType: "csv",
  importFile: null,
  documentFolder: "all",
  workflowType: "All",
  draftMessage: "",
  accountLedger: "Client",
  selectedClient: "CL-201",
  timeView: "list",
  tour: { active: shouldStartTour(loadTourChoice()), index: 0 },
  cro: { query: "", results: [], loading: false, error: "", access: "test", fetchedAt: "" },
};
let workflowStudioCleanup = null;

const navItems = [
  { id: "dashboard", label: "Overview", icon: "grid" },
  { id: "matters", label: "Matters", icon: "briefcase", count: "128" },
  { id: "imports", label: "Data import", icon: "file" },
  { id: "intake", label: "Intake", icon: "inbox", count: "3" },
  { id: "documents", label: "Documents", icon: "file" },
  { id: "workflows", label: "Tasks & workflows", icon: "activity", count: "7" },
  { id: "workflow-studio", label: "AI workflow studio", icon: "sparkles" },
  { id: "time", label: "Time & billing", icon: "clock" },
  { id: "accounts", label: "Legal accounts", icon: "wallet", count: "2" },
  { id: "clients", label: "Clients & portal", icon: "users" },
  { id: "reports", label: "Reports", icon: "activity" },
  { id: "cro", label: "CRO lookup", icon: "search" },
];

function currentRoute() {
  const [path, query = ""] = location.hash.replace(/^#\/?/, "").split("?");
  return { page: path.split("/")[0] || "dashboard", id: path.split("/")[1], params: new URLSearchParams(query) };
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.data));
}

function formatElapsed(startedAt) {
  const elapsed = Math.max(0, Date.now() - Number(startedAt || Date.now()));
  const hours = Math.floor(elapsed / 3_600_000);
  const minutes = Math.floor((elapsed % 3_600_000) / 60_000);
  const seconds = Math.floor((elapsed % 60_000) / 1_000);
  return [hours, minutes, seconds].map((value) => String(value).padStart(2, "0")).join(":");
}

function updateTimerDisplay() {
  if (!state.data.timer?.running) return;
  const value = formatElapsed(state.data.timer.startedAt);
  document.querySelectorAll("#topbar-timer-clock, #page-timer-clock").forEach((clock) => { clock.textContent = value; });
}

function downloadCsv(filename, rows) {
  const content = rows.map((row) => row.map((cell) => `"${String(cell ?? "").replaceAll('"', '""')}"`).join(",")).join("\n");
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

function ensureMatterDetail(matterId) {
  const matter = state.data.matters.find((item) => item.id === matterId);
  if (!matter) return null;
  if (!state.data.matterDetails[matterId]) state.data.matterDetails[matterId] = createFallbackDetail(matter);
  return state.data.matterDetails[matterId];
}

function getTransferEligibility(matterId) {
  const client = state.data.clients.find((item) => item.matters.includes(matterId));
  if (!client) return null;
  for (const invoice of state.data.invoices.filter((item) => item.matterId === matterId && isTransferReadyInvoice(item))) {
    const remaining = transferRemaining(invoice, state.data.accounts.transferRequests);
    const available = Math.min(client.balance, remaining);
    if (available > 0) return { client, invoice, remaining, available };
  }
  return null;
}

function wordmark() {
  return `<div class="brand-lockup"><div class="wordmark"><span>PayPath</span><strong>IQ</strong></div><div class="product-name">DocketBench <span>Prototype</span></div></div>`;
}

function renderShell(content) {
  const route = currentRoute();
  const unread = state.data.notifications.filter((item) => item.unread).length;
  const croRoute = route.page === "cro";
  return `
    <div class="app-shell ${state.mobileNav ? "nav-open" : ""}">
      <aside class="sidebar" aria-label="Primary navigation">
        <div class="sidebar-top">
          ${wordmark()}
          <button class="icon-button close-nav" data-action="close-nav" aria-label="Close navigation">${icon("x")}</button>
        </div>
        <div class="firm-switcher">
          <span class="avatar avatar-firm">HB</span>
          <span><strong>Harcourt & Byrne</strong><small>Demo workspace</small></span>
          ${icon("chevron", 14)}
        </div>
        <nav class="nav-list">
          <p class="nav-label">Workspace</p>
          ${navItems.map((item) => `<a href="#/${item.id}" class="nav-item ${route.page === item.id ? "active" : ""}" aria-current="${route.page === item.id ? "page" : "false"}">${icon(item.icon)}<span>${item.label}</span>${item.count ? `<small>${item.count}</small>` : ""}</a>`).join("")}
        </nav>
        <div class="sidebar-footer">
          <div class="demo-notice ${croRoute ? "live-notice" : ""}"><span class="demo-dot"></span><div><strong>${croRoute ? "Live registry check" : "Safe demo mode"}</strong><small>${croRoute ? "Official CRO data · read only" : "Synthetic data · no live services"}</small></div></div>
          <button class="user-card" data-action="open-profile">
            <span class="avatar">${escapeHtml(state.data.profile.initials)}</span>
            <span><strong>${escapeHtml(state.data.profile.user)}</strong><small>${escapeHtml(state.data.profile.role)}</small></span>
            ${icon("chevron", 14)}
          </button>
        </div>
      </aside>
      <button class="nav-scrim" data-action="close-nav" aria-label="Close navigation"></button>
      <div class="workspace">
        <header class="topbar">
          <button class="icon-button mobile-menu" data-action="open-nav" aria-label="Open navigation">${icon("menu")}</button>
          <button class="global-search" data-action="open-search" data-tour="global-search" aria-label="Search matters, documents and clients">
            ${icon("search")}<span>Search matters, documents and clients</span><kbd>⌘ K</kbd>
          </button>
          <div class="topbar-actions">
            ${state.data.timer?.running ? `<button class="topbar-timer" data-action="open-running-timer"><span class="timer-pulse"></span><strong id="topbar-timer-clock">00:00:00</strong><small>${state.data.timer.matterId}</small></button>` : ""}
            <select class="role-select" data-action="change-role" aria-label="Preview dashboard role">
              ${["Partner", "Solicitor", "Legal secretary", "Accounts"].map((role) => `<option ${state.data.profile.role === role ? "selected" : ""}>${role}</option>`).join("")}
            </select>
            <button class="button button-secondary product-tour-button" data-action="start-tour" aria-label="Open product tour">${icon("help", 15)}<span>Product tour</span></button>
            <button class="icon-button notification-button" data-action="toggle-notifications" aria-label="Notifications, ${unread} unread">${icon("bell")}${unread ? `<span>${unread}</span>` : ""}</button>
            <button class="button button-primary" data-action="quick-add">${icon("plus", 16)}<span>Quick add</span></button>
          </div>
          ${state.notificationsOpen ? renderNotifications() : ""}
        </header>
        <main id="main-content" class="${route.page === "workflow-studio" ? "workflow-studio-main" : ""}" tabindex="-1">${content}</main>
      </div>
    </div>
  `;
}

function renderNotifications() {
  return `<section class="popover notifications" aria-label="Notifications"><div class="popover-header"><div><strong>Notifications</strong><small>${state.data.notifications.filter((item) => item.unread).length} unread</small></div><button class="text-button" data-action="mark-read">Mark all read</button></div><div class="notification-list">${state.data.notifications.map((item) => `<button class="notification-item ${item.unread ? "unread" : ""}" data-action="notification"><span class="notice-mark"></span><span><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.detail)}</small></span></button>`).join("")}</div></section>`;
}

function pageHeader(title, subtitle, actions = "") {
  return `<div class="page-header"><div><p class="eyebrow">Legal operations workspace</p><h1>${title}</h1><p>${subtitle}</p></div>${actions ? `<div class="page-actions">${actions}</div>` : ""}</div>`;
}

function badge(label, tone) {
  return `<span class="badge badge-${tone || label.toLowerCase().replaceAll(" ", "-")}"><span></span>${escapeHtml(label)}</span>`;
}

function renderDashboard() {
  const d = state.data;
  const greeting = new Intl.DateTimeFormat("en-IE", { weekday: "long", day: "numeric", month: "long" }).format(new Date(2026, 7, 24));
  return `
    ${pageHeader("Good morning, Niamh", `${greeting} · Here is what needs your attention.`, `<button class="button button-secondary" data-action="open-ai-brief">${icon("sparkles", 16)}AI morning brief</button><a class="button button-primary" href="#/matters" data-tour="first-action">Open matter list</a>`)}
    <section class="metric-grid" aria-label="Firm overview">
      ${d.metrics.map((metric) => `<button class="metric-card" data-action="metric" data-metric="${metric.id}"><span class="metric-icon tone-${metric.tone}">${icon(metric.icon)}</span><span class="metric-copy"><small>${metric.label}</small><strong>${metric.value}</strong><em class="tone-text-${metric.tone}">${metric.delta}</em></span>${icon("chevron", 16)}</button>`).join("")}
    </section>
    <div class="dashboard-grid">
      <section class="panel priority-panel">
        <div class="section-header" data-tour="dashboard-priorities"><div><p class="section-kicker">AI triage</p><h2>Priorities requiring review</h2></div><span class="ai-label">${icon("sparkles", 14)}Explainable suggestions</span></div>
        <div class="priority-list">
          ${d.priorities.map((item) => `<article class="priority-item"><span class="priority-mark priority-${item.tone}">${icon(item.tone === "danger" ? "calendar" : item.tone === "warning" ? "wallet" : "sparkles")}</span><div><p>${escapeHtml(item.kind)}</p><h3>${escapeHtml(item.title)}</h3><small>${escapeHtml(item.detail)}</small></div><button class="button button-quiet" data-action="priority" data-id="${item.id}">${item.action}${icon("chevron", 14)}</button></article>`).join("")}
        </div>
      </section>
      <section class="panel today-panel">
        <div class="section-header"><div><p class="section-kicker">Monday 24 August</p><h2>Today</h2></div><a href="#/workflows">View tasks</a></div>
        <div class="task-list">
          ${d.tasks.map((task) => `<button class="task-row" data-action="task" data-id="${task.id}"><span class="task-time">${task.due}</span><span class="task-line"></span><span class="task-copy"><strong>${escapeHtml(task.title)}</strong><small>${task.matter} · ${task.owner}</small></span>${badge(task.priority, task.priority.toLowerCase())}</button>`).join("")}
        </div>
      </section>
      <section class="panel pipeline-panel">
        <div class="section-header"><div><p class="section-kicker">128 open matters</p><h2>Matter pipeline</h2></div><a href="#/matters">Explore matters</a></div>
        <div class="pipeline-chart" aria-label="Matter pipeline by stage">
          ${d.pipeline.map((item) => `<div class="pipeline-row"><div><span>${item.label}</span><strong>${item.value}</strong></div><div class="progress-track"><span class="progress-${item.tone}" style="width:${Math.round(item.value / item.total * 100)}%"></span></div></div>`).join("")}
        </div>
        <div class="pipeline-note"><span class="tone-teal">${icon("sparkles", 16)}</span><p><strong>8 matters can advance</strong><small>Required tasks and documents appear complete. Human review is still required.</small></p><button class="button button-quiet" data-action="review-ready">Review</button></div>
      </section>
      <section class="panel recent-panel">
        <div class="section-header"><div><p class="section-kicker">Firm-wide</p><h2>Recent activity</h2></div><button class="text-button" data-action="show-activity">View audit trail</button></div>
        <div class="activity-list">
          ${d.activity.map((item) => `<div class="activity-row"><span class="activity-icon">${icon(item.icon, 16)}</span><div><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.detail)}</small></div><span><strong>${item.time}</strong><small>${escapeHtml(item.actor)}</small></span></div>`).join("")}
        </div>
      </section>
    </div>
  `;
}

function renderMatters() {
  const types = ["All types", ...new Set(state.data.matters.map((matter) => matter.type))];
  const query = state.matterQuery.toLowerCase();
  const matters = state.data.matters.filter((matter) => (state.matterType === "All types" || matter.type === state.matterType) && `${matter.id} ${matter.title} ${matter.client} ${matter.code}`.toLowerCase().includes(query));
  return `
    ${pageHeader("Matters", "A single view of case progress, ownership, deadlines and financial context.", `<button class="button button-secondary" data-action="export-matters">Export view</button><button class="button button-primary" data-action="new-matter">${icon("plus", 16)}New matter</button>`)}
    <section class="panel table-panel">
      <div class="table-toolbar" data-tour="matter-list">
        <label class="search-field">${icon("search", 16)}<span class="sr-only">Search matters</span><input type="search" data-action="matter-search" value="${escapeHtml(state.matterQuery)}" placeholder="Search reference, client or matter…" /></label>
        <label class="select-field">${icon("filter", 16)}<span class="sr-only">Filter by matter type</span><select data-action="matter-type">${types.map((type) => `<option ${type === state.matterType ? "selected" : ""}>${type}</option>`).join("")}</select></label>
        <div class="toolbar-spacer"></div><span class="result-count">${matters.length} spotlight matters · 128 total</span>
      </div>
      <div class="table-scroll">
        <table>
          <thead><tr><th>Matter</th><th>Stage</th><th>Owner</th><th>Next deadline</th><th>Status</th><th>Progress</th><th><span class="sr-only">Open</span></th></tr></thead>
          <tbody>${matters.length ? matters.map((matter) => `<tr class="clickable-row" data-action="open-matter" data-id="${matter.id}" tabindex="0"><td><div class="matter-cell"><span class="matter-type-icon">${matter.type.slice(0, 2).toUpperCase()}</span><span><strong>${escapeHtml(matter.title)}</strong><small>${matter.id} · ${escapeHtml(matter.code)}</small></span></div></td><td><strong>${escapeHtml(matter.stage)}</strong><small>${escapeHtml(matter.type)}</small></td><td><span class="owner"><span class="avatar avatar-small">${matter.ownerInitials}</span>${escapeHtml(matter.owner)}</span></td><td><strong class="${matter.risk === "High" ? "text-danger" : ""}">${escapeHtml(matter.nextDeadline)}</strong><small>Updated ${escapeHtml(matter.updated)}</small></td><td>${badge(matter.status, matter.status === "Attention" ? "danger" : matter.status === "On track" ? "success" : "warning")}</td><td><div class="table-progress"><span style="width:${matter.progress}%"></span></div><small>${matter.progress}% complete</small></td><td>${icon("chevron", 16)}</td></tr>`).join("") : `<tr><td colspan="7"><div class="empty-state">${icon("search", 24)}<h3>No matters found</h3><p>Try a different client, reference or practice area.</p><button class="button button-secondary" data-action="clear-matter-filters">Clear filters</button></div></td></tr>`}</tbody>
        </table>
      </div>
    </section>
  `;
}

function renderPlaceholder(page) {
  const item = navItems.find((entry) => entry.id === page);
  return `${pageHeader(item?.label || "Workspace", "This workspace is being added in the next prototype slice.")}<section class="panel placeholder-panel"><span class="metric-icon tone-navy">${icon(item?.icon || "activity", 22)}</span><h2>${item?.label || "Workspace"}</h2><p>The navigation is in place so the full end-to-end prototype keeps a stable information architecture while each operational workspace is delivered.</p><a class="button button-secondary" href="#/dashboard">Return to overview</a></section>`;
}

function renderWorkflowStudio() {
  return `<section class="workflow-studio-page"><div id="workflow-studio-root"></div></section>`;
}

function croStatusTone(status = "") {
  const value = status.trim().toLowerCase();
  if (value === "normal") return "success";
  if (value.includes("dissolved") || value.includes("strike")) return "danger";
  return "warning";
}

function renderCroLookup() {
  const { query, results, loading, error, access, fetchedAt } = state.cro;
  const accessLabel = access === "full" ? "Registered access" : "Test access";
  const fetchedLabel = fetchedAt ? new Intl.DateTimeFormat("en-IE", { hour: "2-digit", minute: "2-digit", second: "2-digit" }).format(new Date(fetchedAt)) : "Not checked yet";
  const resultsContent = loading
    ? `<div class="cro-loading" role="status"><span class="spinner"></span><div><strong>Checking CRO Open Services</strong><small>Searching the live Irish company register…</small></div></div>`
    : error
      ? `<div class="cro-message cro-error" role="alert"><span>!</span><div><strong>Search could not be completed</strong><p>${escapeHtml(error)}</p></div></div>`
      : results.length
        ? `<div class="cro-results-heading"><div><strong>${results.length} ${results.length === 1 ? "company" : "companies"} found</strong><small>Live response · checked ${escapeHtml(fetchedLabel)}</small></div><span class="badge badge-success"><span></span>CRO response received</span></div>
          <div class="table-scroll cro-table-scroll"><table class="cro-table"><thead><tr><th>Company</th><th>Status</th><th>Registered address</th><th>Company type</th><th>Registered</th></tr></thead><tbody>${results.map((company) => `<tr><td><div class="matter-cell"><span class="matter-type-icon">CRO</span><span><strong>${escapeHtml(company.company_name)}</strong><small>No. ${escapeHtml(company.company_num)} · ${company.company_bus_ind === "B" ? "Business name" : "Company"}</small></span></div></td><td>${badge(String(company.company_status_desc || "Not recorded").trim(), croStatusTone(company.company_status_desc))}</td><td class="cro-address">${escapeHtml(croAddress(company))}</td><td><strong>${escapeHtml(company.comp_type_desc || "Not recorded")}</strong><small>${company.place_of_business ? `Place of business: ${escapeHtml(company.place_of_business)}` : ""}</small></td><td><strong>${escapeHtml(formatCroDate(company.company_reg_date))}</strong><small>Next return: ${escapeHtml(formatCroDate(company.next_ar_date))}</small></td></tr>`).join("")}</tbody></table></div>`
        : query
          ? `<div class="empty-state">${icon("search", 24)}<h3>No matching companies</h3><p>CRO returned no company records for “${escapeHtml(query)}”. Try a shorter name or a CRO number.</p></div>`
          : `<div class="cro-welcome">${icon("search", 25)}<div><h3>Run a live registry check</h3><p>Search by company name or CRO number. The result will show the registered name, number, status, address, type and key dates returned by CRO.</p></div></div>`;

  return `
    ${pageHeader("CRO company lookup", "Check a company against live public data from Ireland’s Companies Registration Office.", `<a class="button button-secondary" href="https://services.cro.ie/" target="_blank" rel="noopener">CRO service information${icon("chevron", 14)}</a>`)}
    <div class="cro-layout" data-tour="cro-lookup">
      <section class="panel cro-main-panel">
        <div class="section-header"><div><p class="section-kicker">Live public registry</p><h2>Search CRO Open Services</h2></div><span class="cro-access ${access === "full" ? "is-full" : ""}"><span></span>${accessLabel}</span></div>
        <form class="cro-search-form" data-action="cro-search">
          <label><span>Company name or CRO number</span><div class="cro-input">${icon("search", 17)}<input name="name" type="search" minlength="2" maxlength="120" autocomplete="off" value="${escapeHtml(query)}" placeholder="e.g. Ryanair or 83740" required /></div></label>
          <button class="button button-primary" type="submit" ${loading ? "disabled" : ""}>${loading ? "Searching…" : "Search CRO"}</button>
        </form>
        ${access === "test" ? `<div class="cro-test-strip"><div><strong>Published CRO test access</strong><span>General names need registered API credentials. These permitted searches work now:</span></div><div>${CRO_TEST_SEARCHES.map((example) => `<button type="button" data-action="cro-example" data-query="${example}">${example}</button>`).join("")}</div></div>` : ""}
        <div class="cro-results" aria-live="polite">${resultsContent}</div>
      </section>
      <aside class="panel cro-info-panel">
        <div class="section-header"><div><p class="section-kicker">Connection</p><h2>What this checks</h2></div><span class="metric-icon tone-teal">${icon("activity", 18)}</span></div>
        <dl class="cro-facts">
          <div><dt>Data source</dt><dd>CRO Open Services</dd></div>
          <div><dt>Access</dt><dd>${accessLabel}</dd></div>
          <div><dt>Last checked</dt><dd>${escapeHtml(fetchedLabel)}</dd></div>
          <div><dt>Request path</dt><dd>Local server proxy</dd></div>
        </dl>
        <div class="cro-note"><strong>Read only</strong><p>The company name is sent to CRO when you select Search. API credentials remain on the local server and are never returned to the browser.</p></div>
        <div class="cro-note cro-note-neutral"><strong>Registry result, not legal advice</strong><p>Confirm critical information through the appropriate CRO record or filing before relying on it in a matter.</p></div>
      </aside>
    </div>`;
}

function renderPage() {
  const route = currentRoute();
  const context = { state, icon, escapeHtml, badge, pageHeader, renderMatterTime, renderMatterLedger };
  if (route.page === "dashboard") return renderDashboard();
  if (route.page === "matters") return route.id ? renderMatterWorkspace(context, route.id, route.params.get("tab") || "overview") : renderMatters();
  if (route.page === "imports") return renderDataImport(context);
  if (route.page === "intake") return renderIntake(context);
  if (route.page === "documents") return renderDocumentsPage(context);
  if (route.page === "workflows") return renderWorkflows(context);
  if (route.page === "workflow-studio") return renderWorkflowStudio();
  if (route.page === "time") return renderTimeBilling(context);
  if (route.page === "accounts") return renderAccounts(context);
  if (route.page === "clients") return renderClients(context);
  if (route.page === "reports") return renderReports(context);
  if (route.page === "cro") return renderCroLookup();
  return renderPlaceholder(route.page);
}

function renderModal() {
  if (!state.modal) return "";
  if (state.modal.type === "search") {
    return `<div class="modal-backdrop" data-action="close-modal"><section class="modal command-modal" role="dialog" aria-modal="true" aria-labelledby="search-title" data-modal-panel><div class="command-search">${icon("search")}<label><span id="search-title" class="sr-only">Global search</span><input autofocus data-action="global-query" placeholder="Search matters, documents and clients…" /></label><kbd>Esc</kbd></div><div class="command-results"><p class="nav-label">Suggested matters</p>${state.data.matters.slice(0, 4).map((matter) => `<button data-action="search-result" data-id="${matter.id}"><span class="matter-type-icon">${matter.type.slice(0, 2).toUpperCase()}</span><span><strong>${escapeHtml(matter.title)}</strong><small>${matter.id} · ${escapeHtml(matter.client)}</small></span><em>${matter.stage}</em></button>`).join("")}</div><div class="command-footer"><span><kbd>↑</kbd><kbd>↓</kbd> Navigate</span><span><kbd>↵</kbd> Open</span></div></section></div>`;
  }
  if (state.modal.type === "ai-matter") {
    const matter = state.data.matters.find((item) => item.id === state.modal.matterId) || state.data.matters[0];
    const detail = state.data.matterDetails[matter.id];
    return `<div class="modal-backdrop ai-backdrop" data-action="close-modal"><section class="modal ai-drawer" role="dialog" aria-modal="true" aria-labelledby="ai-title" data-modal-panel><div class="modal-header"><div><p class="section-kicker">Scoped to ${matter.id}</p><h2 id="ai-title">${icon("sparkles", 17)}Ask this matter</h2></div><button class="icon-button" data-action="close-modal" aria-label="Close AI panel">${icon("x")}</button></div><div class="ai-boundary">Suggestions use synthetic matter sources and require professional verification.</div><div class="prompt-chips"><button data-action="ai-question">What is blocking the next stage?</button><button data-action="ai-question">Build a concise chronology</button><button data-action="ai-question">What information is missing?</button></div><article class="ai-answer"><div><span class="ai-orb">${icon("sparkles", 17)}</span><span><strong>Current matter assessment</strong><small>Generated deterministically · ${detail?.confidence || 88}% confidence</small></span></div><p>${escapeHtml(detail?.overview || `Review the ${matter.stage} stage, next deadline and outstanding client instructions before taking action.`)}</p><ul>${(detail?.risks || []).slice(0,3).map((risk) => `<li><strong>${escapeHtml(risk.title)}</strong> — ${escapeHtml(risk.detail)}</li>`).join("")}</ul><div class="source-row"><button data-action="source-chip" data-source="Contract p.2">${icon("file", 12)}Contract p.2</button><button data-action="source-chip" data-source="Client email">${icon("mail", 12)}Client email</button><button data-action="source-chip" data-source="Workflow">${icon("activity", 12)}Workflow</button></div></article><form class="ai-prompt" data-action="ask-ai"><label><span class="sr-only">Ask a question about this matter</span><textarea name="question" rows="2" placeholder="Ask about facts, dates, documents or workflow…" required></textarea></label><button class="button button-primary" type="submit">Ask${icon("chevron", 14)}</button></form><div class="ai-footer"><span>${icon("activity", 13)}Prompt and output would be audited in production.</span><button class="button button-secondary" data-action="approve-ai" data-id="${matter.id}">Mark reviewed</button></div></section></div>`;
  }
  if (state.modal.type === "blocked") {
    const matter = state.data.matters.find((item) => item.id === state.modal.matterId);
    const blockers = state.data.matterDetails[matter?.id]?.workflow.blockers || [];
    return `<div class="modal-backdrop" data-action="close-modal"><section class="modal form-modal" role="dialog" aria-modal="true" aria-labelledby="blocked-title" data-modal-panel><div class="modal-header"><div><p class="section-kicker">Human-gated workflow</p><h2 id="blocked-title">Stage cannot advance yet</h2></div><button class="icon-button" data-action="close-modal" aria-label="Close dialog">${icon("x")}</button></div><div class="blocked-modal"><span class="risk-symbol risk-danger">!</span><p>Resolve the configured demo controls before requesting stage approval.</p><ul>${blockers.map((blocker) => `<li>${escapeHtml(blocker)}</li>`).join("")}</ul><div class="demo-callout"><strong>Important</strong><span>Removing a UI blocker is not proof of legal readiness.</span></div><div class="modal-actions"><button class="button button-secondary" data-action="close-modal">Close</button><button class="button button-primary" data-action="open-blocked-workflow" data-id="${matter?.id}">Open checklist</button></div></div></section></div>`;
  }
  if (state.modal.type === "bundle") {
    const docs = state.data.documents.filter((document) => !state.modal.matterId || document.matterId === state.modal.matterId);
    return `<div class="modal-backdrop" data-action="close-modal"><section class="modal form-modal bundle-modal" role="dialog" aria-modal="true" aria-labelledby="bundle-title" data-modal-panel><div class="modal-header"><div><p class="section-kicker">Document assembly</p><h2 id="bundle-title">Build a demo bundle</h2></div><button class="icon-button" data-action="close-modal" aria-label="Close dialog">${icon("x")}</button></div><form data-action="generate-bundle"><label>Bundle title<input name="title" value="Review bundle — 24 Aug 2026" required /></label><fieldset><legend>Select documents</legend>${docs.map((document, index) => `<label class="bundle-check"><input type="checkbox" name="documents" value="${document.id}" ${index < 3 ? "checked" : ""}/><span class="file-type">${document.type.slice(0,3).toUpperCase()}</span><span><strong>${escapeHtml(document.name)}</strong><small>${document.matterId} · ${document.pages} pages</small></span></label>`).join("")}</fieldset><div class="demo-callout"><strong>Demo only</strong><span>Generates a local bundle record, not a court-ready PDF.</span></div><div class="modal-actions"><button type="button" class="button button-secondary" data-action="close-modal">Cancel</button><button class="button button-primary" type="submit">Generate mock bundle</button></div></form></section></div>`;
  }
  if (state.modal.type === "upload") {
    return `<div class="modal-backdrop" data-action="close-modal"><section class="modal form-modal" role="dialog" aria-modal="true" aria-labelledby="upload-title" data-modal-panel><div class="modal-header"><div><p class="section-kicker">Synthetic file</p><h2 id="upload-title">Add a mock document</h2></div><button class="icon-button" data-action="close-modal" aria-label="Close dialog">${icon("x")}</button></div><form data-action="create-document"><label>Document name<input name="name" value="Proof of address — demo.pdf" required /></label><div class="form-grid"><label>Matter<select name="matter">${state.data.matters.map((matter) => `<option value="${matter.id}" ${state.modal.matterId === matter.id ? "selected" : ""}>${matter.id}</option>`).join("")}</select></label><label>Folder<select name="folder"><option>03 Compliance</option><option>01 Property</option><option>02 Correspondence</option><option>General</option></select></label></div><label>Simulated document content<textarea name="content" rows="4">PROOF OF ADDRESS\nSynthetic utility statement\nIssue date: 20 August 2026</textarea></label><div class="demo-callout"><strong>No upload</strong><span>No local or external file is transmitted. This only creates mock browser data.</span></div><div class="modal-actions"><button type="button" class="button button-secondary" data-action="close-modal">Cancel</button><button class="button button-primary" type="submit">Add mock document</button></div></form></section></div>`;
  }
  if (state.modal.type === "sample-import") {
    return `<div class="modal-backdrop" data-action="close-modal"><section class="modal form-modal" role="dialog" aria-modal="true" aria-labelledby="import-title" data-modal-panel><div class="modal-header"><div><p class="section-kicker">Deterministic intake demo</p><h2 id="import-title">Process sample CSV + emails</h2></div><button class="icon-button" data-action="close-modal" aria-label="Close dialog">${icon("x")}</button></div><div class="import-steps"><div class="complete"><span>✓</span><p><strong>Extract</strong><small>12 rows and 4 emails</small></p></div><div class="complete"><span>✓</span><p><strong>Match</strong><small>11 proposed matter links</small></p></div><div class="current"><span>3</span><p><strong>Validate</strong><small>1 discrepancy needs review</small></p></div></div><div class="blocked-modal"><p>The sample batch contains a synthetic €5,000 payment discrepancy and conflicting external case codes.</p><div class="demo-callout"><strong>Prototype only</strong><span>No file is uploaded and no external source is connected.</span></div><div class="modal-actions"><button class="button button-secondary" data-action="close-modal">Cancel</button><button class="button button-primary" data-action="run-import">Add to review queue</button></div></div></section></div>`;
  }
  if (state.modal.type === "timer") {
    const matterId = state.modal.matterId || state.data.timer.matterId || state.data.matters[0].id;
    return `<div class="modal-backdrop" data-action="close-modal"><section class="modal form-modal" role="dialog" aria-modal="true" aria-labelledby="timer-title" data-modal-panel><div class="modal-header"><div><p class="section-kicker">Browser-local timer</p><h2 id="timer-title">Start a demo timer</h2></div><button class="icon-button" data-action="close-modal" aria-label="Close dialog">${icon("x")}</button></div><form data-action="start-timer-form"><label>Matter<select name="matter">${state.data.matters.map((matter) => `<option value="${matter.id}" ${matter.id === matterId ? "selected" : ""}>${matter.id} · ${escapeHtml(matter.title)}</option>`).join("")}</select></label><label>Narrative<input name="narrative" required value="${escapeHtml(state.modal.narrative || "Review matter documents and next actions")}" /></label><div class="demo-callout"><strong>Demo timer</strong><span>Time is stored in this browser only and is not billable until reviewed.</span></div><div class="modal-actions"><button type="button" class="button button-secondary" data-action="close-modal">Cancel</button><button class="button button-primary" type="submit">Start timer</button></div></form></section></div>`;
  }
  if (state.modal.type === "time-entry") {
    const existing = state.data.timeEntries.find((entry) => entry.id === state.modal.entryId);
    const matterId = state.modal.matterId || existing?.matterId || state.data.matters[0].id;
    return `<div class="modal-backdrop" data-action="close-modal"><section class="modal form-modal" role="dialog" aria-modal="true" aria-labelledby="time-title" data-modal-panel><div class="modal-header"><div><p class="section-kicker">Review before posting</p><h2 id="time-title">${existing ? "Edit" : "Add"} a demo time entry</h2></div><button class="icon-button" data-action="close-modal" aria-label="Close dialog">${icon("x")}</button></div><form data-action="save-time"><input type="hidden" name="id" value="${existing?.id || ""}"/><label>Matter<select name="matter">${state.data.matters.map((matter) => `<option value="${matter.id}" ${matter.id === matterId ? "selected" : ""}>${matter.id} · ${escapeHtml(matter.title)}</option>`).join("")}</select></label><label>Narrative<input name="narrative" required value="${escapeHtml(existing?.narrative || state.modal.narrative || "")}" placeholder="Describe the work performed" /></label><div class="form-grid"><label>Hours<input name="hours" type="number" min="0.1" max="24" step="0.1" value="${existing?.hours || state.modal.hours || 0.5}" required /></label><label>Rate (€)<input name="rate" type="number" min="0" step="10" value="${existing?.rate || 320}" required /></label></div><label>Status<select name="status"><option ${existing?.status === "Draft" ? "selected" : ""}>Draft</option><option ${existing?.status === "Posted" ? "selected" : ""}>Posted</option>${existing?.status === "Billed" ? `<option selected>Billed</option>` : ""}</select></label><div class="demo-callout"><strong>Review gate</strong><span>Activity suggestions never become billable entries without a person saving them.</span></div><div class="modal-actions"><button type="button" class="button button-secondary" data-action="close-modal">Cancel</button><button class="button button-primary" type="submit">Save demo time</button></div></form></section></div>`;
  }
  if (state.modal.type === "invoice") {
    const invoice = state.data.invoices.find((item) => item.id === state.modal.invoiceId) || state.data.invoices[0];
    const approvable = ["Draft", "Partner approval"].includes(invoice.status);
    const noticeReady = ["Current", "Estimate reviewed"].includes(invoice.section150);
    const furnishable = invoice.status === "Approved" && noticeReady;
    const title = invoice.status === "Furnished" ? "Furnished bill record" : invoice.status === "Issued" ? "Issued bill record" : invoice.status === "Approved" ? "Approved draft bill" : "Review draft bill";
    const stateLabel = invoice.status === "Furnished" ? `Furnishing recorded ${escapeHtml(invoice.furnished || "in demo audit")}` : invoice.status === "Issued" ? `Recorded as issued ${escapeHtml(invoice.issued)}` : invoice.status === "Approved" ? "Internally approved, not furnished" : "Not approved or furnished";
    return `<div class="modal-backdrop" data-action="close-modal"><section class="modal form-modal invoice-modal" role="dialog" aria-modal="true" aria-labelledby="invoice-title" data-modal-panel><div class="modal-header"><div><p class="section-kicker">${invoice.id} · ${invoice.matterId}</p><h2 id="invoice-title">${title}</h2></div><button class="icon-button" data-action="close-modal" aria-label="Close dialog">${icon("x")}</button></div><div class="invoice-review"><div><span><small>Client</small><strong>${escapeHtml(invoice.client)}</strong></span><span><small>Demo Bill of Costs ref</small><strong>${escapeHtml(invoice.billRef)}</strong></span></div><dl><div><dt>Professional fees</dt><dd>${new Intl.NumberFormat("en-IE",{style:"currency",currency:"EUR"}).format(invoice.professional)}</dd></div><div><dt>Outlays</dt><dd>${new Intl.NumberFormat("en-IE",{style:"currency",currency:"EUR"}).format(invoice.outlays)}</dd></div><div><dt>VAT</dt><dd>${new Intl.NumberFormat("en-IE",{style:"currency",currency:"EUR"}).format(invoice.vat)}</dd></div><div><dt>Total</dt><dd>${new Intl.NumberFormat("en-IE",{style:"currency",currency:"EUR"}).format(invoice.total)}</dd></div></dl>${approvable ? `<label class="approval-check"><input type="checkbox" data-action="invoice-confirm"/><span>I have reviewed the narrative, outlays, VAT and cost-notice status.</span></label>` : ""}${furnishable ? `<label class="approval-check"><input type="checkbox" data-action="invoice-furnished-confirm"/><span>I confirm evidence that this written Bill of Costs was furnished to the synthetic client has been reviewed.</span></label>` : ""}${invoice.status === "Approved" && !noticeReady ? `<div class="form-error" role="alert">${icon("activity",14)}A current or reviewed cost-notice state is required before furnishing can be recorded.</div>` : ""}<div class="demo-callout"><strong>${stateLabel}</strong><span>${invoice.section150 === "Update due" ? "The seeded cost-notice status needs professional review. " : invoice.section150 === "Not recorded" ? "Cost-notice evidence is not recorded. " : ""}This control records a human attestation only; no document or message is sent.</span></div><div class="modal-actions"><button class="button button-secondary" data-action="close-modal">Close</button>${approvable ? `<button class="button button-primary" data-action="confirm-invoice" data-id="${invoice.id}" disabled>Approve demo bill</button>` : furnishable ? `<button class="button button-operational" data-action="confirm-invoice-furnished" data-id="${invoice.id}" disabled>Record furnished evidence</button>` : ""}</div></div></section></div>`;
  }
  if (state.modal.type === "new-invoice") {
    return `<div class="modal-backdrop" data-action="close-modal"><section class="modal form-modal" role="dialog" aria-modal="true" aria-labelledby="new-invoice-title" data-modal-panel><div class="modal-header"><div><p class="section-kicker">Draft only</p><h2 id="new-invoice-title">Create a demo bill</h2></div><button class="icon-button" data-action="close-modal" aria-label="Close dialog">${icon("x")}</button></div><form data-action="create-invoice"><label>Matter<select name="matter">${state.data.matters.map((matter) => `<option value="${matter.id}">${matter.id} · ${escapeHtml(matter.title)}</option>`).join("")}</select></label><div class="form-grid"><label>Professional fees (€)<input name="professional" type="number" min="0" value="3840" required/></label><label>Outlays (€)<input name="outlays" type="number" min="0" value="430" required/></label></div><label>Cost notice status<select name="costNotice"><option>Estimate reviewed</option><option>Update due</option><option>Not recorded</option></select></label><div class="demo-callout"><strong>Draft only</strong><span>VAT is calculated for display; professional review remains required.</span></div><div class="modal-actions"><button type="button" class="button button-secondary" data-action="close-modal">Cancel</button><button class="button button-primary" type="submit">Create draft bill</button></div></form></section></div>`;
  }
  if (state.modal.type === "transfer") {
    const eligibleMatters = state.data.matters.filter((matter) => getTransferEligibility(matter.id)?.available > 0);
    const matterId = eligibleMatters.some((matter) => matter.id === state.modal.matterId) ? state.modal.matterId : eligibleMatters[0]?.id;
    const eligibility = getTransferEligibility(matterId);
    const transferValue = Math.min(4860, eligibility?.available || 0);
    return `<div class="modal-backdrop" data-action="close-modal"><section class="modal form-modal transfer-modal" role="dialog" aria-modal="true" aria-labelledby="transfer-title" data-modal-panel><div class="modal-header"><div><p class="section-kicker">Client-to-office simulation</p><h2 id="transfer-title">Request a demo fee transfer</h2></div><button class="icon-button" data-action="close-modal" aria-label="Close dialog">${icon("x")}</button></div><form data-action="submit-transfer">${state.modal.error ? `<div class="form-error" role="alert">${icon("activity",14)}${escapeHtml(state.modal.error)}</div>` : ""}<label>Matter<select name="matter" data-action="transfer-matter">${state.data.matters.map((matter) => { const eligible = getTransferEligibility(matter.id)?.available > 0; return `<option value="${matter.id}" ${matter.id === matterId ? "selected" : ""} ${eligible ? "" : "disabled"}>${matter.id} · ${escapeHtml(matter.title)}${eligible ? "" : " · no furnished bill"}</option>`; }).join("")}</select></label><div class="available-funds"><span>Fee-eligible under ${eligibility?.invoice.id || "no furnished bill"}</span><strong>${new Intl.NumberFormat("en-IE",{style:"currency",currency:"EUR"}).format(eligibility?.available || 0)}</strong></div><div class="form-grid"><label>Amount (€)<input name="amount" type="number" min="0.01" max="${eligibility?.available || 0}" step="0.01" value="${transferValue}" required /></label><label>Reviewed Bill of Costs reference<input name="billRef" value="${escapeHtml(eligibility?.invoice.billRef || "")}" readonly required /></label></div><label class="approval-check"><input name="approved" type="checkbox"/><span>I confirm human approval and that the linked written fee notification evidence has been reviewed.</span></label><div class="demo-callout"><strong>Simulation only</strong><span>Eligibility is capped by the furnished demo bill and matter balance. No money moves, and no compliance conclusion is produced.</span></div><div class="modal-actions"><button type="button" class="button button-secondary" data-action="close-modal">Cancel</button><button class="button button-operational" type="submit" ${eligibility?.available ? "" : "disabled"}>Complete mock transfer</button></div></form></section></div>`;
  }
  if (state.modal.type === "reconciliation") {
    const recon = state.data.accounts.reconciliation;
    const unmatched = state.data.accounts.transactions.find((item) => item.reference === "DEMO-SEPA-8828");
    return `<div class="modal-backdrop" data-action="close-modal"><section class="modal form-modal" role="dialog" aria-modal="true" aria-labelledby="recon-title" data-modal-panel><div class="modal-header"><div><p class="section-kicker">Synthetic statement comparison</p><h2 id="recon-title">Review reconciliation difference</h2></div><button class="icon-button" data-action="close-modal" aria-label="Close dialog">${icon("x")}</button></div><div class="recon-modal"><div class="recon-difference"><span>Unmatched receipt</span><strong>${new Intl.NumberFormat("en-IE",{style:"currency",currency:"EUR"}).format(recon.difference)}</strong><small>${escapeHtml(unmatched?.reference || "Unmatched line")} · ${escapeHtml(recon.statementDate)}</small></div><p>AI suggests <strong>${escapeHtml(unmatched?.matterId || "no matter")}</strong> from the remitter text, but a human must confirm the matter and evidence.</p><label>Matter match<select id="recon-matter"><option value="">Select a matter…</option><option value="MAT-2026-0138">MAT-2026-0138 · Northstar Foods Ltd</option><option value="MAT-2026-0142">MAT-2026-0142 · Alder Quay</option></select></label><div class="demo-callout"><strong>Demo only</strong><span>There is no bank feed or accounting engine behind this comparison.</span></div><div class="modal-actions"><button class="button button-secondary" data-action="close-modal">Cancel</button><button class="button button-primary" data-action="confirm-reconciliation">Confirm demo match</button></div></div></section></div>`;
  }
  if (state.modal.type === "client-preview") {
    const client = state.data.clients.find((item) => item.id === state.modal.clientId) || state.data.clients[0];
    const matters = state.data.matters.filter((matter) => client.matters.includes(matter.id));
    const visibleRequests = client.requests.filter((request) => request.status !== "Draft");
    return `<div class="modal-backdrop client-preview-backdrop" data-action="close-modal"><section class="modal client-preview" role="dialog" aria-modal="true" aria-labelledby="client-preview-title" data-modal-panel><div class="client-preview-top"><div class="wordmark"><span>PayPath</span><strong>IQ</strong></div><span>Secure portal preview · Demo only</span><button class="icon-button" data-action="close-modal" aria-label="Close client preview">${icon("x")}</button></div><div class="client-preview-body"><p class="eyebrow">Welcome back</p><h2 id="client-preview-title">${escapeHtml(client.name)}</h2><p>This restricted view contains only synthetic, firm-approved status information.</p><div class="portal-status-card"><div><small>Your matter</small><strong>${escapeHtml(matters[0]?.title || "No active matter")}</strong><span>${matters[0]?.stage || "—"}</span></div><div><small>Next update</small><strong>${matters[0]?.nextDeadline || "Not scheduled"}</strong><span>Subject to solicitor confirmation</span></div></div><h3>Actions requested</h3><div class="portal-request-list">${visibleRequests.length ? visibleRequests.map((request) => `<button data-action="portal-request" data-id="${request.id}"><span class="check-box"></span><span><strong>${escapeHtml(request.title)}</strong><small>Due ${escapeHtml(request.due)} · ${escapeHtml(request.status)}</small></span>${icon("chevron",14)}</button>`).join("") : `<div class="empty-state"><p>No approved actions requested.</p></div>`}</div><div class="demo-callout"><strong>Preview boundary</strong><span>Draft firm requests stay hidden. No authentication, upload, e-signature or secure messaging is implemented.</span></div></div></section></div>`;
  }
  if (state.modal.type === "client-update") {
    const client = state.data.clients.find((item) => item.id === state.modal.clientId) || state.data.clients[0];
    return `<div class="modal-backdrop" data-action="close-modal"><section class="modal form-modal" role="dialog" aria-modal="true" aria-labelledby="update-title" data-modal-panel><div class="modal-header"><div><p class="section-kicker">Approved portal update</p><h2 id="update-title">Compose for ${escapeHtml(client.name)}</h2></div><button class="icon-button" data-action="close-modal" aria-label="Close dialog">${icon("x")}</button></div><form data-action="send-portal-update">${state.modal.error ? `<div class="form-error" role="alert">${icon("activity",14)}${escapeHtml(state.modal.error)}</div>` : ""}<input type="hidden" name="client" value="${client.id}"/><label>Message<textarea name="message" rows="5" required>${escapeHtml(state.modal.message || "The matter team has reviewed the latest information. We will confirm the next action after the remaining evidence has been checked.")}</textarea></label><label class="approval-check"><input name="approved" type="checkbox"/><span>I have reviewed this synthetic update for the client-visible portal.</span></label><div class="demo-callout"><strong>Mock send</strong><span>No email or portal message leaves this browser.</span></div><div class="modal-actions"><button type="button" class="button button-secondary" data-action="close-modal">Cancel</button><button class="button button-primary" type="submit">Send mock portal update</button></div></form></section></div>`;
  }
  if (state.modal.type === "new-client") {
    return `<div class="modal-backdrop" data-action="close-modal"><section class="modal form-modal" role="dialog" aria-modal="true" aria-labelledby="client-title" data-modal-panel><div class="modal-header"><div><p class="section-kicker">Synthetic contact</p><h2 id="client-title">Create a demo client</h2></div><button class="icon-button" data-action="close-modal" aria-label="Close dialog">${icon("x")}</button></div><form data-action="create-client"><label>Client name<input name="name" required placeholder="Sample Client name" /></label><div class="form-grid"><label>Type<select name="type"><option>Individual</option><option>Organisation</option><option>Estate</option></select></label><label>Portal status<select name="portal"><option>Not invited</option><option>Invited</option><option>Active</option></select></label></div><label>Demo email<input name="email" type="email" value="sample@example.invalid" required /></label><div class="demo-callout"><strong>Demo data</strong><span>Use synthetic information only. Nothing is transmitted.</span></div><div class="modal-actions"><button type="button" class="button button-secondary" data-action="close-modal">Cancel</button><button class="button button-primary" type="submit">Create demo client</button></div></form></section></div>`;
  }
  if (state.modal.type === "new-request") {
    const client = state.data.clients.find((item) => item.id === state.modal.clientId) || state.data.clients[0];
    return `<div class="modal-backdrop" data-action="close-modal"><section class="modal form-modal" role="dialog" aria-modal="true" aria-labelledby="request-title" data-modal-panel><div class="modal-header"><div><p class="section-kicker">Portal action · draft</p><h2 id="request-title">New request for ${escapeHtml(client.name)}</h2></div><button class="icon-button" data-action="close-modal" aria-label="Close dialog">${icon("x")}</button></div><form data-action="create-request"><input type="hidden" name="client" value="${client.id}"/><label>Requested action<input name="title" required placeholder="e.g. Review synthetic draft statement" /></label><label>Due date<input name="due" required value="28 Aug" /></label><div class="demo-callout"><strong>Draft request</strong><span>This adds a browser-local portal item. No client is notified.</span></div><div class="modal-actions"><button type="button" class="button button-secondary" data-action="close-modal">Cancel</button><button class="button button-primary" type="submit">Add mock request</button></div></form></section></div>`;
  }
  const isMatter = state.modal.type === "new-matter";
  const prefilledClient = state.data.clients.find((client) => client.id === state.modal.clientId)?.name || "";
  return `<div class="modal-backdrop" data-action="close-modal"><section class="modal form-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" data-modal-panel><div class="modal-header"><div><p class="section-kicker">${isMatter ? "Matter intake" : "Quick action"}</p><h2 id="modal-title">${isMatter ? "Create a demo matter" : "Add a task"}</h2></div><button class="icon-button" data-action="close-modal" aria-label="Close dialog">${icon("x")}</button></div><form data-action="${isMatter ? "create-matter" : "create-task"}"><label>${isMatter ? "Matter name" : "Task"}<input name="title" required placeholder="${isMatter ? "Client — matter description" : "What needs to be done?"}" /></label>${isMatter ? `<div class="form-grid"><label>Practice area<select name="type"><option>Conveyancing</option><option>Litigation</option><option>Corporate</option><option>Probate</option><option>Employment</option></select></label><label>Owner<select name="owner"><option>Niamh Kelly</option><option>Fionn Daly</option><option>Eimear Walsh</option><option>Ciarán Murphy</option></select></label></div><label>Client<input name="client" required value="${escapeHtml(prefilledClient)}" placeholder="Synthetic demo client" /></label>` : `<div class="form-grid"><label>Due time<input name="due" type="time" value="15:00" /></label><label>Matter<select name="matter">${state.data.matters.map((matter) => `<option value="${matter.id}">${matter.id}</option>`).join("")}</select></label></div>`}<div class="demo-callout"><strong>Demo only</strong><span>This creates browser-local synthetic data and does not open a real legal file.</span></div><div class="modal-actions"><button type="button" class="button button-secondary" data-action="close-modal">Cancel</button><button class="button button-primary" type="submit">${isMatter ? "Create demo matter" : "Add task"}</button></div></form></section></div>`;
}

function showToast(message, tone = "success") {
  const region = document.querySelector("#toast-region");
  region.innerHTML = `<div class="toast toast-${tone}" role="status"><span>${tone === "success" ? "✓" : "!"}</span><p>${escapeHtml(message)}</p><button aria-label="Dismiss notification" data-action="dismiss-toast">${icon("x", 14)}</button></div>`;
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => { region.innerHTML = ""; }, 4500);
}

let tourPositionFrame;

function setTourInert(active) {
  ["#app", "#modal-root"].forEach((selector) => {
    const region = document.querySelector(selector);
    if (region) region.inert = active;
  });
}

function rememberTour(choice) {
  try {
    localStorage.setItem(TOUR_STORAGE_KEY, choice);
  } catch {
    // The walkthrough still works when storage is unavailable.
  }
}

function centerTourCard(card, spotlight, showFallback = false) {
  spotlight.hidden = false;
  spotlight.classList.add("is-backdrop");
  Object.assign(spotlight.style, { left: "50%", top: "50%", width: "0", height: "0" });
  card.classList.add("is-centered");
  card.classList.remove("is-mobile");
  card.removeAttribute("style");
  const fallback = card.querySelector(".tour-fallback");
  if (fallback) fallback.hidden = !showFallback;
}

function positionTour(attempt = 0) {
  if (!state.tour.active) return;
  const step = TOUR_STEPS[state.tour.index];
  const card = document.querySelector(".tour-card");
  const spotlight = document.querySelector(".tour-spotlight");
  if (!card || !spotlight) return;
  if (!step.target) {
    centerTourCard(card, spotlight);
    return;
  }

  const target = document.querySelector(`[data-tour="${step.target}"]`);
  const rect = target?.getBoundingClientRect();
  if (!target || !rect || rect.width < 1 || rect.height < 1) {
    if (attempt < 4) setTimeout(() => positionTour(attempt + 1), 70);
    else centerTourCard(card, spotlight, true);
    return;
  }

  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const visible = rect.bottom > 72 && rect.top < viewportHeight - 12 && rect.right > 12 && rect.left < viewportWidth - 12;
  if (!visible && attempt < 2) {
    target.scrollIntoView({ block: "center", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    setTimeout(() => positionTour(attempt + 1), 220);
    return;
  }

  const margin = 8;
  const left = Math.max(margin, rect.left - 6);
  const top = Math.max(margin, rect.top - 6);
  const right = Math.min(viewportWidth - margin, rect.right + 6);
  const bottom = Math.min(viewportHeight - margin, rect.bottom + 6);
  Object.assign(spotlight.style, { left: `${left}px`, top: `${top}px`, width: `${Math.max(1, right - left)}px`, height: `${Math.max(1, bottom - top)}px` });
  spotlight.hidden = false;
  spotlight.classList.remove("is-backdrop");
  card.classList.remove("is-centered");
  const fallback = card.querySelector(".tour-fallback");
  if (fallback) fallback.hidden = true;

  if (viewportWidth <= 720) {
    card.classList.add("is-mobile");
    card.removeAttribute("style");
    return;
  }

  card.classList.remove("is-mobile");
  card.removeAttribute("style");
  const cardRect = card.getBoundingClientRect();
  const gap = 18;
  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
  const positions = {
    bottom: { top: bottom + gap, left: clamp((left + right - cardRect.width) / 2, 12, viewportWidth - cardRect.width - 12) },
    top: { top: top - cardRect.height - gap, left: clamp((left + right - cardRect.width) / 2, 12, viewportWidth - cardRect.width - 12) },
    right: { top: clamp((top + bottom - cardRect.height) / 2, 12, viewportHeight - cardRect.height - 12), left: right + gap },
    left: { top: clamp((top + bottom - cardRect.height) / 2, 12, viewportHeight - cardRect.height - 12), left: left - cardRect.width - gap },
  };
  const ordered = [...new Set([step.placement, "bottom", "top", "right", "left"].filter(Boolean))];
  const placement = ordered.map((name) => positions[name]).find((item) => item.top >= 12 && item.left >= 12 && item.top + cardRect.height <= viewportHeight - 12 && item.left + cardRect.width <= viewportWidth - 12)
    || { top: clamp((viewportHeight - cardRect.height) / 2, 12, viewportHeight - cardRect.height - 12), left: clamp((viewportWidth - cardRect.width) / 2, 12, viewportWidth - cardRect.width - 12) };
  card.style.top = `${placement.top}px`;
  card.style.left = `${placement.left}px`;
}

function renderTour() {
  const root = document.querySelector("#tour-root");
  if (!root) return;
  if (!state.tour.active) {
    root.innerHTML = "";
    setTourInert(false);
    return;
  }

  const step = TOUR_STEPS[state.tour.index];
  const last = state.tour.index === TOUR_STEPS.length - 1;
  const nextLabel = state.tour.index === 0 ? "Start tour" : last ? "Finish" : "Next";
  root.innerHTML = `
    <div class="tour-overlay">
      <div class="tour-spotlight" aria-hidden="true"></div>
      <section class="tour-card is-centered" role="dialog" aria-modal="true" aria-labelledby="tour-title" aria-describedby="tour-description">
        <div class="tour-card-top">
          <span>Interactive guide</span>
          <button class="icon-button" data-action="tour-close" aria-label="Close product tour">${icon("x", 16)}</button>
        </div>
        <div class="tour-progress" aria-hidden="true"><span style="width:${Math.round((state.tour.index + 1) / TOUR_STEPS.length * 100)}%"></span></div>
        <div class="tour-copy">
          <p>Step ${state.tour.index + 1} of ${TOUR_STEPS.length}</p>
          <h2 id="tour-title" tabindex="-1">${escapeHtml(step.title)}</h2>
          <p id="tour-description">${escapeHtml(step.body)}</p>
          <p class="tour-fallback" hidden>This area is not visible in the current layout. Continue to keep exploring.</p>
        </div>
        <div class="tour-actions">
          ${last ? "" : `<button class="text-button" data-action="tour-skip">Skip tour</button>`}
          <span></span>
          ${state.tour.index ? `<button class="button button-secondary" data-action="tour-back">Back</button>` : ""}
          <button class="button button-primary" data-action="tour-next">${nextLabel}</button>
        </div>
      </section>
    </div>`;
  setTourInert(true);
  requestAnimationFrame(() => {
    positionTour();
    document.querySelector("#tour-title")?.focus({ preventScroll: true });
  });
}

function showTourStep(index) {
  state.tour.index = Math.max(0, Math.min(TOUR_STEPS.length - 1, index));
  state.modal = null;
  state.mobileNav = false;
  state.notificationsOpen = false;
  const route = TOUR_STEPS[state.tour.index].route;
  if (location.hash !== route) location.hash = route;
  else render();
}

function startTour() {
  state.tour.active = true;
  showTourStep(0);
}

function dismissTour(choice) {
  rememberTour(choice);
  state.tour.active = false;
  renderTour();
  requestAnimationFrame(() => document.querySelector(choice === "finished" ? '[data-tour="first-action"]' : '[data-action="start-tour"]')?.focus());
}

function moveTour(direction) {
  if (direction > 0 && state.tour.index === TOUR_STEPS.length - 1) {
    dismissTour("finished");
    return;
  }
  showTourStep(moveTourIndex(state.tour.index, direction));
}

function trapTourFocus(event) {
  const root = document.querySelector("#tour-root");
  const focusable = [...(root?.querySelectorAll("button:not([disabled])") || [])];
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable.at(-1);
  if (event.shiftKey && (document.activeElement === first || !root.contains(document.activeElement))) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

function scheduleTourPosition() {
  if (!state.tour.active) return;
  cancelAnimationFrame(tourPositionFrame);
  tourPositionFrame = requestAnimationFrame(() => positionTour(4));
}

function render() {
  workflowStudioCleanup?.();
  workflowStudioCleanup = null;
  document.querySelector("#app").innerHTML = renderShell(renderPage());
  document.querySelector("#modal-root").innerHTML = renderModal();
  const workflowTarget = document.querySelector("#workflow-studio-root");
  if (workflowTarget) {
    import("../dist/workflow-studio.js")
      .then(({ mountWorkflowStudio }) => {
        if (workflowTarget.isConnected) workflowStudioCleanup = mountWorkflowStudio(workflowTarget);
      })
      .catch(() => {
        if (workflowTarget.isConnected) workflowTarget.innerHTML = '<div class="form-error" role="alert">The workflow studio bundle could not be loaded. Run npm run build.</div>';
      });
  }
  if (state.draftMessage) {
    const composer = document.querySelector('.composer textarea[name="message"]');
    if (composer) composer.value = state.draftMessage;
  }
  document.querySelectorAll(".board-filters [data-action='workflow-filter']").forEach((button) => button.classList.toggle("active", button.dataset.type === state.workflowType));
  document.querySelectorAll(".workflow-board article[data-matter-type]").forEach((card) => { card.hidden = state.workflowType !== "All" && card.dataset.matterType !== state.workflowType; });
  if (state.modal?.type === "ai-matter" && state.modal.matterId !== "MAT-2026-0142") {
    const sources = document.querySelector(".ai-drawer .source-row");
    if (sources) sources.innerHTML = `<button data-action="source-chip" data-source="Matter card">${icon("briefcase", 12)}Matter card</button><button data-action="source-chip" data-source="Workflow">${icon("activity", 12)}Workflow</button><button data-action="source-chip" data-source="Matter activity">${icon("clock", 12)}Matter activity</button>`;
  }
  if (state.modal?.type === "sample-import") {
    const importButton = document.querySelector("[data-action='run-import']");
    if (importButton) importButton.textContent = "Open flagged batch";
  }
  const previewName = document.querySelector(".doc-preview-header strong")?.textContent;
  const previewDocument = state.data.documents.find((item) => item.name === previewName);
  if (previewDocument?.status === "AI reviewed") {
    const reviewLabel = document.querySelector(".extraction-panel > div:first-child strong");
    const reviewButton = document.querySelector(".extraction-panel [data-action='approve-extraction']");
    if (reviewLabel) { reviewLabel.textContent = "Reviewed"; reviewLabel.style.color = "var(--success)"; }
    if (reviewButton) { reviewButton.textContent = "Extraction reviewed"; reviewButton.disabled = true; }
  }
  const selectedIntake = state.data.intake.find((item) => item.id === state.selectedIntake);
  const unmatchedLink = document.querySelector('.cross-check-card a[href="#/matters/Unmatched"]');
  if (unmatchedLink) { unmatchedLink.href = "#/intake"; unmatchedLink.textContent = "Unmatched — manual review"; unmatchedLink.setAttribute("aria-disabled", "true"); }
  if (selectedIntake?.status === "Filed") {
    const confirmButton = document.querySelector(".intake-actions [data-action='accept-intake']");
    if (confirmButton) { confirmButton.textContent = "Filed to matter"; confirmButton.disabled = true; }
    const selectedBadge = document.querySelector(".intake-item.selected .badge");
    if (selectedBadge) { selectedBadge.className = "badge badge-success"; }
  }
  if (state.modal) setTimeout(() => document.querySelector("[autofocus], [data-modal-panel] input")?.focus(), 0);
  renderTour();
}

function closeModal() {
  state.modal = null;
  render();
}

function handleAction(action, element) {
  if (action === "start-tour") return startTour();
  if (action === "tour-next") return moveTour(1);
  if (action === "tour-back") return moveTour(-1);
  if (action === "tour-skip") return dismissTour("skipped");
  if (action === "tour-close") return dismissTour("closed");
  if (action === "open-nav") state.mobileNav = true;
  if (action === "close-nav") state.mobileNav = false;
  if (action === "toggle-notifications") state.notificationsOpen = !state.notificationsOpen;
  if (action === "mark-read") { state.data.notifications.forEach((item) => { item.unread = false; }); saveData(); showToast("All notifications marked as read"); }
  if (["open-search"].includes(action)) state.modal = { type: "search" };
  if (action === "quick-add") state.modal = { type: "task" };
  if (action === "new-matter") state.modal = { type: "new-matter", clientId: currentRoute().page === "clients" ? state.selectedClient : undefined };
  if (action === "close-modal") closeModal();
  if (action === "dismiss-toast") document.querySelector("#toast-region").innerHTML = "";
  if (action === "cro-example") {
    state.cro.query = element.dataset.query || "Ryanair";
    render();
    setTimeout(() => document.querySelector('form[data-action="cro-search"]')?.requestSubmit(), 0);
  }
  if (action === "open-matter" || action === "search-result") { state.modal = null; location.hash = `#/matters/${element.dataset.id}`; }
  if (action === "priority") {
    const item = state.data.priorities.find((entry) => entry.id === element.dataset.id);
    location.hash = item?.matterId ? `#/matters/${item.matterId}` : item?.kind.includes("Accounts") ? "#/accounts" : "#/intake";
  }
  if (action === "metric") location.hash = element.dataset.metric === "deadlines" ? "#/workflows" : element.dataset.metric === "client-funds" ? "#/accounts" : "#/matters";
  if (action === "task") { const task = state.data.tasks.find((item) => item.id === element.dataset.id); location.hash = `#/matters/${task.matter}`; }
  if (action === "clear-matter-filters") { state.matterQuery = ""; state.matterType = "All types"; }
  if (action === "open-ai-brief") state.modal = { type: "ai-matter", matterId: "MAT-2026-0142" };
  if (action === "review-ready") location.hash = "#/workflows";
  if (action === "show-activity") location.hash = "#/matters/MAT-2026-0142?tab=audit";
  if (["open-profile", "notification"].includes(action)) showToast("Prototype control — no external account or notification service is connected", "info");
  if (action === "open-ai-matter") state.modal = { type: "ai-matter", matterId: element.dataset.id };
  if (action === "matter-next" || action === "review-risk") {
    const matterId = element.dataset.id || currentRoute().id;
    location.hash = `#/matters/${matterId}?tab=workflow`;
  }
  if (action === "matter-time") location.hash = `#/matters/${element.dataset.id}?tab=time`;
  if (action === "select-doc") state.selectedDocument = element.dataset.id;
  if (action === "select-intake") state.selectedIntake = element.dataset.id;
  if (action === "use-import-sample") state.importFile = sampleImportFile();
  if (action === "clear-import-file") state.importFile = null;
  if (action === "import-back") state.importStage = "upload";
  if (action === "restart-import") { state.importStage = "upload"; state.importFile = null; }
  if (action === "auto-map-import") showToast("Fields restored to the suggested DocketBench mapping", "info");
  if (action === "import-continue" && state.importStage === "upload" && state.importFile) state.importStage = state.importFileType === "csv" ? "mapping" : "processing";
  else if (action === "import-continue" && state.importStage === "mapping") state.importStage = "processing";
  if (state.importStage === "processing" && ["import-continue"].includes(action)) {
    setTimeout(() => {
      if (state.importStage !== "processing") return;
      state.importStage = "review";
      render();
      showToast("Mock import complete · 2 items need review");
    }, 1100);
  }
  if (action === "sample-import") state.modal = { type: "sample-import" };
  if (action === "run-import") {
    state.selectedIntake = "INT-0841";
    const batch = state.data.intake.find((item) => item.id === "INT-0841");
    batch.status = "Review needed";
    batch.received = "Just now";
    batch.issue = "Sample batch reopened: a €5,000 payment and conflicting external case codes require human review.";
    saveData();
    closeModal();
    showToast("Sample batch added to the review queue");
  }
  if (action === "accept-intake") {
    const item = state.data.intake.find((entry) => entry.id === element.dataset.id);
    if (item?.status === "Filed") { showToast(`${item.id} is already filed`, "info"); }
    else if (item) {
      item.status = "Filed";
      state.data.activity.unshift({ id: `ACT-${Date.now()}`, icon: "inbox", title: "Instructions confirmed and filed", detail: `${item.id} · ${item.proposedMatter}`, time: "Just now", actor: state.data.profile.user });
      saveData();
      showToast(`${item.id} filed to ${item.proposedMatter}`);
    }
  }
  if (action === "manual-intake") {
    const item = state.data.intake.find((entry) => entry.id === element.dataset.id);
    if (item) { item.status = "Manual review"; saveData(); showToast(`${item.id} moved to manual review`, "info"); }
  }
  if (action === "source-chip") {
    const source = element.dataset.source || "matter source";
    const route = currentRoute();
    const intakeMatter = route.page === "intake" ? state.data.intake.find((item) => item.id === state.selectedIntake)?.proposedMatter : null;
    const matterId = element.dataset.matter || state.modal?.matterId || route.id || intakeMatter;
    const scopedDocuments = state.data.documents.filter((item) => item.matterId === matterId);
    const document = element.dataset.document || (source.toLowerCase().includes("contract") ? scopedDocuments.find((item) => item.name.toLowerCase().includes("contract"))?.id : source.toLowerCase().includes("email") ? scopedDocuments.find((item) => item.type === "Email")?.id : null);
    if (document && matterId) { state.selectedDocument = document; state.modal = null; location.hash = `#/matters/${matterId}?tab=documents`; }
    else showToast(`Source opened: ${source}`, "info");
  }
  if (action === "refresh-brief") showToast("Matter brief refreshed from 7 synthetic sources");
  if (action === "approve-brief" || action === "approve-ai") {
    const matterId = element.dataset.id || currentRoute().id || "MAT-2026-0142";
    ensureMatterDetail(matterId)?.audit.unshift({ time: "Just now", actor: state.data.profile.user, action: "AI output marked reviewed", detail: "Human review recorded in demo audit trail" });
    saveData();
    if (action === "approve-ai") closeModal();
    showToast("Human review recorded in the demo audit trail");
  }
  if (action === "ai-question") showToast(`Suggested prompt selected: ${element.textContent.trim()}`, "info");
  if (action === "toggle-check") {
    const detail = ensureMatterDetail(element.dataset.matter);
    const check = detail?.workflow.checks.find((item) => item.id === element.dataset.id);
    if (check) {
      check.done = !check.done;
      const blockerByCheck = { "WF-3": "Proof of address is missing", "WF-4": "Source-of-funds evidence needs review", "WF-5": "Requisitions 14 and 22 are unanswered", "WF-6": "Written authority to exchange is missing" };
      const blocker = blockerByCheck[check.id];
      if (blocker && check.done) detail.workflow.blockers = detail.workflow.blockers.filter((item) => item !== blocker);
      if (blocker && !check.done && !detail.workflow.blockers.includes(blocker)) detail.workflow.blockers.push(blocker);
      saveData();
      showToast(`${check.title} marked ${check.done ? "complete" : "open"}`);
    }
  }
  if (action === "advance-workflow") {
    const detail = ensureMatterDetail(element.dataset.id);
    const matter = state.data.matters.find((item) => item.id === element.dataset.id);
    if (detail?.workflow.blockers.length) state.modal = { type: "blocked", matterId: matter.id };
    else if (detail && matter) {
      detail.workflow.current = Math.min(detail.workflow.current + 1, detail.workflow.stages.length - 1);
      matter.stage = detail.workflow.stages[detail.workflow.current];
      matter.progress = Math.min(100, matter.progress + 14);
      detail.audit.unshift({ time: "Just now", actor: state.data.profile.user, action: `Stage advanced to ${matter.stage}`, detail: "Human approval recorded in demo workflow" });
      saveData();
      showToast(`${matter.id} advanced to ${matter.stage}`);
    }
  }
  if (action === "open-blocked-workflow") { closeModal(); location.hash = `#/matters/${element.dataset.id}?tab=workflow`; }
  if (action === "review-blockers") location.hash = "#/matters/MAT-2026-0142?tab=workflow";
  if (action === "build-bundle") state.modal = { type: "bundle", matterId: element.dataset.matter };
  if (action === "mock-upload") state.modal = { type: "upload", matterId: element.dataset.matter };
  if (action === "approve-extraction") {
    const document = state.data.documents.find((item) => item.id === element.dataset.id);
    if (document) {
      document.status = "AI reviewed";
      ensureMatterDetail(document.matterId)?.audit.unshift({ time: "Just now", actor: state.data.profile.user, action: "Document extraction reviewed", detail: document.name });
      saveData();
      showToast(`${document.name} extraction marked reviewed`);
    }
  }
  if (action === "draft-reply") {
    state.draftMessage = "Thank you for the update. Before we can confirm the proposed closing date, please upload the outstanding proof of address and confirm the €5,000 payment reference. We will then review the remaining title replies and update you.";
    showToast("AI draft inserted for human review", "info");
  }
  if (action === "insert-template") {
    state.draftMessage = "Dear client,\n\nPlease find the latest matter update below.\n\nKind regards,\nHarcourt & Byrne — Demo Firm";
  }
  if (action === "attach-mock") showToast("Mock attachment picker opened — no file was transmitted", "info");
  if (action === "new-message") { state.draftMessage = ""; setTimeout(() => document.querySelector(".composer textarea")?.focus(), 0); }
  if (action === "new-task") state.modal = { type: "task" };
  if (action === "workflow-card") location.hash = `#/matters/${element.dataset.matter || "MAT-2026-0142"}`;
  if (action === "workflow-filter") state.workflowType = element.dataset.type;
  if (action === "start-timer") state.modal = { type: "timer", matterId: element.dataset.matter || currentRoute().id };
  if (action === "open-running-timer") location.hash = "#/time";
  if (action === "stop-timer" && state.data.timer.running) {
    const timer = { ...state.data.timer };
    const hours = Math.max(0.1, Math.round(((Date.now() - Number(timer.startedAt)) / 3_600_000) * 10) / 10);
    state.data.timer = { running: false, startedAt: null, matterId: timer.matterId, narrative: "" };
    state.modal = { type: "time-entry", matterId: timer.matterId, narrative: timer.narrative, hours, source: "Timer" };
    saveData();
  }
  if (action === "new-time") state.modal = { type: "time-entry", matterId: element.dataset.matter || currentRoute().id };
  if (action === "edit-time") {
    const entry = state.data.timeEntries.find((item) => item.id === element.dataset.id);
    if (entry?.status === "Billed") showToast("Billed demo entries are read-only", "info");
    else state.modal = { type: "time-entry", entryId: element.dataset.id };
  }
  if (action === "convert-time") {
    const suggestion = state.data.timeSuggestions.find((item) => item.id === element.dataset.id);
    if (suggestion?.status === "Suggested") state.modal = { type: "time-entry", matterId: suggestion.matterId, narrative: suggestion.activity, hours: suggestion.duration, source: "Activity suggestion", suggestionId: suggestion.id };
  }
  if (action === "submit-time") {
    const drafts = state.data.timeEntries.filter((entry) => entry.status === "Draft");
    drafts.forEach((entry) => { entry.status = "Posted"; });
    if (drafts.length) { saveData(); showToast(`${drafts.length} demo time ${drafts.length === 1 ? "entry" : "entries"} submitted`); }
    else showToast("No draft time is waiting for submission", "info");
  }
  if (action === "time-view") state.timeView = element.dataset.view || "list";
  if (action === "new-invoice") state.modal = { type: "new-invoice" };
  if (action === "approve-invoice" || action === "invoice-detail") state.modal = { type: "invoice", invoiceId: element.dataset.id };
  if (action === "confirm-invoice") {
    const invoice = state.data.invoices.find((item) => item.id === element.dataset.id);
    if (invoice) {
      invoice.status = "Approved";
      ensureMatterDetail(invoice.matterId)?.audit.unshift({ time: "Just now", actor: state.data.profile.user, action: "Draft bill approved", detail: `${invoice.id} remains unissued in demo mode` });
      saveData(); closeModal(); showToast(`${invoice.id} approved in demo state — nothing was issued`);
    }
  }
  if (action === "confirm-invoice-furnished") {
    const invoice = state.data.invoices.find((item) => item.id === element.dataset.id);
    if (invoice?.status === "Approved" && ["Current", "Estimate reviewed"].includes(invoice.section150)) {
      invoice.status = "Furnished";
      invoice.furnished = "24 Aug 2026 · demo evidence";
      ensureMatterDetail(invoice.matterId)?.audit.unshift({ time: "Just now", actor: state.data.profile.user, action: "Written Bill of Costs furnishing recorded", detail: `${invoice.billRef} · human attestation; no external send` });
      saveData(); closeModal(); showToast(`${invoice.billRef} furnishing evidence recorded — no document was sent`);
    }
  }
  if (action === "account-ledger") state.accountLedger = element.dataset.ledger || "Client";
  if (action === "new-transfer") {
    const requestedMatter = element.dataset.matter || currentRoute().id;
    const matterId = requestedMatter || state.data.matters.find((matter) => getTransferEligibility(matter.id)?.available > 0)?.id;
    if (getTransferEligibility(matterId)?.available > 0) state.modal = { type: "transfer", matterId };
    else showToast("Record furnished-bill evidence with a current cost-notice state before requesting a transfer", "info");
  }
  if (action === "reconciliation") {
    if (state.data.accounts.reconciliation.difference === 0) showToast("The synthetic statement is reconciled", "info");
    else state.modal = { type: "reconciliation" };
  }
  if (action === "confirm-reconciliation") {
    const matterId = document.querySelector("#recon-matter")?.value;
    if (!matterId) showToast("Choose a matter before confirming the synthetic match", "info");
    else {
      const recon = state.data.accounts.reconciliation;
      recon.ledgerBalance = recon.statementBalance;
      recon.difference = 0;
      recon.matched += recon.pending;
      recon.pending = 0;
      recon.status = "Reconciled";
      state.data.accounts.balances.unreconciled = 0;
      const transaction = state.data.accounts.transactions.find((item) => item.reference === "DEMO-SEPA-8828");
      if (transaction) {
        const client = state.data.clients.find((item) => item.matters.includes(matterId));
        if (client) {
          client.balance = Math.round((client.balance + transaction.credit) * 100) / 100;
          transaction.matterBalance = client.balance;
        }
        transaction.matterId = matterId;
        transaction.status = "Matched";
      }
      const exception = state.data.accounts.exceptions.find((item) => item.id === "EXC-74");
      if (exception) exception.status = "Resolved";
      saveData(); closeModal(); showToast(`Synthetic statement line matched to ${matterId}`);
    }
  }
  if (action === "transaction-detail") {
    const entry = state.data.accounts.transactions.find((item) => item.id === element.dataset.id);
    if (entry) showToast(`${entry.id}: ${entry.description} · ${entry.status}`, "info");
  }
  if (action === "transfer-detail") {
    const request = state.data.accounts.transferRequests.find((item) => item.id === element.dataset.id);
    if (request?.status === "Blocked") { location.hash = "#/time"; showToast(`${request.id} needs furnished-bill evidence and a reviewed Bill of Costs reference`, "info"); }
    else if (request) showToast(`${request.id}: ${request.reason} · ${request.status}`, "success");
  }
  if (action === "exception-detail") {
    const exception = state.data.accounts.exceptions.find((item) => item.id === element.dataset.id);
    if (exception) showToast(`${exception.rule}: ${exception.detail}`, "info");
  }
  if (action === "export-ledger") {
    const entries = state.data.accounts.transactions.filter((entry) => entry.ledger === state.accountLedger);
    downloadCsv(`docketbench-${state.accountLedger.toLowerCase()}-ledger-demo.csv`, [["Ledger", "Date", "Reference", "Matter", "Description", "Debit", "Credit", "Balance", "Status"], ...entries.map((entry) => [entry.ledger, entry.date, entry.reference, entry.matterId, entry.description, entry.debit, entry.credit, entry.balance, entry.status])]);
    showToast("Synthetic ledger exported");
  }
  if (action === "select-client") state.selectedClient = element.dataset.id;
  if (action === "new-client") state.modal = { type: "new-client" };
  if (action === "client-portal-preview") state.modal = { type: "client-preview", clientId: element.dataset.client || state.selectedClient };
  if (action === "client-update") state.modal = { type: "client-update", clientId: element.dataset.client || state.selectedClient };
  if (action === "new-request") state.modal = { type: "new-request", clientId: element.dataset.client || state.selectedClient };
  if (action === "request-detail" || action === "portal-request") {
    const request = state.data.clients.flatMap((client) => client.requests).find((item) => item.id === element.dataset.id);
    if (request) showToast(`${request.title} · ${request.status} · due ${request.due}`, "info");
  }
  if (action === "client-filter") showToast("Spotlight records already show portal status and matter count", "info");
  if (action === "report-drill") showToast(`${element.dataset.filter} receivables drill-down opened in demo mode`, "info");
  if (action === "practice-drill") { state.matterType = element.dataset.type; location.hash = "#/matters"; }
  if (action === "report-sort") {
    state.data.reports.practiceAreas.sort((a, b) => b.wip - a.wip);
    saveData(); showToast("Practice areas sorted by unbilled WIP");
  }
  if (action === "integration-detail") showToast("Integration map only — no external service is connected", "info");
  if (action === "export-report") {
    downloadCsv("docketbench-practice-report-demo.csv", [["Practice area", "Matters", "WIP", "Billed", "Recovery"], ...state.data.reports.practiceAreas.map((area) => [area.name, area.matters, area.wip, area.billed, `${area.recovery}%`])]);
    showToast("Synthetic practice report exported");
  }
  if (["intake-rules", "workflow-library", "document-menu", "add-date", "add-party", "party-detail", "audit-detail"].includes(action)) showToast("Interactive prototype control — detailed configuration is not connected", "info");
  if (action === "copy-code") {
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(element.dataset.code).then(() => showToast(`${element.dataset.code} copied`, "info")).catch(() => showToast("Copy is unavailable in this browser", "info"));
    else showToast("Copy is unavailable in this browser", "info");
  }
  if (action === "folder-filter") {
    state.documentFolder = element.dataset.folder;
    const visible = state.data.documents.find((document) => document.matterId === currentRoute().id && (state.documentFolder === "all" || document.folder === state.documentFolder));
    if (visible) state.selectedDocument = visible.id;
  }
  if (action === "export-matters") {
    const rows = [["Reference", "Matter", "Type", "Stage", "Owner", "Deadline"], ...state.data.matters.map((m) => [m.id, m.title, m.type, m.stage, m.owner, m.nextDeadline])];
    downloadCsv("docketbench-matters-demo.csv", rows); showToast("Demo matter view exported");
  }
  if (!(["close-modal"].includes(action))) render();
}

document.addEventListener("click", (event) => {
  const thread = event.target.closest(".thread");
  if (thread) {
    event.preventDefault();
    document.querySelectorAll(".thread").forEach((item) => item.classList.toggle("active", item === thread));
    if (!thread.textContent.includes(state.data.matters.find((matter) => matter.id === currentRoute().id)?.client || "")) showToast("Only the client thread has a seeded conversation in this prototype", "info");
    return;
  }
  const target = event.target.closest("[data-action]");
  if (!target) return;
  if (target.tagName === "FORM") return;
  if (target.matches("input, select, textarea, option")) return;
  if (target.matches(".modal-backdrop") && event.target !== target) return;
  const action = target.dataset.action;
  if (target.tagName === "BUTTON" || action) event.preventDefault();
  handleAction(action, target);
});

document.addEventListener("input", (event) => {
  if (event.target.dataset.action === "matter-search") { state.matterQuery = event.target.value; render(); document.querySelector('[data-action="matter-search"]')?.focus(); }
  if (event.target.dataset.action === "global-query") {
    const query = event.target.value.toLowerCase();
    document.querySelectorAll(".command-results button").forEach((button) => { button.hidden = !button.textContent.toLowerCase().includes(query); });
  }
  if (event.target.dataset.action === "document-search") {
    const query = event.target.value.toLowerCase();
    document.querySelectorAll(".document-row").forEach((row) => { row.hidden = !row.textContent.toLowerCase().includes(query); });
  }
  if (event.target.dataset.action === "global-document-search") {
    const query = event.target.value.toLowerCase();
    document.querySelectorAll(".global-doc-row").forEach((row) => { row.hidden = !row.textContent.toLowerCase().includes(query); });
  }
  if (event.target.dataset.action === "ledger-search") {
    const query = event.target.value.toLowerCase();
    document.querySelectorAll(".ledger-card .ledger-row").forEach((row) => { row.hidden = !row.textContent.toLowerCase().includes(query); });
  }
  if (event.target.dataset.action === "client-search") {
    const query = event.target.value.toLowerCase();
    document.querySelectorAll(".client-list .client-item").forEach((item) => { item.hidden = !item.textContent.toLowerCase().includes(query); });
  }
  if (event.target.matches('.composer textarea[name="message"]')) state.draftMessage = event.target.value;
  if (event.target.closest(".thread-list .search-field")) {
    const query = event.target.value.toLowerCase();
    document.querySelectorAll(".thread").forEach((thread) => { thread.hidden = !thread.textContent.toLowerCase().includes(query); });
  }
});

document.addEventListener("change", (event) => {
  if (event.target.dataset.action === "import-file-type") { state.importFileType = event.target.value; state.importFile = null; render(); }
  if (event.target.dataset.action === "import-file") {
    const file = event.target.files?.[0];
    if (file) {
      state.importFile = { name: file.name, size: file.size < 1024 ? `${file.size} B` : `${(file.size / 1024).toFixed(1)} KB` };
      render();
    }
  }
  if (event.target.dataset.action === "matter-type") { state.matterType = event.target.value; render(); }
  if (event.target.dataset.action === "change-role") { state.data.profile.role = event.target.value; saveData(); render(); showToast(`Dashboard preview switched to ${event.target.value}`); }
  if (["invoice-confirm", "invoice-furnished-confirm"].includes(event.target.dataset.action)) {
    const buttonAction = event.target.dataset.action === "invoice-confirm" ? "confirm-invoice" : "confirm-invoice-furnished";
    const button = document.querySelector(`[data-action='${buttonAction}']`);
    if (button) button.disabled = !event.target.checked;
  }
  if (event.target.dataset.action === "transfer-matter") {
    const eligibility = getTransferEligibility(event.target.value);
    const label = document.querySelector(".available-funds span");
    const balance = document.querySelector(".available-funds strong");
    const amount = document.querySelector('form[data-action="submit-transfer"] input[name="amount"]');
    const billRef = document.querySelector('form[data-action="submit-transfer"] input[name="billRef"]');
    if (label) label.textContent = `Fee-eligible under ${eligibility?.invoice.id || "no furnished bill"}`;
    if (balance) balance.textContent = new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR" }).format(eligibility?.available || 0);
    if (amount) { amount.max = String(eligibility?.available || 0); amount.value = String(Math.min(4860, eligibility?.available || 0)); }
    if (billRef) billRef.value = eligibility?.invoice.billRef || "";
  }
  if (event.target.dataset.action === "report-period") showToast(`${event.target.value} selected · seeded values remain unchanged`, "info");
  if (event.target.closest(".intake-list .select-field")) {
    const source = event.target.value.toLowerCase();
    document.querySelectorAll(".intake-item").forEach((item) => { item.hidden = source !== "all sources" && !item.textContent.toLowerCase().includes(source); });
  }
  if (event.target.closest(".global-documents .select-field")) {
    const practice = event.target.value;
    document.querySelectorAll(".global-doc-row").forEach((row) => {
      const document = state.data.documents.find((item) => item.id === row.dataset.id);
      const matter = state.data.matters.find((item) => item.id === document?.matterId);
      row.hidden = practice !== "All practice areas" && matter?.type !== practice;
    });
  }
});

document.addEventListener("submit", async (event) => {
  const form = event.target.closest("form[data-action]");
  if (!form) return;
  event.preventDefault();
  const formData = new FormData(form);
  const values = Object.fromEntries(formData);
  if (form.dataset.action === "cro-search") {
    const query = String(values.name || "").trim();
    const validationError = validateCroQuery(query);
    if (validationError) {
      state.cro = { ...state.cro, query, results: [], error: validationError, loading: false };
      render();
      return;
    }
    state.cro = { ...state.cro, query, results: [], error: "", loading: true };
    render();
    try {
      if (location.hostname.endsWith(".github.io")) throw new Error("Live CRO search needs server hosting and is unavailable in this static preview.");
      const response = await fetch(`/api/cro/search?name=${encodeURIComponent(query)}`, { headers: { Accept: "application/json" } });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "CRO search failed.");
      state.cro = {
        query,
        results: normaliseCroResults(payload.results),
        loading: false,
        error: "",
        access: payload.access || "test",
        fetchedAt: payload.fetchedAt || new Date().toISOString(),
      };
    } catch (requestError) {
      state.cro = { ...state.cro, query, results: [], loading: false, error: requestError.message || "CRO search failed." };
    }
    render();
    return;
  }
  if (form.dataset.action === "create-task") {
    state.data.tasks.push({ id: `TSK-${Date.now().toString().slice(-4)}`, title: values.title, matter: values.matter, due: values.due, owner: "You", status: "Not started", priority: "Medium" });
    saveData(); closeModal(); showToast(`Task added to ${values.matter}`);
  }
  if (form.dataset.action === "create-matter") {
    const id = `MAT-2026-${String(143 + state.data.matters.length).padStart(4, "0")}`;
    state.data.matters.unshift({ id, title: values.title, client: values.client, type: values.type, stage: "Intake", owner: values.owner, ownerInitials: values.owner.split(" ").map((part) => part[0]).join(""), status: "On track", risk: "Low", nextDeadline: "Not set", updated: "Just now", value: "Not set", progress: 8, code: `NEW-${id.slice(-4)}` });
    const client = state.data.clients.find((item) => item.name === values.client);
    if (client && !client.matters.includes(id)) client.matters.push(id);
    saveData(); closeModal(); location.hash = `#/matters/${id}`; showToast(`${id} created in demo mode`);
  }
  if (form.dataset.action === "send-message") {
    const matterId = currentRoute().id || "MAT-2026-0142";
    const detail = ensureMatterDetail(matterId);
    if (detail && values.message.trim()) {
      detail.communications.push({ id: `MSG-${Date.now()}`, side: "out", sender: state.data.profile.user, time: "Just now", text: values.message.trim(), status: "Mock sent" });
      detail.audit.unshift({ time: "Just now", actor: state.data.profile.user, action: "Client update mock-sent", detail: "No external message was transmitted" });
      state.data.activity.unshift({ id: `ACT-${Date.now()}`, icon: "mail", title: "Client update mock-sent", detail: matterId, time: "Just now", actor: state.data.profile.user });
      state.draftMessage = "";
      saveData(); render(); showToast("Mock update added to the matter timeline");
    }
  }
  if (form.dataset.action === "ask-ai") {
    const matterId = state.modal?.matterId || "MAT-2026-0142";
    ensureMatterDetail(matterId)?.audit.unshift({ time: "Just now", actor: "AI review · pending", action: "Matter question answered", detail: values.question.trim() });
    saveData();
    const answer = document.querySelector(".ai-answer > p");
    if (answer) answer.textContent = `For ${matterId}, the current demo record indicates that workflow controls and source evidence should be reviewed before action. Your question was: “${values.question.trim()}”. The cited matter card, workflow and activity remain the authoritative synthetic sources for this answer.`;
    showToast("Grounded demo answer generated from synthetic sources", "info");
  }
  if (form.dataset.action === "generate-bundle") {
    const chosen = formData.getAll("documents");
    if (!chosen.length) { showToast("Select at least one document", "info"); return; }
    const originals = chosen.map((id) => state.data.documents.find((document) => document.id === id)).filter(Boolean);
    if (new Set(originals.map((document) => document.matterId)).size > 1) {
      showToast("A bundle must contain documents from one matter only", "info");
      return;
    }
    const id = `BUNDLE-${Date.now().toString().slice(-5)}`;
    const matterId = originals[0]?.matterId || "MAT-2026-0142";
    state.data.documents.unshift({ id, matterId, folder: "Bundles", name: `${values.title}.pdf`, type: "PDF", date: "24 Aug 2026", size: "Generated locally", owner: state.data.profile.user, status: "Draft bundle", pages: originals.reduce((total, document) => total + document.pages, 2), summary: `Mock indexed bundle containing ${originals.length} selected documents.`, extracted: [["Documents", String(originals.length), "100%"], ["Validation", "Human review required", "100%"]], content: ["DRAFT REVIEW BUNDLE", values.title, ...originals.map((document, index) => `${index + 1}. ${document.name}`), "NOT FOR COURT FILING"] });
    state.selectedDocument = id;
    saveData(); closeModal(); location.hash = matterId ? `#/matters/${matterId}?tab=documents` : "#/documents"; showToast(`Mock bundle created with ${originals.length} documents`);
  }
  if (form.dataset.action === "create-document") {
    const id = `DOC-${Date.now().toString().slice(-5)}`;
    const content = values.content.split("\n").filter(Boolean);
    state.data.documents.unshift({ id, matterId: values.matter, folder: values.folder, name: values.name, type: values.name.split(".").pop().toUpperCase(), date: "24 Aug 2026", size: "Synthetic", owner: state.data.profile.user, status: "Needs review", pages: 1, summary: "Synthetic document created inside the browser-only prototype.", extracted: [["Document type", "Proof of address", "84%"], ["Issue date", "20 Aug 2026", "91%"]], content });
    const detail = ensureMatterDetail(values.matter);
    if (detail && values.name.toLowerCase().includes("proof of address")) {
      detail.audit.unshift({ time: "Just now", actor: state.data.profile.user, action: "Mock proof of address added", detail: "Evidence attached; verification and workflow control remain open" });
    }
    state.selectedDocument = id;
    saveData(); closeModal(); location.hash = `#/matters/${values.matter}?tab=documents`; showToast(`${values.name} added to the demo matter`);
  }
  if (form.dataset.action === "start-timer-form") {
    state.data.timer = { running: true, startedAt: Date.now(), matterId: values.matter, narrative: values.narrative.trim() };
    saveData(); closeModal();
    showToast(`Demo timer started for ${values.matter}`);
  }
  if (form.dataset.action === "save-time") {
    const modal = { ...state.modal };
    const hours = Number(values.hours);
    const rate = Number(values.rate);
    if (!Number.isFinite(hours) || hours <= 0 || !Number.isFinite(rate) || rate < 0) { showToast("Enter valid hours and rate", "info"); return; }
    const existing = state.data.timeEntries.find((entry) => entry.id === values.id);
    const entry = existing || { id: `TIME-${Date.now().toString().slice(-6)}`, date: "24 Aug", person: state.data.profile.user, source: modal.source || "Manual" };
    Object.assign(entry, { matterId: values.matter, narrative: values.narrative.trim(), hours, rate, amount: Math.round(hours * rate * 100) / 100, status: values.status });
    if (!existing) state.data.timeEntries.unshift(entry);
    const suggestion = state.data.timeSuggestions.find((item) => item.id === modal.suggestionId);
    if (suggestion) suggestion.status = "Converted";
    ensureMatterDetail(values.matter)?.audit.unshift({ time: "Just now", actor: state.data.profile.user, action: existing ? "Time entry updated" : "Time entry recorded", detail: `${hours.toFixed(1)}h · ${values.status} · browser-local demo` });
    saveData(); closeModal(); showToast(`${hours.toFixed(1)}h saved to ${values.matter}`);
  }
  if (form.dataset.action === "create-invoice") {
    const matter = state.data.matters.find((item) => item.id === values.matter);
    const professional = Number(values.professional);
    const outlays = Number(values.outlays);
    if (!matter || !Number.isFinite(professional) || professional < 0 || !Number.isFinite(outlays) || outlays < 0) { showToast("Enter valid non-negative draft bill amounts", "info"); return; }
    const vat = Math.round((professional + outlays) * 0.23 * 100) / 100;
    const invoiceId = `INV-D-${Date.now().toString().slice(-5)}`;
    const invoice = { id: invoiceId, matterId: matter.id, client: matter.client, professional, outlays, vat, total: Math.round((professional + outlays + vat) * 100) / 100, status: "Draft", owner: matter.owner, issued: "Draft", section150: values.costNotice, billRef: `BOC-DEMO-${invoiceId.slice(-5)}` };
    state.data.invoices.unshift(invoice);
    ensureMatterDetail(matter.id)?.audit.unshift({ time: "Just now", actor: state.data.profile.user, action: "Draft bill created", detail: `${invoice.id} · not issued` });
    saveData(); state.modal = { type: "invoice", invoiceId: invoice.id }; render(); showToast(`${invoice.id} created for human review`);
  }
  if (form.dataset.action === "submit-transfer") {
    const matter = state.data.matters.find((item) => item.id === values.matter);
    const eligibility = getTransferEligibility(values.matter);
    const client = eligibility?.client;
    const amount = Number(values.amount);
    let error = "";
    if (!matter || !client) error = "This matter has no synthetic client ledger available for transfer.";
    else if (!eligibility?.available) error = "Reviewed evidence that an eligible written bill was furnished is required.";
    else if (!Number.isFinite(amount) || amount <= 0) error = "Enter a positive transfer amount.";
    else if (amount > eligibility.available) error = "The amount exceeds the lower of the approved bill balance and synthetic client funds held.";
    else if (values.billRef?.trim() !== eligibility.invoice.billRef) error = "The Bill of Costs reference must match the approved demo bill.";
    else if (values.approved !== "on") error = "Human approval must be explicitly confirmed.";
    if (error) {
      state.modal = { type: "transfer", matterId: values.matter, error };
      render();
      return;
    }
    client.balance = Math.round((client.balance - amount) * 100) / 100;
    const accounts = state.data.accounts;
    accounts.balances.client = Math.round((accounts.balances.client - amount) * 100) / 100;
    accounts.balances.office = Math.round((accounts.balances.office + amount) * 100) / 100;
    accounts.reconciliation.statementBalance = Math.round((accounts.reconciliation.statementBalance - amount) * 100) / 100;
    accounts.reconciliation.ledgerBalance = Math.round((accounts.reconciliation.ledgerBalance - amount) * 100) / 100;
    const stamp = Date.now().toString().slice(-6);
    accounts.transactions.unshift(
      { id: `TX-C-${stamp}`, ledger: "Client", date: "24 Aug", matterId: matter.id, description: "Human-approved fee transfer — synthetic", reference: values.billRef.trim(), debit: amount, credit: 0, balance: accounts.reconciliation.ledgerBalance, matterBalance: client.balance, status: "Matched" },
      { id: `TX-O-${stamp}`, ledger: "Office", date: "24 Aug", matterId: matter.id, description: "Professional fees transferred — synthetic", reference: values.billRef.trim(), debit: 0, credit: amount, balance: accounts.balances.office, status: "Posted" },
    );
    const request = { id: `TRF-D-${stamp}`, matterId: matter.id, amount, billRef: values.billRef.trim(), requestedBy: state.data.profile.user, status: "Completed", reason: "Human-approved demo transfer against furnished-bill evidence" };
    accounts.transferRequests.unshift(request);
    const remediatedBlock = accounts.transferRequests.find((item) => item.id !== request.id && item.matterId === matter.id && item.status === "Blocked" && Math.abs(item.amount - amount) < 0.005);
    if (remediatedBlock) {
      remediatedBlock.status = "Superseded";
      remediatedBlock.reason = `Original blocked record retained · remediated by ${request.id}`;
    }
    if (remediatedBlock?.id === "TRF-118") {
      const exception = accounts.exceptions.find((item) => item.id === "EXC-73");
      if (exception) exception.status = "Resolved";
    }
    ensureMatterDetail(matter.id)?.audit.unshift({ time: "Just now", actor: state.data.profile.user, action: "Demo client-to-office transfer completed", detail: `${values.billRef.trim()} · no real money moved` });
    saveData(); closeModal(); showToast(`Mock transfer completed for ${matter.id}`);
  }
  if (form.dataset.action === "send-portal-update") {
    const client = state.data.clients.find((item) => item.id === values.client);
    if (!client) return;
    if (values.approved !== "on") {
      state.modal = { type: "client-update", clientId: client.id, message: values.message, error: "Review confirmation is required before mock sending." };
      render();
      return;
    }
    state.data.portalMessages.push({ id: `PORT-${Date.now().toString().slice(-6)}`, clientId: client.id, side: "firm", time: "Just now", text: values.message.trim(), status: "Mock sent" });
    const matterId = client.matters[0];
    ensureMatterDetail(matterId)?.audit.unshift({ time: "Just now", actor: state.data.profile.user, action: "Portal update mock-sent", detail: "Approved browser-local message; no external transmission" });
    state.data.activity.unshift({ id: `ACT-${Date.now()}`, icon: "mail", title: "Portal update mock-sent", detail: `${client.name} · no external transmission`, time: "Just now", actor: state.data.profile.user });
    saveData(); closeModal(); showToast(`Mock update added for ${client.name}`);
  }
  if (form.dataset.action === "create-client") {
    if (!values.email.toLowerCase().endsWith(".invalid")) { showToast("Use a non-routable .invalid address for demo clients", "info"); return; }
    const id = `CL-${201 + state.data.clients.length}`;
    const words = values.name.trim().split(/\s+/).filter(Boolean);
    const client = { id, name: values.name.trim(), initials: words.slice(0, 2).map((word) => word[0].toUpperCase()).join(""), type: values.type, matters: [], portal: values.portal, lastActive: "Never", email: values.email.trim(), phone: "Not recorded", risk: "Not assessed", balance: 0, requests: [] };
    state.data.clients.unshift(client);
    state.selectedClient = id;
    saveData(); closeModal(); showToast(`${client.name} added as a synthetic client`);
  }
  if (form.dataset.action === "create-request") {
    const client = state.data.clients.find((item) => item.id === values.client);
    if (!client) return;
    client.requests.push({ id: `REQ-${Date.now().toString().slice(-5)}`, title: values.title.trim(), due: values.due.trim(), status: "Draft" });
    saveData(); closeModal(); showToast(`Draft portal request added for ${client.name}`);
  }
});

document.addEventListener("keydown", (event) => {
  if (state.tour.active) {
    if (event.key === "Escape") { event.preventDefault(); dismissTour("closed"); }
    else if (event.key === "Tab") trapTourFocus(event);
    else if (event.key === "ArrowRight") { event.preventDefault(); moveTour(1); }
    else if (event.key === "ArrowLeft" && state.tour.index) { event.preventDefault(); moveTour(-1); }
    return;
  }
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") { event.preventDefault(); state.modal = { type: "search" }; render(); }
  if (event.key === "Escape" && state.modal) closeModal();
  if (event.key === "Enter" && event.target.matches("tr[data-action='open-matter']")) handleAction("open-matter", event.target);
});

window.addEventListener("resize", scheduleTourPosition);
window.addEventListener("scroll", scheduleTourPosition, true);
window.addEventListener("hashchange", () => {
  state.mobileNav = false;
  state.notificationsOpen = false;
  state.documentFolder = "all";
  state.modal = null;
  const tourRoute = TOUR_STEPS[state.tour.index]?.route;
  if (state.tour.active && location.hash !== tourRoute) { location.hash = tourRoute; return; }
  window.scrollTo(0, 0);
  render();
});
if (!location.hash) location.hash = "#/dashboard";
if (state.tour.active && location.hash !== TOUR_STEPS[0].route) location.hash = TOUR_STEPS[0].route;
render();
setInterval(updateTimerDisplay, 1_000);
