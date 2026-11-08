import { listRuns } from "@ai-marketomg/approvals";

export const dynamic = "force-dynamic";

export default function RunsPage() {
  const runs = listRuns();

  return (
    <div>
      <h1>Run history</h1>
      <p className="lede">Every agent invocation for this pilot, newest first.</p>
      <section className="panel">
        {runs.length === 0 ? (
          <p className="muted">No runs recorded yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Workflow</th>
                <th>Status</th>
                <th>Summary</th>
                <th>Started</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((r) => (
                <tr key={r.id}>
                  <td>
                    <a href={`/runs/${r.id}`}>{r.id}</a>
                  </td>
                  <td>{r.workflow}</td>
                  <td>
                    <span className={`badge ${r.status}`}>{r.status}</span>
                  </td>
                  <td>{r.summary ?? r.error ?? "—"}</td>
                  <td>{new Date(r.startedAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
