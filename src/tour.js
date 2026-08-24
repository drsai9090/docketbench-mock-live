export const TOUR_STORAGE_KEY = "docketbench-tour-v1";

export const TOUR_STEPS = Object.freeze([
  {
    id: "welcome",
    route: "#/dashboard",
    title: "Welcome to DocketBench",
    body: "This guide covers the core legal operations flow. Most workspaces use fictional sample data stored only in this browser. The CRO lookup is clearly marked and calls the official public registry.",
  },
  {
    id: "daily-overview",
    route: "#/dashboard",
    target: "dashboard-priorities",
    placement: "right",
    title: "Start with today",
    body: "Overview brings deadlines, priorities, tasks, pipeline stages and recent activity into one review queue. Every figure shown here is sample data.",
  },
  {
    id: "global-search",
    route: "#/dashboard",
    target: "global-search",
    placement: "bottom",
    title: "Search across the firm",
    body: "Search matters, documents and clients from any workspace. This prototype only searches fictional records stored in this browser.",
  },
  {
    id: "matter-list",
    route: "#/matters",
    target: "matter-list",
    placement: "bottom",
    title: "Find the right matter",
    body: "Matters keeps references, owners, deadlines, status and progress together. Use the search field and type filter to narrow the sample caseload.",
  },
  {
    id: "matter-tabs",
    route: "#/matters/MAT-2026-0142?tab=overview",
    target: "matter-tabs",
    placement: "bottom",
    title: "Use the complete matter file",
    body: "Overview, Workflow, Documents, Communications, Time & fees, Client ledger and Audit trail keep each sample file together. The active tab always shows where you are.",
  },
  {
    id: "matter-brief",
    route: "#/matters/MAT-2026-0142?tab=overview",
    target: "matter-brief",
    placement: "right",
    title: "Review the matter brief",
    body: "The AI matter brief assembles facts from the sample matter sources and shows confidence. Check every source before relying on a fact or date.",
  },
  {
    id: "matter-workflow",
    route: "#/matters/MAT-2026-0142?tab=workflow",
    target: "matter-workflow",
    placement: "right",
    title: "Follow the workflow",
    body: "Workflow shows stage gates, checklist items and blockers. Only a person can decide that the matter is ready to advance.",
  },
  {
    id: "intake-match",
    route: "#/intake",
    target: "intake-match",
    placement: "left",
    title: "Triage instructions",
    body: "Intake & instructions groups sample email, portal and CSV records into suggested matches. Review source fields before choosing Confirm & file to matter.",
  },
  {
    id: "document-review",
    route: "#/documents",
    target: "document-review",
    placement: "left",
    title: "Check document extraction",
    body: "Documents shows the sample file beside extracted facts and confidence labels. Choose Mark extraction reviewed only after checking the document.",
  },
  {
    id: "time-capture",
    route: "#/time",
    target: "time-capture",
    placement: "bottom",
    title: "Capture time",
    body: "Time & billing combines the timer, manual entries and activity suggestions. A suggestion stays unbilled until a person reviews and saves it.",
  },
  {
    id: "billing-review",
    route: "#/time",
    target: "billing-review",
    placement: "top",
    title: "Review draft bills",
    body: "Draft bills separate internal approval from evidence that a bill was furnished. The prototype never issues an invoice or moves money.",
  },
  {
    id: "accounts-controls",
    route: "#/accounts",
    target: "accounts-controls",
    placement: "bottom",
    title: "Protect client money",
    body: "Legal accounts keeps client and office ledgers separate. Reconciliation and fee transfers are simulations that require reviewed evidence and human confirmation.",
  },
  {
    id: "client-portal",
    route: "#/clients",
    target: "client-portal",
    placement: "bottom",
    title: "Preview the client view",
    body: "Clients & portal shows firm records beside Preview as client. Only approved sample updates appear there, and nothing is sent outside this browser.",
  },
  {
    id: "report-overview",
    route: "#/reports",
    target: "report-overview",
    placement: "bottom",
    title: "Read the practice picture",
    body: "Reports & analytics combines fees, collection, WIP, aged debt and workflow measures. Every chart contains fabricated figures for interface exploration.",
  },
  {
    id: "cro-lookup",
    route: "#/cro",
    target: "cro-lookup",
    placement: "bottom",
    title: "Check the CRO register",
    body: "CRO lookup is the only live data page in this prototype. Searching sends the entered company name to CRO Open Services through the local server. Test access is limited to the examples shown.",
  },
  {
    id: "ready",
    route: "#/dashboard",
    target: "first-action",
    placement: "bottom",
    title: "Ready to explore",
    body: "Choose Finish, then select Open matter list to explore a sample file. Reopen this guide at any time with Product tour in the top bar.",
  },
]);

export function shouldStartTour(savedChoice) {
  return !["closed", "finished", "skipped"].includes(savedChoice);
}

export function moveTourIndex(index, direction) {
  return Math.max(0, Math.min(TOUR_STEPS.length - 1, index + direction));
}
