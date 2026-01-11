import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { deleteFromS3, extractKeyFromUrl } from "@/lib/s3-uploads";
import { getCurrentUser } from "@/lib/auth";

type Params = { params: Promise<{ projectId: string; imageId: string }> };

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const { projectId, imageId } = await params;
    const session = await getCurrentUser();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId, userId: session.user.id },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const moodBoard = await prisma.moodBoard.findUnique({
      where: { id: imageId, projectId },
    });

    if (!moodBoard) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    const key = extractKeyFromUrl(moodBoard.url);
    if (key) {
      await deleteFromS3(key);
    }

    await prisma.moodBoard.delete({
      where: { id: imageId },
    });

    return NextResponse.json(
      { message: "Image deleted successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error deleting mood board image:", error);
    return NextResponse.json(
      { error: "Failed to delete image" },
      { status: 500 }
    );
  }
}
