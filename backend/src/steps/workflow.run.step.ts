// this file is responsible for running each step in the workflow on execute
import { EventConfig, StepHandler } from "motia";

export const config: EventConfig = {
  name: "workflow.run",
  type: "event",
  subscribes: ["workflow.run"],
  emits: [
    "input", // ✅ ADD THIS
    "dbFind",
    "dbInsert",
    "dbUpdate",
    "delay",
    "authMiddleware",
  ],
};

export const handler: StepHandler<typeof config> = async (
  payload: any,
  ctx
) => {
  const { steps, index, vars, executionId } = payload;

 if (index >= steps.length) {
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

  // 🔁 Dispatch to actual step handler
  await ctx.emit({
    topic: step.type, // dbFind, dbInsert, delay, etc.
    data: {
      ...step,
      steps,
      index,
      vars,
      executionId,
    },
  });
};
