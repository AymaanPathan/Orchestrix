import { EventConfig, StepHandler } from "motia";

function assertNoUndefined(step: any, stepType: string) {
  for (const [key, value] of Object.entries(step)) {
    if (value === undefined) {
      throw new Error(`${stepType} step misconfigured: "${key}" is undefined`);
    }
  }
}

export const config: EventConfig = {
  name: "workflow.run",
  type: "event",
  subscribes: ["workflow.run"],
  emits: [
    "input",
    "dbFind",
    "dbInsert",
    "dbUpdate",
    "delay",
    "authMiddleware",
    "emailSend",
    "inputValidation",
  ],
};

export const handler: StepHandler<typeof config> = async (
  payload: any,
  ctx
) => {
  const { steps, index, vars, executionId } = payload;
  const { streams } = ctx;

  // ✅ Workflow finished
  if (index >= steps.length) {
    await streams.executionLog.set(executionId, `finish-${Date.now()}`, {
      executionId,
      level: "info",
      message: "Workflow finished",
      timestamp: Date.now(),
    });

    console.log("✅ Workflow finished:", executionId);
    return;
  }

  const step = steps[index];

  console.log(
    `▶️ Executing step ${index}:`,
    step.type,
    "execution:",
    executionId
  );

  // ✅ STREAM LOG TO FRONTEND
  await streams.executionLog.set(executionId, `step-${index}-${Date.now()}`, {
    executionId,
    level: "info",
    message: `Executing step ${index}: ${step.type}`,
    step: step.type,
    index,
    timestamp: Date.now(),
  });

  if (index >= steps.length) {
    console.log("\n✅ WORKFLOW FINISHED SUCCESSFULLY");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    return;
  }

  if (["emailSend", "dbInsert", "dbUpdate"].includes(step.type)) {
    assertNoUndefined(step, step.type);
  }

  if (step.type === "emailSend") {
    if (!step.to || !step.subject || !step.body) {
      throw new Error(
        `emailSend step misconfigured at index ${index} (to=${!!step.to}, subject=${!!step.subject}, body=${!!step.body})`
      );
    }
  }
  await ctx.emit({
    topic: step.type,
    data: {
      ...step,
      steps,
      index,
      vars,
      executionId,
    },
  });
};
