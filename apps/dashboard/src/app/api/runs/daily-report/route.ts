import { NextResponse } from "next/server";
import { runDailyReport } from "@ai-marketomg/agent";

export async function POST() {
  try {
    const result = await runDailyReport();
    return NextResponse.json({
      runId: result.run.id,
      approvalId: result.approvalId,
      status: result.run.status,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
