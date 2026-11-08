import { runDailyReport } from "@ai-marketomg/agent";

const { run, approvalId } = await runDailyReport();
console.log(
  JSON.stringify(
    {
      runId: run.id,
      status: run.status,
      approvalId,
      title: run.draft?.title,
    },
    null,
    2
  )
);
