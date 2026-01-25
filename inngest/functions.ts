import { prisma } from "@/lib/prisma";
import { inngest } from "./client";
import { styleGuideAgent, userPrompts } from "@/lib/agents";

export const helloWorld = inngest.createFunction(
  { id: "hello-world" },
  { event: "test/hello.world" },
  async ({ event, step }) => {
    await step.sleep("wait-a-moment", "1s");
    return { message: `Hello ${event.data.email}!` };
  },
);

export const generateStyleGuide = inngest.createFunction(
  {
    id: "generate-style-guide",
    name: "Generate Style Guide",
  },
  {
    event: "style-guide/generate",
  },

  async ({ event, step }) => {
    const { projectId } = event.data;

    const moodBoards = await step.run("fetch-mood-boards", async () => {
      return prisma.moodBoard.findMany({
        where: { projectId },
        select: { url: true },
        orderBy: { createdAt: "desc" },
      });
    });

    if (moodBoards.length === 0) throw new Error("No images found");

    const result = await step.run("run-ai-agent", async () => {
      const imageUrls = moodBoards.map((mb) => mb.url);
      const prompt = `${userPrompts.styleGuide(imageUrls.length)}\n\nImages:\n${imageUrls.join("\n")}`;
      return styleGuideAgent.run(prompt);
    });

    await step.run("save-result", async () => {
      const parsedData = JSON.parse(result);
      await prisma.
    });
  },
);
