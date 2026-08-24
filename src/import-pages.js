export const IMPORT_STEPS = [
  { id: "upload", label: "Upload data" },
  { id: "mapping", label: "Map fields" },
  { id: "processing", label: "Import data" },
  { id: "review", label: "Review results" },
];

const SAMPLE_FILE = { name: "harcourt-matter-export-demo.csv", size: "18.4 KB" };

const mappings = [
  ["Matter Ref", "Matter reference", "MAT-2026-0142", "Exact match"],
  ["Client Name", "Client name", "Sample Client O'Rourke", "Exact match"],
  ["Matter Type", "Practice area", "Conveyancing", "Exact match"],
  ["File Owner", "Matter owner", "Niamh Kelly", "Suggested"],
  ["Opened Date", "Date opened", "2026-06-12", "Exact match"],
  ["Next Deadline", "Next deadline", "2026-08-24", "Exact match"],
  ["External Code", "External reference", "AQ-024-A", "Suggested"],
  ["Payment Note", "Do not import", "Deposit mentioned in email", "Review"],
];

function stepBar(activeStep) {
  const activeIndex = IMPORT_STEPS.findIndex((step) => step.id === activeStep);
  return `<ol class="import-step-bar" aria-label="Import progress">${IMPORT_STEPS.map((step, index) => `<li class="${index < activeIndex ? "complete" : index === activeIndex ? "current" : ""}" ${index === activeIndex ? 'aria-current="step"' : ""}><span>${index < activeIndex ? "✓" : index + 1}</span><strong>${step.label}</strong></li>`).join("")}</ol>`;
}

function uploadStep(context) {
  const { state, icon, escapeHtml } = context;
  const file = state.importFile;
  return `
    <div class="import-copy"><h2>Upload matter data</h2><p>Choose the source format, then add an exported data file.</p></div>
    <label class="import-label" for="import-file-type">File type</label>
    <select class="import-select" id="import-file-type" data-action="import-file-type">
      <option value="csv" ${state.importFileType === "csv" ? "selected" : ""}>CSV export</option>
      <option value="sql" ${state.importFileType === "sql" ? "selected" : ""}>SQL database dump</option>
    </select>
    <p class="import-help">This is a visual prototype. The selected file stays in your browser and is not read or uploaded.</p>
    <input class="sr-only" id="mock-import-file" data-action="import-file" type="file" accept="${state.importFileType === "csv" ? ".csv,text/csv" : ".sql,text/plain"}" />
    <label class="import-dropzone" for="mock-import-file">
      <span class="import-drop-icon">${icon(state.importFileType === "csv" ? "file" : "activity", 26)}</span>
      <strong>Drop your ${state.importFileType === "csv" ? "CSV" : "SQL"} file here</strong>
      <span>or <em>browse to choose a file</em></span>
      <small>${state.importFileType === "csv" ? ".csv files up to 25 MB" : ".sql files up to 250 MB"}</small>
    </label>
    ${file ? `<div class="import-file-summary"><span>${icon("file", 17)}</span><div><strong>${escapeHtml(file.name)}</strong><small>${escapeHtml(file.size)} · ready for mock import</small></div><button class="text-button" data-action="clear-import-file">Remove</button></div>` : `<button class="button button-secondary import-sample" data-action="use-import-sample">Use sample docket CSV</button>`}
    <div class="import-boundary"><strong>Prototype boundary</strong><span>No document contents leave this browser and no matter records are created.</span></div>
    <div class="import-footer"><a class="import-history-link" href="#/intake">View intake queue</a><button class="button button-primary" data-action="import-continue" ${file ? "" : "disabled"}>Continue${icon("chevron", 15)}</button></div>`;
}

function mappingStep(context) {
  const { icon, escapeHtml } = context;
  return `
    <div class="import-copy"><h2>Map CSV fields</h2><p>Confirm how each CSV column should populate the DocketBench matter workspace.</p></div>
    <div class="mapping-summary"><div><strong>8 CSV columns found</strong><small>6 of 6 required fields mapped · 1 optional field mapped</small></div><button class="button button-quiet" data-action="auto-map-import">${icon("sparkles", 14)}Auto-map fields</button></div>
    <div class="mapping-table">
      <div class="mapping-head"><span>CSV column</span><span></span><span>DocketBench field</span></div>
      ${mappings.map(([source, target, example, confidence]) => `<div class="mapping-row ${confidence === "Review" ? "needs-review" : confidence === "Suggested" ? "suggested" : ""}"><div><strong>${escapeHtml(source)}</strong><small>Example: ${escapeHtml(example)}</small></div><span class="mapping-arrow">${icon("chevron", 14)}</span><label><span class="sr-only">Map ${escapeHtml(source)}</span><select><option>${escapeHtml(target)}</option>${["Do not import", "Matter notes", "External reference"].filter((option) => option !== target).map((option) => `<option>${option}</option>`).join("")}</select><small class="mapping-status">${confidence === "Exact match" ? "Mapped" : confidence === "Suggested" ? "Suggested · review" : "Needs review"}</small></label></div>`).join("")}
    </div>
    <div class="import-footer"><button class="button button-quiet" data-action="import-back">${icon("chevron", 14)}Choose another file</button><button class="button button-primary" data-action="import-continue">Import data${icon("chevron", 15)}</button></div>`;
}

function processingStep(context) {
  const { state, icon, escapeHtml } = context;
  const file = state.importFile || SAMPLE_FILE;
  return `
    <div class="import-copy"><h2>Import data</h2><p>The sample file is being validated and prepared for the intake review queue.</p></div>
    <div class="processing-card" role="status" aria-live="polite"><span class="import-spinner">${icon("activity", 20)}</span><div><strong>Cross-checking matter references</strong><small>${escapeHtml(file.name)} · Harcourt & Byrne demo workspace</small></div><em>72%</em></div>
    <div class="import-progress"><span></span></div>
    <div class="processing-list"><p class="complete"><span>✓</span><strong>File validated</strong><small>18 rows · 8 columns</small></p><p class="complete"><span>✓</span><strong>Required fields mapped</strong><small>6 of 6 ready</small></p><p class="current"><span>3</span><strong>Matching matters and documents</strong><small>Checking references and duplicates</small></p><p><span>4</span><strong>Preparing review results</strong><small>Waiting</small></p></div>
    <div class="import-boundary"><strong>Mock processing</strong><span>No file is transmitted and no firm data is changed.</span></div>`;
}

function reviewStep(context) {
  const { state, icon, escapeHtml } = context;
  const file = state.importFile || SAMPLE_FILE;
  return `
    <div class="import-result-head"><span>${icon("activity", 21)}</span><div><h2>Data import ready for review</h2><p>${escapeHtml(file.name)} → Harcourt & Byrne demo workspace</p></div></div>
    <div class="import-result-metrics"><article><small>Matter rows</small><strong>18</strong><span>12 matched</span></article><article><small>Documents</small><strong>46</strong><span>Linked by reference</span></article><article><small>New matters</small><strong>3</strong><span>Suggested only</span></article><article class="warning"><small>Needs review</small><strong>2</strong><span>Code conflicts</span></article></div>
    <div class="import-review-table"><div><span class="badge badge-success"><span></span>Matched</span><p><strong>12 rows linked to existing matters</strong><small>References and client names agree.</small></p></div><div><span class="badge badge-warning"><span></span>Review</span><p><strong>2 external case code conflicts</strong><small>AQ-024-A and AQ-024-B point to the Alder Quay matter.</small></p></div><div><span class="badge badge-success"><span></span>Ready</span><p><strong>3 new matter suggestions</strong><small>Nothing is created until a person confirms it in Intake.</small></p></div></div>
    <div class="import-boundary"><strong>Human confirmation required</strong><span>These are deterministic preview results. Open Intake to review each proposed match.</span></div>
    <div class="import-footer"><button class="button button-secondary" data-action="restart-import">Import another file</button><a class="button button-primary" href="#/intake">Open intake review${icon("chevron", 15)}</a></div>`;
}

export function renderDataImport(context) {
  const { state, pageHeader } = context;
  const step = IMPORT_STEPS.some((item) => item.id === state.importStage) ? state.importStage : "upload";
  const content = step === "mapping" ? mappingStep(context) : step === "processing" ? processingStep(context) : step === "review" ? reviewStep(context) : uploadStep(context);
  return `
    ${pageHeader("Data import", "Bring exported matter data into a safe, reviewable DocketBench workflow.")}
    <section class="panel import-shell" data-import-stage="${step}">${stepBar(step)}<div class="import-body">${content}</div></section>
    <p class="import-page-note">Mock import flow · browser-local synthetic data only</p>`;
}

export function sampleImportFile() {
  return { ...SAMPLE_FILE };
}
