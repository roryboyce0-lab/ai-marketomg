import { getRun, getApproval } from "@ai-marketomg/approvals";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function RunDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const run = getRun(id);
  if (!run) notFound();
  const approval = run.approvalId ? getApproval(run.approvalId) : null;

  return (
    <div>
      <h1>Run {run.id}</h1>
      <p className="lede">
        {run.workflow} · <span className={`badge ${run.status}`}>{run.status}</span>
      </p>

      <section className="panel">
        <h2>Details</h2>
        <table>
          <tbody>
            <tr>
              <th>Started</th>
              <td>{new Date(run.startedAt).toLocaleString()}</td>
            </tr>
            <tr>
              <th>Finished</th>
              <td>
                {run.finishedAt
                  ? new Date(run.finishedAt).toLocaleString()
                  : "—"}
              </td>
            </tr>
            <tr>
              <th>Summary</th>
              <td>{run.summary ?? "—"}</td>
            </tr>
            <tr>
              <th>Input</th>
              <td>
                <pre className="draft" style={{ margin: 0 }}>
                  {JSON.stringify(run.input, null, 2)}
                </pre>
              </td>
            </tr>
            {run.error ? (
              <tr>
                <th>Error</th>
                <td style={{ color: "var(--danger)" }}>{run.error}</td>
              </tr>
            ) : null}
            {approval ? (
              <tr>
                <th>Approval</th>
                <td>
                  <a href={`/approvals/${approval.id}`}>
                    {approval.id} ({approval.status})
                  </a>
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </section>

      {run.draft ? (
        <section className="panel">
          <h2>Draft — {run.draft.title}</h2>
          <pre className="draft">{run.draft.bodyMarkdown}</pre>
        </section>
      ) : null}
    </div>
  );
}
