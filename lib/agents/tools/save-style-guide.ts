import { createTool } from "@inngest/agent-kit";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const colorSwatchSchema = z.object({
  name: z.string(),
  hexColor: z.string(),
  description: z.string().optional(),
});

const typographyStyleSchema = z.object({
  name: z.string(),
  fontFamily: z.string(),
  fontSize: z.string(),
  fontWeight: z.string(),
  lineHeight: z.string(),
  description: z.string().optional(),
});

export const saveStyleGuideTool = createTool({
  name: "save_style_guide",
  description:
    "Saves generated colors and typography to the project's style guide",
  parameters: z.object({
    projectId: z.string(),
    colors: z.array(colorSwatchSchema),
    typography: z.array(typographyStyleSchema),
    themeName: z.string().optional(),
    themeDescription: z.string().optional(),
  }),
  handler: async ({
    projectId,
    colors,
    typography,
    themeName,
    themeDescription,
  }) => {
    const styleGuide = await prisma.styleGuide.upsert({
      where: { projectId },
      create: {
        projectId,
        colors: colors,
        typography: typography,
        themeName: themeName || null,
        themeDesc: themeDescription || null,
      },
      update: {
        colors: colors,
        typography: typography,
        themeName: themeName || null,
        themeDesc: themeDescription || null,
      },
    });

    return {
      success: true,
      styleGuideId: styleGuide.id,
      message: `Saved ${colors.length} colors and ${typography.length} typography styles`,
    };
  },
});
