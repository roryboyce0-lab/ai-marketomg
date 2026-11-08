import {
  loadPilotConfig,
  newId,
  type AgentRun,
  type DraftArtifact,
} from "@ai-marketomg/core";
import { createPendingApproval, saveRun } from "@ai-marketomg/approvals";
import type { CrmAdapter } from "@ai-marketomg/crm-adapter";
import { createAgentContext, type AgentContext } from "./runtime.js";
import {
  buildWorkflowPromptModules,
  PINNED_UPSTREAM_SHA,
} from "./skills/load.js";
import { polishDraftMarkdown, wrapEmailBody } from "./skills/polish.js";

export interface DailyReportInput {
  /** Inclusive start ISO; defaults to lookback from pilot config. */
  from?: string;
  /** Inclusive end ISO; defaults to now. */
  to?: string;
}

function defaultRange(lookbackDays: number): { from: string; to: string } {
  const to = new Date();
  const from = new Date(to.getTime() - lookbackDays * 24 * 60 * 60 * 1000);
  return { from: from.toISOString(), to: to.toISOString() };
}

function formatMoney(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Stages that often mean a deal is waiting on formal next steps (RevOps hygiene). */
const STALE_HINT_STAGES = new Set(["Proposal", "Negotiation", "Discovery"]);

export async function draftDailyReport(
  crm: CrmAdapter,
  input: DailyReportInput = {}
): Promise<DraftArtifact> {
  const config = loadPilotConfig();
  const range = {
    from: input.from ?? defaultRange(config.report.defaultLookbackDays).from,
    to: input.to ?? defaultRange(config.report.defaultLookbackDays).to,
  };

  const [activities, deals, contacts] = await Promise.all([
    crm.listActivities(range),
    crm.listDeals(),
    crm.listContacts(),
  ]);

  const byType = activities.reduce<Record<string, number>>((acc, a) => {
    acc[a.type] = (acc[a.type] ?? 0) + 1;
    return acc;
  }, {});

  const openPipeline = deals.reduce((sum, d) => sum + d.amount, 0);
  const notable = activities.slice(-5).reverse();
  const stageChanges = activities.filter((a) => a.type === "stage_change");
  const hygieneFlags = deals.filter((d) => STALE_HINT_STAGES.has(d.stage));

  const crmFacts = [
    `Period: ${range.from} → ${range.to}`,
    `Activities: ${activities.length}`,
    `Open deals: ${deals.length}`,
    `Contacts: ${contacts.length}`,
    `Pipeline: ${formatMoney(openPipeline, config.quote.currency)}`,
    "",
    "Deals:",
    ...deals.map(
      (d) =>
        `- ${d.id} | ${d.name} | ${d.stage} | ${formatMoney(d.amount, d.currency)} | owner ${d.owner}`
    ),
    "",
    "Recent activities:",
    ...activities
      .slice()
      .sort((a, b) => Date.parse(b.occurredAt) - Date.parse(a.occurredAt))
      .slice(0, 12)
      .map(
        (a) =>
          `- ${a.occurredAt} | ${a.type} | ${a.subject}${a.dealId ? ` | ${a.dealId}` : ""}`
      ),
  ].join("\n");

  const prompt = buildWorkflowPromptModules({
    workflow: "daily_report",
    config,
    crmFactsMarkdown: crmFacts,
  });

  // Narrative shaped by revops (pipeline hygiene + activity digest) + emails wrap + copy polish.
  const lines: string[] = [
    `# Daily sales report — ${config.clientName}`,
    "",
    `**Period:** ${range.from.slice(0, 10)} → ${range.to.slice(0, 10)}  `,
    `**Audience:** ${config.report.audience}  `,
    `**Timezone:** ${config.timezone}`,
    "",
    "## Snapshot (sales view)",
    "",
    `- Activities logged: **${activities.length}**`,
    `- Open deals: **${deals.length}** (${formatMoney(openPipeline, config.quote.currency)} pipeline)`,
    `- Stage changes in window: **${stageChanges.length}**`,
    `- Contacts in scope: **${contacts.length}**`,
    "",
    "### Activity mix",
    "",
  ];

  const typeEntries = Object.entries(byType);
  if (typeEntries.length === 0) {
    lines.push("- No CRM activity in this window.");
  } else {
    for (const [type, count] of typeEntries.sort((a, b) => b[1] - a[1])) {
      lines.push(`- ${type}: ${count}`);
    }
  }

  lines.push("", "## Pipeline", "");
  for (const deal of deals) {
    lines.push(
      `- **${deal.name}** — ${deal.stage} · ${formatMoney(deal.amount, deal.currency)} · owner ${deal.owner}`
    );
  }

  lines.push("", "## Stage hygiene", "");
  if (hygieneFlags.length === 0) {
    lines.push("- No deals flagged in Discovery / Proposal / Negotiation.");
  } else {
    for (const deal of hygieneFlags) {
      lines.push(
        `- **${deal.name}** still in **${deal.stage}** (updated ${deal.updatedAt.slice(0, 10)}) — confirm next exit criteria.`
      );
    }
  }

  lines.push("", "## Lead activity digest", "");
  if (notable.length === 0) {
    lines.push("- Nothing flagged for this window.");
  } else {
    for (const a of notable) {
      const deal = deals.find((d) => d.id === a.dealId);
      const dealLabel = deal ? ` (${deal.company})` : "";
      lines.push(
        `- **${a.occurredAt.slice(0, 16).replace("T", " ")}** — ${a.type}: ${a.subject}${dealLabel}`
      );
      lines.push(`  - ${a.body}`);
    }
  }

  lines.push(
    "",
    "## Suggested next actions",
    "",
    "1. Advance Brightline quote if still awaiting formal numbers.",
    "2. Confirm Northwind security review owners and due date.",
    "3. Keep Harbor Co warm with dock scan demo materials.",
    "",
    "---",
    "_Skills applied: " +
      prompt.skillsLoaded.join(", ") +
      ". Generated by ai-marketomg (mock CRM). Requires human approval before send._"
  );

  const polished = polishDraftMarkdown(lines.join("\n"));
  const emailed = wrapEmailBody({
    subject: `${config.clientName} daily report — ${range.to.slice(0, 10)}`,
    bodyMarkdown: polished,
    fromName: config.send.fromName,
    audienceLabel: config.report.audience,
  });

  return {
    title: emailed.subject,
    bodyMarkdown: emailed.bodyMarkdown,
    metadata: {
      periodFrom: range.from,
      periodTo: range.to,
      activityCount: activities.length,
      dealCount: deals.length,
      to: [`${config.report.audience}@${config.clientId}.example`],
      workflow: "daily_report",
      skillsLoaded: prompt.skillsLoaded,
      skillsPinnedSha: PINNED_UPSTREAM_SHA,
      promptModuleChars: prompt.systemPrompt.length,
    },
  };
}

export async function runDailyReport(
  input: DailyReportInput = {},
  ctx?: AgentContext
): Promise<{ run: AgentRun; approvalId: string }> {
  const context = ctx ?? createAgentContext();
  const run: AgentRun = {
    id: newId("run"),
    workflow: "daily_report",
    status: "running",
    startedAt: new Date().toISOString(),
    input: { ...input },
  };
  saveRun(run);

  try {
    const draft = await draftDailyReport(context.crm, input);
    const approval = createPendingApproval({
      runId: run.id,
      workflow: "daily_report",
      draft,
    });

    run.status = "awaiting_approval";
    run.draft = draft;
    run.approvalId = approval.id;
    run.summary = `Draft ready with ${String(draft.metadata.activityCount ?? 0)} activities`;
    saveRun(run);

    return { run, approvalId: approval.id };
  } catch (err) {
    run.status = "failed";
    run.finishedAt = new Date().toISOString();
    run.error = err instanceof Error ? err.message : String(err);
    saveRun(run);
    throw err;
  }
}
