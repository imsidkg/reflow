import { createAgent, gemini } from "@inngest/agent-kit";
import { prompts } from "./prompts";

export const workflowAgent = createAgent({
  name: "Workflow Planner",
  description: "Plans a complete user workflow based on a single wireframe",
  system: prompts.workflow.system,
  model: gemini({
    model: "gemini-2.0-flash", // Using the faster/smarter model for logic
  }),
});
