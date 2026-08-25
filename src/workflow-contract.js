import { z } from "zod";

const workflowKinds = ["input", "process", "decision", "human", "document", "event", "system"];

export const workflowPromptSchema = z.object({
  prompt: z.string().trim().min(1).max(4_000),
});

export const workflowNodeSchema = z.object({
  id: z.string().regex(/^[a-z0-9][a-z0-9-]{0,39}$/),
  label: z.string().min(1).max(90),
  detail: z.string().max(180),
  kind: z.enum(workflowKinds),
  layer: z.number().int().min(0).max(16),
  lane: z.number().min(-5).max(5),
});

export const workflowEdgeSchema = z.object({
  source: z.string(),
  target: z.string(),
  label: z.string().max(40),
});

export const workflowGraphOutputSchema = z.object({
  title: z.string().min(1).max(80),
  summary: z.string().min(1).max(240),
  nodes: z.array(workflowNodeSchema).min(2).max(24),
  edges: z.array(workflowEdgeSchema).min(1).max(40),
});

export const workflowGraphSchema = workflowGraphOutputSchema.superRefine((graph, context) => {
  const nodeIds = new Set(graph.nodes.map((node) => node.id));
  if (nodeIds.size !== graph.nodes.length) {
    context.addIssue({ code: "custom", message: "Node ids must be unique", path: ["nodes"] });
  }
  graph.edges.forEach((edge, index) => {
    if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target) || edge.source === edge.target) {
      context.addIssue({ code: "custom", message: "Edges must connect two existing nodes", path: ["edges", index] });
    }
  });
});

export const seedWorkflow = {
  title: "Debt recovery intake to ledger",
  summary: "A human-gated legal operations path from secure client intake through evidence checks, correspondence, events, and ledger updates.",
  nodes: [
    { id: "client-intake", label: "Client CSV / Secure SFTP / API / Manual portal", detail: "Approved intake channels", kind: "input", layer: 0, lane: 0 },
    { id: "quarantine", label: "Encrypted intake quarantine", detail: "Isolate files before processing", kind: "system", layer: 1, lane: 0 },
    { id: "validate", label: "Parse + validate + evidence + duplicate checks", detail: "Reject malformed or duplicate instructions", kind: "process", layer: 2, lane: 0 },
    { id: "approved", label: "Approved", detail: "All required controls passed", kind: "decision", layer: 3, lane: -1 },
    { id: "needs-info", label: "Needs info", detail: "Required evidence or fields are missing", kind: "decision", layer: 3, lane: 0 },
    { id: "human-review", label: "Human review", detail: "An exception needs professional judgment", kind: "human", layer: 3, lane: 1 },
    { id: "correction-csv", label: "Correction CSV", detail: "Return a bounded correction file", kind: "document", layer: 4, lane: 0 },
    { id: "review-pack", label: "Review pack", detail: "Evidence assembled for review", kind: "document", layer: 4, lane: 1 },
    { id: "create-matter", label: "Create core matter + opening debt ledger entry", detail: "Matter ledger only; no bank-account movement", kind: "system", layer: 4, lane: -1 },
    { id: "select-template", label: "Select approved matter / letter template", detail: "Use version-controlled precedents", kind: "document", layer: 5, lane: -1 },
    { id: "start-run", label: "Start versioned workflow run", detail: "Record the selected workflow version", kind: "process", layer: 6, lane: -1 },
    { id: "generate-letter", label: "Generate letter", detail: "Draft correspondence for review", kind: "document", layer: 7, lane: -2 },
    { id: "wait-timer", label: "Wait / timer", detail: "Pause until the configured date or event", kind: "event", layer: 7, lane: -1 },
    { id: "solicitor-decision", label: "Solicitor decision", detail: "Professional judgment remains human", kind: "human", layer: 7, lane: 0 },
    { id: "mail-metrics", label: "Mail Metrics / An Post", detail: "Capture dispatch and postal evidence", kind: "system", layer: 8, lane: -2 },
    { id: "decision-actions", label: "Approve / amend / return / close", detail: "Record the solicitor's decision", kind: "human", layer: 8, lane: 0 },
    { id: "matter-events", label: "Delivery, response, returned post, payment events", detail: "Ingest evidence-bearing workflow events", kind: "event", layer: 9, lane: -1 },
    { id: "update-ledger", label: "Update workflow and debt ledger", detail: "Preserve the case-ledger / accounting-ledger boundary", kind: "system", layer: 10, lane: -1 },
  ],
  edges: [
    { source: "client-intake", target: "quarantine", label: "" },
    { source: "quarantine", target: "validate", label: "" },
    { source: "validate", target: "approved", label: "Pass" },
    { source: "validate", target: "needs-info", label: "Missing" },
    { source: "validate", target: "human-review", label: "Exception" },
    { source: "needs-info", target: "correction-csv", label: "Return" },
    { source: "human-review", target: "review-pack", label: "Assemble" },
    { source: "approved", target: "create-matter", label: "Open" },
    { source: "create-matter", target: "select-template", label: "" },
    { source: "select-template", target: "start-run", label: "" },
    { source: "start-run", target: "generate-letter", label: "Document" },
    { source: "start-run", target: "wait-timer", label: "Delay" },
    { source: "start-run", target: "solicitor-decision", label: "Human gate" },
    { source: "generate-letter", target: "mail-metrics", label: "Dispatch" },
    { source: "solicitor-decision", target: "decision-actions", label: "Decide" },
    { source: "mail-metrics", target: "matter-events", label: "Evidence" },
    { source: "wait-timer", target: "matter-events", label: "Elapsed" },
    { source: "decision-actions", target: "matter-events", label: "Outcome" },
    { source: "matter-events", target: "update-ledger", label: "Record" },
  ],
};

export function toFlowElements(input) {
  const graph = workflowGraphSchema.parse(input);
  return {
    nodes: graph.nodes.map((node) => ({
      id: node.id,
      type: "workflowNode",
      position: { x: node.lane * 300, y: node.layer * 170 },
      data: { label: node.label, detail: node.detail, kind: node.kind },
    })),
    edges: graph.edges.map((edge, index) => ({
      id: `edge-${index}-${edge.source}-${edge.target}`,
      source: edge.source,
      target: edge.target,
      label: edge.label,
      type: "smoothstep",
    })),
  };
}
