import { listApprovals } from "@ai-marketomg/approvals";

export const dynamic = "force-dynamic";

export default function ApprovalsPage() {
  const approvals = listApprovals();

  return (
    <div>
      <h1>Approvals</h1>
      <p className="lede">
        Human gate before any outbound action. Approve logs a stub send; reject
        leaves the draft closed without sending.
      </p>
      <section className="panel">
        {approvals.length === 0 ? (
          <p className="muted">No approval records yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Status</th>
                <th>Workflow</th>
                <th>Title</th>
                <th>Created</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {approvals.map((a) => (
                <tr key={a.id}>
                  <td>
                    <span className={`badge ${a.status}`}>{a.status}</span>
                  </td>
                  <td>{a.workflow}</td>
                  <td>{a.draft.title}</td>
                  <td>{new Date(a.createdAt).toLocaleString()}</td>
                  <td>
                    <a href={`/approvals/${a.id}`}>View</a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
