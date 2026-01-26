import { NextRequest, NextResponse } from "next/server";
import { inngest } from "@/inngest/client";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params;

  const styleGuide = await prisma.styleGuide.findUnique({
    where: { projectId },
  });

  return NextResponse.json({ styleGuide });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params;

  await inngest.send({
    name: "style-guide/generate",
    data: { projectId },
  });

  return NextResponse.json({ success: true, message: "Started" });
}
