import { EventConfig, StepHandler } from "motia";

export const config: EventConfig = {
  name: "workflow.start",
  type: "event",
  subscribes: ["workflow.start"],
  emits: ["workflow.run"], // 👈 ONLY THIS
};

export const handler: StepHandler<typeof config> = async (payload:any, ctx) => {
  console.log("🚀 workflow.start", payload.executionId);

  // JUST START EXECUTION
  await ctx.emit({
    topic: "workflow.run",
    data: payload,
  });
};
