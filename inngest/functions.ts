import { prisma } from "@/lib/prisma";
import { inngest } from "./client";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { userPrompts } from "@/lib/agents/prompts";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { extractKeyFromUrl } from "@/lib/s3-uploads";
import { generativeUiAgent, workflowAgent } from "@/lib/agents";
import { pusherServer } from "@/lib/pusher";

const genAI = new GoogleGenerativeAI(
  process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY!,
);

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export const generateStyleGuide = inngest.createFunction(
  {
    id: "generate-style-guide",
    name: "Generate Style Guide",
    concurrency: { limit: 2 }, // Limit concurrent AI calls
  },
  {
    event: "style-guide/generate",
  },

  async ({ event, step }) => {
    const { projectId } = event.data;

    // 1. Fetch Image URLs from DB
    const moodBoards = await step.run("fetch-mood-boards", async () => {
      return prisma.moodBoard.findMany({
        where: { projectId },
        select: { url: true },
        orderBy: { createdAt: "desc" },
      });
    });

    if (moodBoards.length === 0) throw new Error("No images found");

    // 2. Download Images (Multimodal Prep) via S3 SDK
    const imagesParts = await step.run("prepare-images", async () => {
      const parts = await Promise.all(
        moodBoards.map(async (mb) => {
          try {
            console.log(`Processing image: ${mb.url}`);

            // Extract S3 key from URL
            const key = extractKeyFromUrl(mb.url);
            if (!key) {
              console.error(`Could not extract key from URL: ${mb.url}`);
              return null;
            }

            const command = new GetObjectCommand({
              Bucket: process.env.AWS_S3_BUCKET_NAME,
              Key: key,
            });

            const response = await s3Client.send(command);

            if (!response.Body) {
              console.error(`Empty body for key: ${key}`);
              return null;
            }

            // Convert stream to buffer
            const byteArray = await response.Body.transformToByteArray();
            const buffer = Buffer.from(byteArray);
            const base64 = buffer.toString("base64");

            console.log(
              `Successfully downloaded ${key} from S3 (${base64.length} bytes)`,
            );

            return {
              inlineData: {
                data: base64,
                mimeType: response.ContentType || "image/jpeg",
              },
            };
          } catch (e) {
            console.error(`Failed to download image from S3 ${mb.url}`, e);
            return null;
          }
        }),
      );

      const validParts = parts.filter((p) => p !== null);
      console.log(
        `Processed ${validParts.length} valid images out of ${moodBoards.length}`,
      );

      return validParts;
    });

    if (imagesParts.length === 0) {
      console.error(
        "All image downloads failed. Check server logs for details.",
      );
      throw new Error("Failed to process images - all downloads failed");
    }

    // 3. Call Gemini Directly (No Agent Kit)
    const result = await step.run("generate-with-gemini", async () => {
      const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash",
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: SchemaType.OBJECT,
            properties: {
              colors: {
                type: SchemaType.ARRAY,
                items: {
                  type: SchemaType.OBJECT,
                  properties: {
                    name: { type: SchemaType.STRING },
                    hexColor: { type: SchemaType.STRING },
                    description: { type: SchemaType.STRING },
                  },
                  required: ["name", "hexColor"],
                },
              },
              typography: {
                type: SchemaType.ARRAY,
                items: {
                  type: SchemaType.OBJECT,
                  properties: {
                    name: { type: SchemaType.STRING },
                    fontFamily: { type: SchemaType.STRING },
                    fontSize: { type: SchemaType.STRING },
                    fontWeight: { type: SchemaType.STRING },
                    lineHeight: { type: SchemaType.STRING },
                    description: { type: SchemaType.STRING },
                  },
                  required: [
                    "name",
                    "fontFamily",
                    "fontSize",
                    "fontWeight",
                    "lineHeight",
                  ],
                },
              },
              themeName: { type: SchemaType.STRING },
              themeDescription: { type: SchemaType.STRING },
            },
            required: ["colors", "typography", "themeName"],
          },
        },
      });

      const prompt = `Analyze these mood board images and generate a design system. Return JSON.
      
      IMPORTANT: Extract a COMPREHENSIVE color palette. You must include the following semantic colors if possible, or derive them:
      - background (Main page background)
      - foreground (Main text color)
      - card (Component background)
      - cardForeground (Component text)
      - primary (Main brand color)
      - primaryForeground (Text on primary)
      - secondary (Supporting color)
      - secondaryForeground (Text on secondary)
      - accent (Highlights)
      - accentForeground (Text on highlights)
      - muted (Subtle backgrounds)
      - mutedForeground (Subtle text)
      - destructive (Error states)
      - destructiveForeground (Text on errors)
      - border (Dividers)
      - input (Form inputs)
      - ring (Focus rings)

      If the images are screenshots of code or text, extract the syntax highlighting colors as additional accent colors.
      NEVER return an empty colors array. Aim for 10-15 defined colors.`;

      const result = await model.generateContent([prompt, ...imagesParts]);
      const response = await result.response;
      return JSON.parse(response.text());
    });

    // 4. Save to Database
    const savedStyleGuide = await step.run("save-result", async () => {
      // The result from step 3 is already a JSON object because we used responseSchema
      // But safety check just in case it's a string
      const parsedData =
        typeof result === "string" ? JSON.parse(result) : result;

      console.log(
        "Saving Style Guide Data:",
        JSON.stringify(parsedData, null, 2),
      );

      if (!parsedData.colors || parsedData.colors.length === 0) {
        console.warn("AI returned no colors. Using fallback.");
      }

      const styleGuide = await prisma.styleGuide.upsert({
        where: { projectId },
        create: {
          projectId,
          colors: parsedData.colors || [],
          typography: parsedData.typography || [],
          themeName: parsedData.themeName || "Generated Theme",
          themeDesc: parsedData.themeDescription || "AI Generated Style Guide",
        },
        update: {
          colors: parsedData.colors || [],
          typography: parsedData.typography || [],
          themeName: parsedData.themeName || "Generated Theme",
          themeDesc: parsedData.themeDescription || "AI Generated Style Guide",
        },
      });

      return styleGuide;
    });

    return { success: true };
  },
);

export const generateUI = inngest.createFunction(
  { id: "generate-ui", name: "Generate UI from Wireframe" },
  { event: "ui/generate" },
  async ({ event, step }) => {
    const { projectId, shapeId } = event.data;

    const data = await step.run("fetch-data", async () => {
      const [sg, dv, mbs] = await Promise.all([
        prisma.styleGuide.findUnique({ where: { projectId } }),
        prisma.canvas.findUnique({
          where: { projectId },
          select: { shapes: true },
        }),
        prisma.moodBoard.findMany({
          where: { projectId },
          select: { url: true },
          take: 6,
        }),
      ]);
      return {
        styleGuide: sg,
        canvas: dv,
        moodBoards: mbs,
      };
    });

    if (!data.styleGuide) throw new Error("Style guide missing");
    if (!data.canvas) throw new Error("Canvas missing");

    // 0. Filter for specific shape if ID provided to get context
    let sourceWireframeData: any = null;
    let sourceShape: any = null;
    let basePrompt = "";

    if (shapeId && (data.canvas?.shapes as any)?.ids?.includes(shapeId)) {
      const entities = (data.canvas?.shapes as any).entities;
      sourceShape = entities[shapeId];
      sourceWireframeData = sourceShape;
      console.log("Found source shape:", sourceShape?.id);
    } else {
      console.warn("Source shape NOT found for ID:", shapeId);
    }

    const colors = data.styleGuide?.colors as any[];
    const typography = data.styleGuide?.typography as any[];

    // 1. Plan the Workflow
    const workflowPlan = await step.run("plan-workflow", async () => {
      const prompt = userPrompts.generateWorkflow(
        sourceWireframeData
          ? JSON.stringify(sourceWireframeData)
          : "Generic Web App",
      );
      const result = await workflowAgent.run(prompt);
      try {
        // Attempt to parse if it's a string, otherwise assume object
        return typeof result === "string"
          ? JSON.parse(
              (result as string).replace(/```json/g, "").replace(/```/g, ""),
            )
          : result;
      } catch (e) {
        console.error("Failed to parse workflow plan", e);
        // Fallback to single step if parsing fails
        return {
          steps: [
            {
              title: "Generated UI",
              description: "Generate the UI based on the wireframe",
            },
          ],
        };
      }
    });

    console.log("Workflow Plan:", workflowPlan);

    // 2. Download images from S3 (Once for all steps)
    const imagesParts = await step.run("download-images", async () => {
      return await Promise.all(
        data.moodBoards.map(async (mb) => {
          try {
            const key = extractKeyFromUrl(mb.url);
            if (!key) return null;

            const command = new GetObjectCommand({
              Bucket: process.env.AWS_S3_BUCKET_NAME,
              Key: key,
            });

            const s3Response = await s3Client.send(command);
            const byteArray = await s3Response.Body?.transformToByteArray();

            if (!byteArray) return null;

            return {
              inlineData: {
                data: Buffer.from(byteArray).toString("base64"),
                mimeType: "image/png",
              },
            };
          } catch (error) {
            console.error(`Failed to download image ${mb.url}:`, error);
            return null;
          }
        }),
      ).then((parts) => parts.filter((p) => p !== null));
    });

    // 3. Execute Generation in Parallel
    const steps = workflowPlan.steps || [];

    // We run all generations in ONE step to allow Promise.all parallelization.
    // Inngest steps run sequentially, so we can't loop step.run.
    // Instead we do the parallel work inside one step.
    const generatedIds = await step.run(
      "generate-screens-parallel",
      async () => {
        const generationPromises = steps.map(
          async (workflowStep: any, i: number) => {
            console.log(
              `Starting generation for Step ${i + 1}: ${workflowStep.title}`,
            );

            const basePrompt = userPrompts.generateUi(
              [{ swatches: colors || [] }],
              [{ styles: typography || [] }],
            );

            const fullPrompt = `${basePrompt}

Wireframe Data (Context):
${JSON.stringify(sourceWireframeData)}

Task:
Generate the screen for: "${workflowStep.title}".
Description: ${workflowStep.description}.
Use the wireframe as a loose layout guide but adapt it for this specific screen's purpose.

Instructions:
Generate the HTML based on the style guide. 
Ignore the image URLs in the prompt text below as I have provided the actual image data above.
`;

            const model = genAI.getGenerativeModel({
              model: "gemini-2.0-flash",
              generationConfig: {
                responseMimeType: "text/plain",
              },
            });

            const result = await model.generateContent([
              fullPrompt,
              ...imagesParts,
            ]);
            const response = await result.response;
            let text = response.text();
            text = text.replace(/```html/g, "").replace(/```/g, "");

            // SAVE
            const htmlContent =
              typeof text === "string" ? text : JSON.stringify(text);

            const generatedUIRecord = await prisma.generatedUI.create({
              data: {
                projectId,
                html: htmlContent,
                name: `${workflowStep.title} - ${new Date().toLocaleString()}`,
              },
            });

            // UPDATE CANVAS
            if (shapeId && sourceShape) {
              const currentCanvas = await prisma.canvas.findUnique({
                where: { projectId },
                select: { shapes: true },
              });

              if (currentCanvas?.shapes) {
                const shapesFn = currentCanvas.shapes as any;
                const newShapeId = crypto.randomUUID();

                // Layout: Place subsequent screens to the right
                const gap = 50;
                const offsetX = (i + 1) * (sourceShape.w + gap); // Shift starting from 1st offset

                const newShape = {
                  id: newShapeId,
                  type: "generatedui",
                  x: sourceShape.x + offsetX, // Dynamic X
                  y: sourceShape.y, // Align Top
                  w: sourceShape.w,
                  h: sourceShape.h,
                  uiSpecData: htmlContent,
                  sourceFrameId: shapeId,
                  stroke: "transparent",
                  strokeWidth: 0,
                  fill: null,
                  title: workflowStep.title,
                };

                shapesFn.ids.push(newShapeId);
                shapesFn.entities[newShapeId] = newShape;

                await prisma.canvas.update({
                  where: { projectId },
                  data: { shapes: shapesFn },
                });

                // TRIGGER PUSHER
                await pusherServer.trigger(
                  `project-${projectId}`,
                  "ui-generated",
                  {
                    ...newShape,
                  },
                );
              }
            }
            return generatedUIRecord.id;
          },
        );

        return await Promise.all(generationPromises);
      },
    );

    // 4. Notify Workflow Complete
    await step.run("notify-complete", async () => {
      await pusherServer.trigger(`project-${projectId}`, "workflow-complete", {
        count: generatedIds.length,
      });
    });

    return { success: true, count: generatedIds.length };
  },
);
