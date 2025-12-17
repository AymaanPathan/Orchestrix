import { EventConfig, StepHandler } from "motia";

export const config: EventConfig = {
  name: "input",
  type: "event",
  subscribes: ["input"],
  emits: [
    "workflow.run",
    "workflow.trace",
  ],
};

export const handler: StepHandler<typeof config> = async (payload, ctx) => {
  const { step, steps, index, vars, executionId } = payload;

  const assigned: any = {};
  const input = vars.input || {};

  for (const v of step.variables || []) {
    assigned[v.name] = input[v.name] ?? v.default ?? "";
  }

  const nextVars = {
    ...vars,
    ...assigned,
  };

  await ctx.emit({
    topic: "workflow.trace",
    data: {
      executionId,
      stepId: step.id,
      stepType: "input",
      index,
      output: assigned,
      varsSnapshot: nextVars,
    },
  });

  await ctx.emit({
    topic: "workflow.run",
    data: {
      steps,
      index: index + 1,
      vars: nextVars,
      executionId,
    },
  });
};
