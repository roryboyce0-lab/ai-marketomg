import { runDailyReport, runQuoteDraft } from "@ai-marketomg/agent";
import { decideApproval, listSendLog } from "@ai-marketomg/approvals";

const report = await runDailyReport({
  from: "2026-11-03T00:00:00.000Z",
  to: "2026-11-08T23:59:59.000Z",
});
console.log("daily report →", report.run.id, report.approvalId);

const approved = decideApproval(report.approvalId, "approved", "smoke approve");
console.log("approved send →", approved.send?.id);

const quote = await runQuoteDraft({ dealId: "deal_brightline_pilot" });
console.log("quote draft →", quote.run.id, quote.approvalId);

decideApproval(quote.approvalId, "rejected", "smoke reject");
console.log("quote rejected");

console.log("send log entries:", listSendLog().length);
console.log("smoke ok");
