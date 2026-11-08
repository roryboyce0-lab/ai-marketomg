import { loadPilotConfig } from "@ai-marketomg/core";
import { listApprovals, listRuns, listSendLog } from "@ai-marketomg/approvals";
import { createMockCrmAdapter } from "@ai-marketomg/mock-crm";
import { RunActions } from "@/components/RunActions";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const pilot = loadPilotConfig();
  const runs = listRuns();
  const pending = listApprovals("pending");
  const sends = listSendLog();
  const crm = createMockCrmAdapter();
  const deals = await crm.listDeals();

  return (
    <div>
      <h1>Pilot overview</h1>
      <p className="lede">
        Run the daily report against mock CRM data, review drafts, and approve or
        reject before any stub send is logged. Quote drafts share the same
        approval gate.
      </p>

      <div className="grid">
        <div className="stat">
          <div className="label">Runs</div>
          <div className="value">{runs.length}</div>
        </div>
        <div className="stat">
          <div className="label">Pending approvals</div>
          <div className="value">{pending.length}</div>
        </div>
        <div className="stat">
          <div className="label">Stub sends</div>
          <div className="value">{sends.length}</div>
        </div>
        <div className="stat">
          <div className="label">Open deals</div>
          <div className="value">{deals.length}</div>
        </div>
      </div>

      <section className="panel">
        <h2>Trigger workflows</h2>
        <p className="muted">
          Client: {pilot.clientName} · timezone {pilot.timezone} · send mode{" "}
          {pilot.send.mode}
        </p>
        <RunActions deals={deals.map((d) => ({ id: d.id, name: d.name }))} />
      </section>

      <section className="panel">
        <h2>Pending approvals</h2>
        {pending.length === 0 ? (
          <p className="muted">No drafts waiting for a decision.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Workflow</th>
                <th>Title</th>
                <th>Created</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {pending.map((a) => (
                <tr key={a.id}>
                  <td>
                    <span className="badge pending">{a.workflow}</span>
                  </td>
                  <td>{a.draft.title}</td>
                  <td>{new Date(a.createdAt).toLocaleString()}</td>
                  <td>
                    <a href={`/approvals/${a.id}`}>Review</a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="panel">
        <h2>Recent runs</h2>
        {runs.length === 0 ? (
          <p className="muted">No runs yet — trigger a daily report above.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Workflow</th>
                <th>Status</th>
                <th>Summary</th>
                <th>Started</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {runs.slice(0, 8).map((r) => (
                <tr key={r.id}>
                  <td>{r.workflow}</td>
                  <td>
                    <span className={`badge ${r.status}`}>{r.status}</span>
                  </td>
                  <td>{r.summary ?? r.error ?? "—"}</td>
                  <td>{new Date(r.startedAt).toLocaleString()}</td>
                  <td>
                    <a href={`/runs/${r.id}`}>Open</a>
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
