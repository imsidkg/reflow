import { serve } from "inngest/next";
import { inngest } from "../../../inngest/client";
import { generateStyleGuide, generateUI } from "../../../inngest/functions";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [generateStyleGuide, generateUI],
});
