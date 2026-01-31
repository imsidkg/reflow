import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> },
) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId } = await params;

    const project = await prisma.project.findFirst({
      where: { id: projectId, userId: session.user.id },
      include: { canvas: true },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (!project.canvas) {
      return NextResponse.json({ canvas: null });
    }

    return NextResponse.json({ canvas: project.canvas });
  } catch (error) {
    console.error("Load canvas error:", error);
    return NextResponse.json(
      { error: "Failed to load canvas" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> },
) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId } = await params;
    const body = await request.json();

    const project = await prisma.project.findFirst({
      where: { id: projectId, userId: session.user.id },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const { shapes, selected, tool, frameCounter, viewport } = body;

    // Fetch current canvas to check for background updates (e.g. generated UI)
    const currentCanvas = await prisma.canvas.findUnique({
      where: { projectId },
      select: { shapes: true },
    });

    let mergedShapes = shapes;

    // Smart Merge: Preserve 'generatedui' shapes that exist in DB but are missing from payload
    // This handles the race condition where Inngest adds a shape while Frontend is auto-saving old state
    if (currentCanvas?.shapes) {
      const dbShapes = currentCanvas.shapes as any;
      const payloadShapes = shapes as any;

      if (dbShapes.entities && payloadShapes.entities) {
        Object.values(dbShapes.entities).forEach((shape: any) => {
          if (shape.type === "generatedui") {
            // If this generated shape is NOT in the incoming payload, re-add it
            if (!payloadShapes.entities[shape.id]) {
              console.log(
                `[Smart Merge] Preserving generated shape ${shape.id} lost in auto-save`,
              );
              mergedShapes.entities[shape.id] = shape;
              if (!mergedShapes.ids.includes(shape.id)) {
                mergedShapes.ids.push(shape.id);
              }
            }
          }
        });
      }
    }

    const canvas = await prisma.canvas.upsert({
      where: { projectId },
      create: {
        projectId,
        shapes: shapes,
        selected: selected,
        tool: tool || "select",
        frameCounter: frameCounter || 0,
        viewport: viewport,
      },
      update: {
        shapes: mergedShapes, // Use the merged version
        selected: selected,
        tool: tool || "select",
        frameCounter: frameCounter || 0,
        viewport: viewport,
      },
    });

    return NextResponse.json({ success: true, canvas });
  } catch (error) {
    console.error("Save canvas error:", error);
    return NextResponse.json(
      { error: "Failed to save canvas" },
      { status: 500 },
    );
  }
}
