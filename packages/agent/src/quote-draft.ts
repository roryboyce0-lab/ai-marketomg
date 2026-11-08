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

export interface QuoteDraftInput {
  dealId: string;
}

function formatMoney(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export async function draftQuote(
  crm: CrmAdapter,
  input: QuoteDraftInput
): Promise<DraftArtifact> {
  const config = loadPilotConfig();
  const deal = await crm.getDeal(input.dealId);
  if (!deal) {
    throw new Error(`Deal not found: ${input.dealId}`);
  }

  const contacts = await Promise.all(
    deal.contactIds.map((id) => crm.getContact(id))
  );
  const primary = contacts.find(Boolean);
  const lineItems = deal.lineItems ?? [];
  const subtotal = lineItems.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  );
  const validUntil = new Date();
  validUntil.setUTCDate(
    validUntil.getUTCDate() + config.quote.defaultValidityDays
  );
  const total = lineItems.length > 0 ? subtotal : deal.amount;

  const crmFacts = [
    `Deal: ${deal.id} — ${deal.name}`,
    `Company: ${deal.company}`,
    `Stage: ${deal.stage}`,
    `Owner: ${deal.owner}`,
    `Amount: ${formatMoney(deal.amount, deal.currency)}`,
    `Primary contact: ${primary ? `${primary.name} <${primary.email}>` : "unknown"}`,
    "",
    "Line items:",
    ...(lineItems.length
      ? lineItems.map(
          (i) =>
            `- ${i.sku}: ${i.description} × ${i.quantity} @ ${formatMoney(i.unitPrice, deal.currency)}`
        )
      : ["- (none — use deal amount as package total)"]),
  ].join("\n");

  const prompt = buildWorkflowPromptModules({
    workflow: "quote_draft",
    config,
    crmFactsMarkdown: crmFacts,
  });

  // sales-enablement Proposal Templates + offers investment framing.
  const lines: string[] = [
    `# Quotation — ${deal.name}`,
    "",
    `**Prepared for:** ${deal.company}${primary ? ` (${primary.name})` : ""}  `,
    `**From:** ${config.send.fromName} <${config.send.fromEmail}>  `,
    `**Deal stage:** ${deal.stage}  `,
    `**Valid until:** ${validUntil.toISOString().slice(0, 10)}  `,
    `**Payment terms:** ${config.quote.paymentTerms}`,
    "",
    "## 1. Executive summary",
    "",
    `${deal.company} is evaluating warehouse automation for **${deal.name}**. ` +
      `This quotation packages the hardware and services needed to run a scoped pilot, ` +
      `with clear line items and ${config.quote.paymentTerms} terms.`,
    "",
    "## 2. Proposed solution",
    "",
    "Deliverables mapped to this opportunity:",
    "",
  ];

  if (lineItems.length === 0) {
    lines.push(
      `- Package total for **${deal.name}**: ${formatMoney(deal.amount, deal.currency)}`
    );
  } else {
    for (const item of lineItems) {
      lines.push(
        `- **${item.description}** (\`${item.sku}\`) × ${item.quantity}`
      );
    }
  }

  lines.push(
    "",
    "## 3. Implementation plan",
    "",
    "| Milestone | Owner | Target |",
    "| --- | --- | --- |",
    `| Kickoff & site readiness check | ${deal.owner} + ${deal.company} | Week 1 |`,
    "| Hardware delivery / install window | Acme delivery | Weeks 2–3 |",
    "| Training & pilot support | Acme services | Through validity date |",
    "",
    "## 4. Investment",
    "",
    "| SKU | Description | Qty | Unit | Ext |",
    "| --- | --- | ---: | ---: | ---: |"
  );

  for (const item of lineItems) {
    const ext = item.quantity * item.unitPrice;
    lines.push(
      `| ${item.sku} | ${item.description} | ${item.quantity} | ${formatMoney(item.unitPrice, deal.currency)} | ${formatMoney(ext, deal.currency)} |`
    );
  }

  if (lineItems.length === 0) {
    lines.push(
      `| — | Package total | 1 | ${formatMoney(deal.amount, deal.currency)} | ${formatMoney(deal.amount, deal.currency)} |`
    );
  }

  lines.push(
    "",
    `**Total: ${formatMoney(total, deal.currency)}**`,
    "",
    `- Pricing holds through **${validUntil.toISOString().slice(0, 10)}**.`,
    `- Payment terms: **${config.quote.paymentTerms}**.`,
    "- Installation windows subject to site readiness.",
    "- Guarantee: workmanship on install/calibration covered for the pilot window; hardware warranties per SKU sheet (no invented SLA claims).",
    "",
    "## 5. Next steps",
    "",
    "1. Confirm line items and install window with stakeholders named above.",
    "2. Human approval in ai-marketomg before this quotation is sent.",
    "3. On approval, customer countersigns and kickoff is scheduled.",
    "",
    "---",
    `_Skills applied: ${prompt.skillsLoaded.join(", ")}. Generated by ai-marketomg quote workflow for ${config.clientName}._`
  );

  const polished = polishDraftMarkdown(lines.join("\n"));
  const emailed = wrapEmailBody({
    subject: `Quote: ${deal.name}`,
    bodyMarkdown: polished,
    fromName: config.send.fromName,
    audienceLabel: primary?.name ?? deal.company,
  });

  const recipients = primary?.email
    ? [primary.email]
    : [`quotes@${config.clientId}.example`];

  return {
    title: emailed.subject,
    bodyMarkdown: emailed.bodyMarkdown,
    metadata: {
      dealId: deal.id,
      company: deal.company,
      total,
      currency: deal.currency,
      to: recipients,
      workflow: "quote_draft",
      skillsLoaded: prompt.skillsLoaded,
      skillsPinnedSha: PINNED_UPSTREAM_SHA,
      promptModuleChars: prompt.systemPrompt.length,
    },
  };
}

export async function runQuoteDraft(
  input: QuoteDraftInput,
  ctx?: AgentContext
): Promise<{ run: AgentRun; approvalId: string }> {
  const context = ctx ?? createAgentContext();
  const run: AgentRun = {
    id: newId("run"),
    workflow: "quote_draft",
    status: "running",
    startedAt: new Date().toISOString(),
    input: { ...input },
  };
  saveRun(run);

  try {
    const draft = await draftQuote(context.crm, input);
    const approval = createPendingApproval({
      runId: run.id,
      workflow: "quote_draft",
      draft,
    });

    run.status = "awaiting_approval";
    run.draft = draft;
    run.approvalId = approval.id;
    run.summary = `Quote draft for ${String(draft.metadata.company ?? input.dealId)}`;
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
