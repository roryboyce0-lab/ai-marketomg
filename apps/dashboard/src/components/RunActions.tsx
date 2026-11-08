"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function RunActions({
  deals,
}: {
  deals: Array<{ id: string; name: string }>;
}) {
  const router = useRouter();
  const [dealId, setDealId] = useState(deals[0]?.id ?? "");
  const [busy, setBusy] = useState<"report" | "quote" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runReport() {
    setBusy("report");
    setError(null);
    try {
      const res = await fetch("/api/runs/daily-report", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to run report");
      router.push(`/approvals/${data.approvalId}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(null);
    }
  }

  async function runQuote() {
    if (!dealId) {
      setError("Select a deal first");
      return;
    }
    setBusy("quote");
    setError(null);
    try {
      const res = await fetch("/api/runs/quote-draft", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ dealId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to draft quote");
      router.push(`/approvals/${data.approvalId}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="stack">
      <div className="actions">
        <button type="button" onClick={runReport} disabled={busy !== null}>
          {busy === "report" ? "Running…" : "Run daily report"}
        </button>
      </div>

      <div className="actions" style={{ alignItems: "center" }}>
        <label className="muted" htmlFor="deal">
          Deal
        </label>
        <select
          id="deal"
          value={dealId}
          onChange={(e) => setDealId(e.target.value)}
          disabled={busy !== null || deals.length === 0}
          style={{ padding: "0.45rem 0.6rem", minWidth: "16rem" }}
        >
          {deals.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="secondary"
          onClick={runQuote}
          disabled={busy !== null || !dealId}
        >
          {busy === "quote" ? "Drafting…" : "Draft quote"}
        </button>
      </div>

      {error ? <p style={{ color: "var(--danger)" }}>{error}</p> : null}
    </div>
  );
}
