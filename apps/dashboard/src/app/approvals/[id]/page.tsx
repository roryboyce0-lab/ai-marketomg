import { getApproval, getRun } from "@ai-marketomg/approvals";
import { notFound } from "next/navigation";
import { ApprovalButtons } from "@/components/ApprovalButtons";

export const dynamic = "force-dynamic";

export default async function ApprovalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const approval = getApproval(id);
  if (!approval) notFound();
  const run = getRun(approval.runId);

  return (
    <div>
      <h1>{approval.draft.title}</h1>
      <p className="lede">
        {approval.workflow} ·{" "}
        <span className={`badge ${approval.status}`}>{approval.status}</span>
        {run ? (
          <>
            {" "}
            · run <a href={`/runs/${run.id}`}>{run.id}</a>
          </>
        ) : null}
      </p>

      {approval.status === "pending" ? (
        <section className="panel">
          <h2>Decision</h2>
          <ApprovalButtons approvalId={approval.id} />
        </section>
      ) : (
        <section className="panel">
          <h2>Decision recorded</h2>
          <p>
            {approval.status} at{" "}
            {approval.decidedAt
              ? new Date(approval.decidedAt).toLocaleString()
              : "—"}
          </p>
          {approval.decisionNote ? (
            <p className="muted">Note: {approval.decisionNote}</p>
          ) : null}
        </section>
      )}

      <section className="panel">
        <h2>Draft</h2>
        <pre className="draft">{approval.draft.bodyMarkdown}</pre>
      </section>
    </div>
  );
}
