import { NextRequest, NextResponse } from "next/server";
import { inngest } from "@/inngest/client";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params;

  try {
    const body = await req.json();
    const { shapeId } = body;

    await inngest.send({
      name: "ui/generate",
      data: { projectId, shapeId },
    });

    return NextResponse.json({ success: true, message: "Started" });
  } catch (error) {
    console.error("[API] Error sending to Inngest:", error);
    return NextResponse.json(
      { error: "Failed to start generation" },
      { status: 500 },
    );
  }
}
