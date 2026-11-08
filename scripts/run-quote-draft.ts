import { runQuoteDraft } from "@ai-marketomg/agent";

const dealId = process.argv[2] ?? "deal_brightline_pilot";
const { run, approvalId } = await runQuoteDraft({ dealId });
console.log(
  JSON.stringify(
    {
      runId: run.id,
      status: run.status,
      approvalId,
      title: run.draft?.title,
      dealId,
    },
    null,
    2
  )
);
