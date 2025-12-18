import { EventConfig, StepHandler } from "motia";

export const config: EventConfig = {
  name: "workflow.run",
  type: "event",
  subscribes: ["workflow.run"],
  emits: ["workflow.run", "dbInsert"],
};

export const handler: StepHandler<typeof config> = async (payload, ctx) => {
  const { steps, index, vars, executionId } = payload as any;
  const step = steps[index];

  console.log(`▶ [${executionId}] index ${index}`);

  if (!step) {
    console.log(`🏁 [${executionId}] FINISHED`);
    console.log("FINAL VARS:", vars);
    return;
  }

  // INPUT handled inline
  if (step.type === "input") {
    const nextVars = { ...vars };
    for (const v of step.variables || []) {
      nextVars[v.name] = vars.input?.[v.name] ?? "";
    }

    console.log("🟡 INPUT:", nextVars);

    await ctx.emit({
      topic: "workflow.run",
      data: {
        steps,
        index: index + 1,
        vars: nextVars,
        executionId,
      },
    });
    return;
  }

  // real step
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
