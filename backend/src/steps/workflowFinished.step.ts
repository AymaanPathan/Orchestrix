import { EventConfig, StepHandler } from "motia";

export const config: EventConfig = {
  name: "workflow.finished",
  type: "event",
  subscribes: ["workflow.finished"],
  emits: ["workflow.log.persist"],
};

export const handler: StepHandler<typeof config> = async (payload, ctx) => {
  const { executionId, vars } = payload as any;

  // 🔔 Real-time visible log
  ctx.logger.info("🏁 Workflow finished", {
    executionId,
    outputKeys: Object.keys(vars || {}),
  });

  // 🔵 Trigger background persistence job
  await ctx.emit({
    topic: "workflow.log.persist",
    data: {
      executionId,
      output: vars,
      finishedAt: Date.now(),
    },
  });
};
