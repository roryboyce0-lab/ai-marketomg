import { NextResponse } from "next/server";
import { decideApproval, getApproval } from "@ai-marketomg/approvals";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const approval = getApproval(id);
  if (!approval) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(approval);
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  try {
    const body = (await request.json()) as {
      decision?: "approved" | "rejected";
      note?: string;
    };
    if (body.decision !== "approved" && body.decision !== "rejected") {
      return NextResponse.json(
        { error: "decision must be approved or rejected" },
        { status: 400 }
      );
    }
    const result = decideApproval(id, body.decision, body.note);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 400 }
    );
  }
}
