import { EventConfig, StepHandler } from "motia";
import { logSection } from "../lib/consoleLogger";

export const config: EventConfig = {
  name: "workflow.start",
  type: "event",
  subscribes: ["workflow.start"],
  emits: ["workflow.run"],
};

export const handler: StepHandler<typeof config> = async (payload, ctx) => {
  const { executionId, steps } = payload;

  logSection("🚀 WORKFLOW EXECUTION STARTED");
  console.log("Execution ID:", executionId);
  console.log("Total Steps:", steps.length);

  await ctx.emit({
    topic: "workflow.run",
    data: { ...payload, index: 0 },
  });
};
