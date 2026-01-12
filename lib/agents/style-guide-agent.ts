import { createAgent, gemini } from "@inngest/agent-kit";
import { prompts } from "./prompts";

export const styleGuideAgent = createAgent({
  name: "Style Guide Generator",
  description:
    "Analyzes mood board images and generates a comprehensive design system with colors and typography",
  system: prompts.styleGuide.system,
  model: gemini({
    model: "gemini-2.0-flash",
  }),
});
