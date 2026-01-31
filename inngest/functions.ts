import { prisma } from "@/lib/prisma";
import { inngest } from "./client";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { userPrompts } from "@/lib/agents/prompts";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { extractKeyFromUrl } from "@/lib/s3-uploads";

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

import { generativeUiAgent } from "@/lib/agents";

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

    const result = await step.run("generate-with-gemini", async () => {
      // 1. Download images from S3
      const imagesParts = await Promise.all(
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
                mimeType: "image/png", // Assuming PNG, but could assume based on file extension if needed
              },
            };
          } catch (error) {
            console.error(`Failed to download image ${mb.url}:`, error);
            return null;
          }
        }),
      ).then((parts) => parts.filter((p) => p !== null));

      const colors = data.styleGuide?.colors as any[];
      const typography = data.styleGuide?.typography as any[];

      const basePrompt = userPrompts.generateUi(
        [{ swatches: colors || [] }],
        [{ styles: typography || [] }],
      );

      // Filter for specific shape if ID provided
      let wireframeData = data.canvas?.shapes;
      if (shapeId && (data.canvas?.shapes as any)?.ids?.includes(shapeId)) {
        const entities = (data.canvas?.shapes as any).entities;
        wireframeData = entities[shapeId];
      }

      const fullPrompt = `${basePrompt}

Wireframe Data:
${JSON.stringify(wireframeData)}

Instructions:
Generate the HTML based on the wireframe and style guide. 
Ignore the image URLs in the prompt text below as I have provided the actual image data above.
`;

      const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash",
        generationConfig: {
          responseMimeType: "text/plain", // We want HTML string, not JSON
        },
      });

      // Pass both text prompt and image parts
      const result = await model.generateContent([fullPrompt, ...imagesParts]);
      const response = await result.response;
      let text = response.text();

      // Clean up markdown code blocks if present
      text = text.replace(/```html/g, "").replace(/```/g, "");

      return text;
    });

    const storedUI = await step.run("save-result", async () => {
      const htmlContent =
        typeof result === "string" ? result : JSON.stringify(result);

      // 1. Create the persistent record
      const generatedUIRecord = await prisma.generatedUI.create({
        data: {
          projectId,
          html: htmlContent,
          name: `Generated UI - ${new Date().toLocaleString()}`,
        },
      });

      // 2. If we have a source shape, add it to the canvas
      if (shapeId) {
        const currentCanvas = await prisma.canvas.findUnique({
          where: { projectId },
          select: { shapes: true },
        });

        if (currentCanvas?.shapes) {
          const shapesFn = currentCanvas.shapes as any;
          const sourceShape = shapesFn.entities[shapeId];

          if (sourceShape) {
            const newShapeId = crypto.randomUUID();
            const newShape = {
              id: newShapeId,
              type: "generatedui",
              x: sourceShape.x,
              y: sourceShape.y,
              w: sourceShape.w,
              h: sourceShape.h,
              uiSpecData: htmlContent,
              sourceFrameId: shapeId,
              stroke: "transparent",
              strokeWidth: 0,
              fill: null,
            };

            // Update shapes JSON
            shapesFn.ids.push(newShapeId);
            shapesFn.entities[newShapeId] = newShape;

            await prisma.canvas.update({
              where: { projectId },
              data: { shapes: shapesFn },
            });
          }
        }
      }

      return generatedUIRecord;
    });

    return { success: true, id: storedUI.id };
  },
);
