import { EventConfig, StepHandler } from "motia";

export const config: EventConfig = {
  name: "workflow.run",
  type: "event",
  subscribes: ["workflow.run"],
  emits: ["workflow.run", "workflow.finished"],
};

export const handler: StepHandler<typeof config> = async (payload, ctx) => {
  const { steps, index, vars, executionId } = payload as any;

  const step = steps[index];

  if (!step) {
    await ctx.emit({
      topic: "workflow.finished",
      data: { executionId, vars },
    });
    return;
  }

  await ctx.emit({
    topic: step.type,
    data: {
      step,
      steps,
      index,
      vars,
      executionId,
    },
  });
};
