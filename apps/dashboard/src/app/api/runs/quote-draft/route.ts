import { NextResponse } from "next/server";
import { runQuoteDraft } from "@ai-marketomg/agent";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { dealId?: string };
    if (!body.dealId) {
      return NextResponse.json({ error: "dealId is required" }, { status: 400 });
    }
    const result = await runQuoteDraft({ dealId: body.dealId });
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
