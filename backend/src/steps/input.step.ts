import { EventConfig, StepHandler } from "motia";

export const config: EventConfig = {
  name: "input",
  type: "event",
  subscribes: ["input"],
  emits: ["workflow.run", "workflow.log"], // 🔥 ADD THIS
};

export const handler: StepHandler<typeof config> = async (
  payload: any,
  ctx
) => {
  const { data, vars, steps, index, executionId } = payload;

  const variables = data?.variables;
  if (!Array.isArray(variables)) {
    throw new Error("Input step requires data.variables[]");
  }

  // ✅ PRESERVE input namespace
  const nextVars = {
    ...vars,
    input: {
      ...(vars.input || {}),
    },
  };

  for (const v of variables) {
    nextVars.input[v.name] = vars.input?.[v.name] ?? v.default ?? null;
  }

  // 🔥 EMIT LOG FOR FRONTEND
  await ctx.emit({
    topic: "workflow.log",
    data: {
      executionId,
      level: "info",
      message: "Input step resolved",
      step: "input",
      index,
      timestamp: Date.now(),
    },
  });

  // 🔁 CONTINUE WORKFLOW
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
