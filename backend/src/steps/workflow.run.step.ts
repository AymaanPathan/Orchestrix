import { EventConfig, StepHandler } from "motia";

export const config: EventConfig = {
  name: "workflow.run",
  type: "event",
  subscribes: ["workflow.run"],
  emits: [
    "workflow.trace",
    "dbFind",
    "dbInsert",
    "input",
    "emailSend",
    "workflow.delay",
  ],
};


export const handler: StepHandler<typeof config> = async (payload, ctx) => {
  const { steps, index, vars, executionId } = payload;
  const step = steps[index];

  console.log("▶ workflow.run index:", index);

  if (!step) {
    await ctx.emit({
      topic: "workflow.trace",
      data: {
        executionId,
        stepId: "__end__",
        stepType: "workflow.finished",
        index,
        output: vars,
        varsSnapshot: vars,
      },
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

