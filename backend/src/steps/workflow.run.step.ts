// src/steps/workflow.run.step.ts
import { EventConfig, StepHandler } from "motia";

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

  // 🔁 Dispatch to actual step handler
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
