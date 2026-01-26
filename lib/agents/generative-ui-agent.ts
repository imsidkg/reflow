import { createAgent, gemini } from "@inngest/agent-kit";
import { prompts } from "./prompts";

export const generativeUiAgent = createAgent({
  name: "Generative UI",
  description:
    "Converts wireframes into production-ready HTML using the style guide",
  system: prompts.generativeUi.system,
  model: gemini({
    model: "gemini-1.5-flash",
  }),
});
