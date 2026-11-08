export type WorkflowKind = "daily_report" | "quote_draft";

export type RunStatus =
  | "running"
  | "awaiting_approval"
  | "completed"
  | "rejected"
  | "failed";

export type ApprovalStatus = "pending" | "approved" | "rejected";

export interface PilotConfig {
  clientId: string;
  clientName: string;
  timezone: string;
  reportScheduleCron: string;
  features: {
    dailyReport: boolean;
    quoteDraft: boolean;
    meetingScheduler: boolean;
  };
  report: {
    audience: string;
    defaultLookbackDays: number;
  };
  quote: {
    currency: string;
    defaultValidityDays: number;
    paymentTerms: string;
  };
  send: {
    mode: "stub";
    fromName: string;
    fromEmail: string;
  };
}

export interface Contact {
  id: string;
  name: string;
  email: string;
  company: string;
  title?: string;
}

export interface Deal {
  id: string;
  name: string;
  stage: string;
  amount: number;
  currency: string;
  contactIds: string[];
  company: string;
  owner: string;
  updatedAt: string;
  lineItems?: QuoteLineItem[];
}

export interface QuoteLineItem {
  sku: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

export type ActivityType =
  | "email"
  | "call"
  | "meeting"
  | "note"
  | "stage_change"
  | "task";

export interface Activity {
  id: string;
  type: ActivityType;
  subject: string;
  body: string;
  occurredAt: string;
  dealId?: string;
  contactId?: string;
  owner: string;
}

export interface DraftArtifact {
  title: string;
  bodyMarkdown: string;
  metadata: Record<string, unknown>;
}

export interface AgentRun {
  id: string;
  workflow: WorkflowKind;
  status: RunStatus;
  startedAt: string;
  finishedAt?: string;
  input: Record<string, unknown>;
  summary?: string;
  draft?: DraftArtifact;
  approvalId?: string;
  error?: string;
}

export interface ApprovalAction {
  id: string;
  runId: string;
  workflow: WorkflowKind;
  status: ApprovalStatus;
  draft: DraftArtifact;
  createdAt: string;
  decidedAt?: string;
  decisionNote?: string;
}

export interface SendLogEntry {
  id: string;
  approvalId: string;
  runId: string;
  channel: "email_stub";
  to: string[];
  subject: string;
  bodyPreview: string;
  loggedAt: string;
}
