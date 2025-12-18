import { EventConfig, StepHandler } from "motia";

export const config: EventConfig = {
  name: "input",
  type: "event",
  subscribes: ["input"],
  emits: ["workflow.run"],
};

export const handler: StepHandler<typeof config> = async (payload, ctx) => {
  const { step, steps, index, vars, executionId } = payload as any;

  const assigned: any = {};

  for (const v of step.variables || []) {
    assigned[v.name] = vars[v.name] ?? v.default ?? "";
  }

  const nextVars = {
    ...vars,
    ...assigned,
  };

  await ctx.emit({
    topic: "workflow.trace",
    data: {
      executionId,
      stepType: "input",
      index,
      output: assigned,
      varsSnapshot: nextVars,
    },
  });

  // ▶ ADVANCE WORKFLOW HERE (ONLY HERE)
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
