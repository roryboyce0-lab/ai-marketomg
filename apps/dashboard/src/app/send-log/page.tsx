import { listSendLog } from "@ai-marketomg/approvals";

export const dynamic = "force-dynamic";

export default function SendLogPage() {
  const entries = listSendLog();

  return (
    <div>
      <h1>Send log</h1>
      <p className="lede">
        MVP outbound is stubbed — approvals append an append-only log entry
        instead of sending real email.
      </p>
      <section className="panel">
        {entries.length === 0 ? (
          <p className="muted">No stub sends yet. Approve a draft to create one.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>When</th>
                <th>Channel</th>
                <th>To</th>
                <th>Subject</th>
                <th>Preview</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.id}>
                  <td>{new Date(e.loggedAt).toLocaleString()}</td>
                  <td>
                    <span className="badge">{e.channel}</span>
                  </td>
                  <td>{e.to.join(", ")}</td>
                  <td>
                    <a href={`/approvals/${e.approvalId}`}>{e.subject}</a>
                  </td>
                  <td className="muted">{e.bodyPreview}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
