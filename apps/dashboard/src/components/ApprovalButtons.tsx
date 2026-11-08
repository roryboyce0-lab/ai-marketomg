"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ApprovalButtons({ approvalId }: { approvalId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState<"approved" | "rejected" | null>(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function decide(decision: "approved" | "rejected") {
    setBusy(decision);
    setError(null);
    try {
      const res = await fetch(`/api/approvals/${approvalId}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ decision, note: note || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Decision failed");
      router.refresh();
      router.push(decision === "approved" ? "/send-log" : `/approvals/${approvalId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="stack">
      <label className="muted" htmlFor="note">
        Decision note (optional)
      </label>
      <textarea
        id="note"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={2}
        style={{ width: "100%", padding: "0.6rem", font: "inherit" }}
        placeholder="Looks good / needs revision…"
      />
      <div className="actions">
        <button
          type="button"
          onClick={() => decide("approved")}
          disabled={busy !== null}
        >
          {busy === "approved" ? "Approving…" : "Approve & stub send"}
        </button>
        <button
          type="button"
          className="danger"
          onClick={() => decide("rejected")}
          disabled={busy !== null}
        >
          {busy === "rejected" ? "Rejecting…" : "Reject"}
        </button>
      </div>
      {error ? <p style={{ color: "var(--danger)" }}>{error}</p> : null}
    </div>
  );
}
