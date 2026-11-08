import {
  newId,
  readJsonFile,
  writeJsonFile,
  type AgentRun,
  type ApprovalAction,
  type DraftArtifact,
  type SendLogEntry,
  type WorkflowKind,
} from "@ai-marketomg/core";

const RUNS_FILE = "runs.json";
const APPROVALS_FILE = "approvals.json";
const SEND_LOG_FILE = "send-log.json";

export function listRuns(): AgentRun[] {
  return readJsonFile<AgentRun[]>(RUNS_FILE, []).slice().sort((a, b) =>
    Date.parse(b.startedAt) - Date.parse(a.startedAt)
  );
}

export function getRun(id: string): AgentRun | null {
  return listRuns().find((r) => r.id === id) ?? null;
}

export function saveRun(run: AgentRun): AgentRun {
  const runs = readJsonFile<AgentRun[]>(RUNS_FILE, []);
  const idx = runs.findIndex((r) => r.id === run.id);
  if (idx >= 0) runs[idx] = run;
  else runs.push(run);
  writeJsonFile(RUNS_FILE, runs);
  return run;
}

export function listApprovals(status?: ApprovalAction["status"]): ApprovalAction[] {
  const all = readJsonFile<ApprovalAction[]>(APPROVALS_FILE, []);
  const filtered = status ? all.filter((a) => a.status === status) : all;
  return filtered.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

export function getApproval(id: string): ApprovalAction | null {
  return readJsonFile<ApprovalAction[]>(APPROVALS_FILE, []).find((a) => a.id === id) ?? null;
}

export function createPendingApproval(input: {
  runId: string;
  workflow: WorkflowKind;
  draft: DraftArtifact;
}): ApprovalAction {
  const action: ApprovalAction = {
    id: newId("appr"),
    runId: input.runId,
    workflow: input.workflow,
    status: "pending",
    draft: input.draft,
    createdAt: new Date().toISOString(),
  };
  const all = readJsonFile<ApprovalAction[]>(APPROVALS_FILE, []);
  all.push(action);
  writeJsonFile(APPROVALS_FILE, all);
  return action;
}

export function listSendLog(): SendLogEntry[] {
  return readJsonFile<SendLogEntry[]>(SEND_LOG_FILE, []).slice().sort((a, b) =>
    Date.parse(b.loggedAt) - Date.parse(a.loggedAt)
  );
}

function updateApproval(action: ApprovalAction): ApprovalAction {
  const all = readJsonFile<ApprovalAction[]>(APPROVALS_FILE, []);
  const idx = all.findIndex((a) => a.id === action.id);
  if (idx < 0) throw new Error(`Approval not found: ${action.id}`);
  all[idx] = action;
  writeJsonFile(APPROVALS_FILE, all);
  return action;
}

export function appendSendLog(entry: Omit<SendLogEntry, "id" | "loggedAt">): SendLogEntry {
  const full: SendLogEntry = {
    ...entry,
    id: newId("send"),
    loggedAt: new Date().toISOString(),
  };
  const all = readJsonFile<SendLogEntry[]>(SEND_LOG_FILE, []);
  all.push(full);
  writeJsonFile(SEND_LOG_FILE, all);
  console.info(
    `[send-stub] ${full.loggedAt} subject="${full.subject}" to=${full.to.join(",")} approval=${full.approvalId}`
  );
  return full;
}

export function decideApproval(
  approvalId: string,
  decision: "approved" | "rejected",
  note?: string
): { approval: ApprovalAction; run: AgentRun; send?: SendLogEntry } {
  const approval = getApproval(approvalId);
  if (!approval) throw new Error(`Approval not found: ${approvalId}`);
  if (approval.status !== "pending") {
    throw new Error(`Approval ${approvalId} already ${approval.status}`);
  }

  const run = getRun(approval.runId);
  if (!run) throw new Error(`Run not found for approval: ${approval.runId}`);

  approval.status = decision;
  approval.decidedAt = new Date().toISOString();
  if (note) approval.decisionNote = note;
  updateApproval(approval);

  let send: SendLogEntry | undefined;

  if (decision === "approved") {
    const recipients = (approval.draft.metadata.to as string[] | undefined) ?? [
      "pilot-ops@example.com",
    ];
    send = appendSendLog({
      approvalId: approval.id,
      runId: run.id,
      channel: "email_stub",
      to: recipients,
      subject: approval.draft.title,
      bodyPreview: approval.draft.bodyMarkdown.slice(0, 280),
    });
    run.status = "completed";
  } else {
    run.status = "rejected";
  }

  run.finishedAt = new Date().toISOString();
  saveRun(run);

  return { approval, run, send };
}
