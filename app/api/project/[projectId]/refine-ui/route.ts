import { NextRequest, NextResponse } from "next/server";
import { inngest } from "@/inngest/client";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params;

  try {
    const body = await req.json();
    const { shapeId, prompt, selectedElement } = body;

    console.log(
      "[API] Received refine-ui request for shape:",
      shapeId,
      "project:",
      projectId,
    );

    await inngest.send({
      name: "ui/refine",
      data: {
        projectId,
        shapeId,
        refinementPrompt: prompt,
        selectedElement,
      },
    });

    return NextResponse.json({ success: true, message: "Started" });
  } catch (error) {
    console.error("[API] Error sending to Inngest:", error);
    return NextResponse.json(
      { error: "Failed to start refinement" },
      { status: 500 },
    );
  }
}
