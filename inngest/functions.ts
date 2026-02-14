import { prisma } from "@/lib/prisma";
import { inngest } from "./client";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { userPrompts, prompts } from "@/lib/agents/prompts";
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
      // Sanitize sourceWireframeData immediately to remove heavy fields
      if (sourceShape) {
        const { uiSpecData, html, data, ...rest } = sourceShape;
        sourceWireframeData = rest;
      } else {
        sourceWireframeData = sourceShape;
      }
      console.log("Found source shape:", sourceShape?.id);
    } else {
      console.warn("Source shape NOT found for ID:", shapeId);
    }

    const colors = data.styleGuide?.colors as any[];
    const typography = data.styleGuide?.typography as any[];

    // 1. Plan the Workflow
    const workflowPlan = await step.run("plan-workflow", async () => {
      // sanitize sourceWireframeData to remove huge fields
      let cleanData = "Generic Web App";
      if (sourceWireframeData) {
        const { uiSpecData, html, ...rest } = sourceWireframeData;
        cleanData = JSON.stringify(rest);
      }

      const prompt = userPrompts.generateWorkflow(cleanData);

      console.log("Planning workflow with data length:", cleanData.length);
      console.time("Workflow Agent");

      try {
        // Add timeout to prevent hanging
        const result = await Promise.race([
          workflowAgent.run(prompt),
          new Promise((_, reject) =>
            setTimeout(
              () => reject(new Error("Workflow planning timed out")),
              45000,
            ),
          ),
        ]);

        console.timeEnd("Workflow Agent");
        console.log(
          "Raw Workflow Agent Result:",
          JSON.stringify(result, null, 2),
        );

        // Attempt to parse if it's a string, otherwise assume object
        const parsed =
          typeof result === "string"
            ? JSON.parse(
                (result as string).replace(/```json/g, "").replace(/```/g, ""),
              )
            : result;

        return parsed;
      } catch (e) {
        console.error("Failed to plan workflow or timed out", e);
        console.timeEnd("Workflow Agent");

        // Fallback to minimal diverse flow
        return {
          steps: [
            { title: "Authentication", description: "Login or Sign up screen" },
            {
              title: "Dashboard",
              description: "Main user dashboard with overview",
            },
            { title: "Settings", description: "User preferences and settings" },
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

    const generatedIds = await step.run(
      "generate-screens-parallel",
      async () => {
        console.time("Total Parallel Generation Time");

        // A. Start all AI allocations in parallel
        const aiPromises = steps.map(async (workflowStep: any, i: number) => {
          console.log(
            `[Parallel] Starting AI generation for Step ${i + 1}: ${workflowStep.title}`,
          );
          console.time(`AI Gen Step ${i + 1}`);

          const basePrompt = userPrompts.generateUi(
            [{ swatches: colors || [] }],
            [{ styles: typography || [] }],
          );

          const fullPrompt = `${basePrompt}

Wireframe Data (Context):
${JSON.stringify(sourceWireframeData)}

TASK:
Generate the screen for: "${workflowStep.title}".
Description: ${workflowStep.description}.

CRITICAL INSTRUCTION:
1. The Wireframe Data above is for STYLE and SPATIAL REFERENCE only.
2. If the Task ("${workflowStep.title}") requires a different structure than the Wireframe (e.g. Task is "Dashboard" but Wireframe is "Login"), you MUST DISCARD the specific wireframe layout (inputs, buttons) and generate a correct layout for the Task.
3. You represent the "Style" of the wireframe (colors, rounding, spacing) but you are FREE to change the "Structure" to fit the new screen type.
4. DO NOT generate a Login page for a Dashboard task.

Instructions:
Generate the HTML based on the style guide. 
Ignore the image URLs in the prompt text below as I have provided the actual image data above.
`;

          try {
            // Create a fresh model instance for each request to avoid shared state issues
            const model = genAI.getGenerativeModel({
              model: "gemini-2.0-flash",
              systemInstruction: prompts.generativeUi.system,
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

            console.timeEnd(`AI Gen Step ${i + 1}`);

            return {
              index: i,
              workflowStep,
              html: typeof text === "string" ? text : JSON.stringify(text),
              success: true,
            };
          } catch (error) {
            console.error(`AI Generation failed for step ${i}:`, error);
            console.timeEnd(`AI Gen Step ${i + 1}`);
            return { index: i, workflowStep, success: false, error };
          }
        });

        // B. Wait for ALL AI to finish
        const results = await Promise.all(aiPromises);
        console.timeEnd("Total Parallel Generation Time");

        const validResults = results.filter((r) => r.success);

        console.log(
          `[Parallel] AI Finished. Saving ${validResults.length} generated screens sequentially...`,
        );

        // C. Save to DB Sequentially (to avoid Race Conditions on Canvas JSON)
        const savedIds: string[] = [];

        for (const res of validResults) {
          const { index, workflowStep, html } = res as any;
          console.log(
            `[Saving] Persisting Step ${index + 1}: ${workflowStep.title}`,
          );

          // 1. Create Record
          const generatedUIRecord = await prisma.generatedUI.create({
            data: {
              projectId,
              html,
              name: `${workflowStep.title} - ${new Date().toLocaleString()}`,
            },
          });

          // 2. Update Canvas (Safe because we are in a loop)
          if (shapeId && sourceShape) {
            // Re-fetch canvas every time to ensure we have the LATEST version (avoid overwrites)
            const currentCanvas = await prisma.canvas.findUnique({
              where: { projectId },
              select: { shapes: true },
            });

            if (currentCanvas?.shapes) {
              const shapesFn = currentCanvas.shapes as any;
              const newShapeId = crypto.randomUUID();

              // Layout: Place subsequent screens to the right
              const gap = 50;
              const offsetX = (index + 1) * (sourceShape.w + gap);

              const newShape = {
                id: newShapeId,
                type: "generatedui",
                x: sourceShape.x + offsetX,
                y: sourceShape.y,
                w: sourceShape.w,
                h: sourceShape.h,
                uiSpecData: html,
                sourceFrameId: shapeId,
                stroke: "transparent",
                strokeWidth: 0,
                fill: null,
                title:
                  workflowStep.title ||
                  workflowStep.name ||
                  `Step ${index + 1}`,
                createdAt: Date.now(),
              };

              shapesFn.ids.push(newShapeId);
              shapesFn.entities[newShapeId] = newShape;

              await prisma.canvas.update({
                where: { projectId },
                data: { shapes: shapesFn },
              });

              // 3. Trigger Pusher
              console.log(
                `[Pusher] Triggering ui-generated for Step ${index + 1}`,
              );
              await pusherServer.trigger(
                `project-${projectId}`,
                "ui-generated",
                { ...newShape },
              );

              savedIds.push(newShapeId);
            }
          }
        }

        return savedIds;
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

export const refineUI = inngest.createFunction(
  { id: "refine-ui", name: "Refine Generated UI" },
  { event: "ui/refine" },
  async ({ event, step }) => {
    const { projectId, shapeId, refinementPrompt, selectedElement } =
      event.data;

    const data = await step.run("fetch-shape", async () => {
      const canvas = await prisma.canvas.findUnique({
        where: { projectId },
        select: { shapes: true },
      });

      if (!canvas?.shapes) throw new Error("Canvas missing");

      const shapesFn = canvas.shapes as any;
      const shape = shapesFn.entities[shapeId];

      if (!shape) throw new Error("Shape not found");

      // Also get style guide for reference
      const styleGuide = await prisma.styleGuide.findUnique({
        where: { projectId },
      });

      return { shape, styleGuide };
    });

    // Generate refined HTML
    const result = await step.run("generate-refinement", async () => {
      const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash",
        systemInstruction: prompts.generativeUi.system,
        generationConfig: {
          responseMimeType: "text/plain",
        },
      });

      const currentHtml = data.shape.uiSpecData;
      const colors = data.styleGuide?.colors || [];
      const typography = data.styleGuide?.typography || [];

      let promptContext = "";
      if (selectedElement) {
        promptContext = `
        USER SELECTED ELEMENT:
        Tag: ${selectedElement.tagName}
        Text: "${selectedElement.text}"
        HTML: \`${selectedElement.html}\`
        XPath/Location: ${selectedElement.xpath}

        INSTRUCTION: Only apply changes to the selected element or elements related to it, unless the prompt implies a global change.
        `;
      } else {
        promptContext = "INSTRUCTION: Apply changes to the entire UI design.";
      }

      const prompt = `
      You are an expert UI engineer and designer.
      
      CURRENT HTML:
      \`\`\`html
      ${currentHtml}
      \`\`\`

      STYLE GUIDE CONTEXT:
      Colors: ${JSON.stringify(colors)}
      Typography: ${JSON.stringify(typography)}

      ${promptContext}

      USER REFINEMENT REQUEST: "${refinementPrompt}"

      TASK:
      1. Modify the HTML to satisfy the user's request.
      2. Ensure you maintain the existing style system and only change what is requested.
      3. Return the FULL updated HTML string.
      4. Do NOT output markdown ticks (Example: no \`\`\`html). Just the raw HTML code.
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      let text = response.text();
      // Cleanup
      text = text.replace(/```html/g, "").replace(/```/g, "");
      return text;
    });

    // Update DB
    await step.run("update-canvas", async () => {
      // Re-fetch to ensure atomicity/latest state
      const canvas = await prisma.canvas.findUnique({
        where: { projectId },
        select: { shapes: true },
      });

      if (canvas?.shapes) {
        const shapesFn = canvas.shapes as any;

        // Update the specific shape
        if (shapesFn.entities[shapeId]) {
          shapesFn.entities[shapeId].uiSpecData = result;
          // Update timestamp to force unexpected re-renders if needed
          shapesFn.entities[shapeId].updatedAt = Date.now();
        }

        await prisma.canvas.update({
          where: { projectId },
          data: { shapes: shapesFn },
        });

        // Trigger pusher update
        await pusherServer.trigger(`project-${projectId}`, "shape-updated", {
          ...shapesFn.entities[shapeId],
        });

        // Also trigger explicit refinement completion
        await pusherServer.trigger(`project-${projectId}`, "ui-refined", {
          success: true,
          shapeId,
          ...shapesFn.entities[shapeId],
        });
      }
    });

    return { success: true };
  },
);
