import { prisma } from "./lib/prisma";

async function main() {
  const projectId = process.argv[2]; // Optional: provide project ID

  let canvas;
  if (projectId) {
    canvas = await prisma.canvas.findUnique({
      where: { projectId },
    });
  } else {
    // Just find the most recent updated canvas
    canvas = await prisma.canvas.findFirst({
      orderBy: { updatedAt: "desc" },
    });
  }

  if (!canvas) {
    console.log("No canvas found.");
    return;
  }

  console.log("Project ID:", canvas.projectId);
  console.log("Canvas ID:", canvas.id);

  const shapes = canvas.shapes as any;
  if (!shapes || !shapes.entities) {
    console.log("No shapes/entities found in canvas.");
    return;
  }

  const entities = shapes.entities;
  const ids = shapes.ids || [];

  console.log(`Total shapes: ${ids.length}`);

  // List all shape titles
  console.log("--- Shape Titles ---");
  for (const id of ids) {
    const shape = entities[id];
    if (shape.type === "generatedui") {
      console.log(
        `[${shape.type}] ID: ${id} | Title: ${shape.title || "Untitled"}`,
      );
    }
  }
  console.log("--------------------");

  // Find the largest shape by JSON string length
  let maxLen = 0;
  let maxId = "";

  for (const id of ids) {
    const shape = entities[id];
    const s = JSON.stringify(shape);
    if (s.length > maxLen) {
      maxLen = s.length;
      maxId = id;
    }
  }

  console.log(`Largest shape ID: ${maxId}`);
  console.log(`Largest shape size: ${maxLen} bytes`);

  if (maxId) {
    const largestPart = JSON.stringify(entities[maxId], null, 2);
    console.log("Preview of largest shape (first 500 chars):");
    console.log(largestPart.substring(0, 500));
  }
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
