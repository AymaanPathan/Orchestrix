import { EventConfig, StepHandler } from "motia";

export const config: EventConfig = {
  name: "input",
  type: "event",
  subscribes: ["input"],
  emits: ["workflow.run"],
};

export const handler: StepHandler<typeof config> = async (
  payload: any,
  ctx
) => {
  const { data, vars, steps, index, executionId } = payload;

  // 🔐 SAFETY CHECK
  const variables = data?.variables;
  if (!Array.isArray(variables)) {
    throw new Error("Input step requires data.variables[]");
  }

  const nextVars = { ...vars };

  for (const v of variables) {
    nextVars[v.name] = vars.input?.[v.name] ?? v.default ?? null;
  }

  // 🔁 Continue workflow
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
