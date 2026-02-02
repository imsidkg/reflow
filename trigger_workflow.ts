import { inngest } from "./inngest/client";
import { prisma } from "./lib/prisma";

async function main() {
  // Use the project ID and a shape ID found in the inspection step
  // Project ID: cml2dajer002ub2i048q46gil
  // Shape ID: 7a5fbf0f-3f2d-4d20-afc2-23ac18ab190f

  const projectId = "cml2dajer002ub2i048q46gil";
  const shapeId = "7a5fbf0f-3f2d-4d20-afc2-23ac18ab190f";

  console.log(
    `Triggering ui/generate for Project ${projectId}, Shape ${shapeId}`,
  );

  await inngest.send({
    name: "ui/generate",
    data: {
      projectId,
      shapeId,
    },
  });

  console.log("Event sent! Monitor the Inngest dev server or server logs.");
}

main().catch((e) => console.error(e));
