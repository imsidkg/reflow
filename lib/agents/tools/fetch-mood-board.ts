import { createTool } from "@inngest/agent-kit";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export const fetchMoodBoardTool = createTool({
  name: "fetch_mood_board_images",
  description: "Fetches all mood board image URLs for a project",
  parameters: z.object({ projectId: z.string() }),
  handler: async ({ projectId }) => {
    const moodBoards = await prisma.moodBoard.findMany({
      where: { projectId },
      select: {
        id: true,
        url: true,
        filename: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return {
      count: moodBoards.length,
      images: moodBoards.map((mb) => ({
        id: mb.id,
        url: mb.url,
        filename: mb.filename,
      })),
    };
  },
});
