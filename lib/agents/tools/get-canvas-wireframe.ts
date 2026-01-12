import { createTool } from "@inngest/agent-kit";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export const getCanvasWireframeTool = createTool({
  name: "get_canvas_wireframe",
  description: "Gets the canvas wireframe shapes data for a project",
  parameters: z.object({ projectId: z.string() }),
  handler: async ({ projectId }) => {
    const canvas = await prisma.canvas.findUnique({
      where: { projectId },
      select: {
        shapes: true,
        frameCounter: true,
        viewport: true,
      },
    });

    if (!canvas) {
      return {
        success: false,
        error: "No canvas found for this project",
      };
    }

    return {
      success: true,
      shapes: canvas.shapes,
      frameCount: canvas.frameCounter,
      viewport: canvas.viewport,
    };
  },
});
