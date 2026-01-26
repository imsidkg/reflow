import { NextRequest, NextResponse } from "next/server";
import { inngest } from "@/inngest/client";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params;

  await inngest.send({
    name: "ui/generate",
    data: { projectId },
  });

  return NextResponse.json({ success: true, message: "Started" });
}
