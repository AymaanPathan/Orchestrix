import { ApiRouteConfig, StepHandler } from "motia";
import { connectMongo } from "../lib/mongo";
import { v4 as uuidv4 } from "uuid";

export const config: ApiRouteConfig = {
  name: "executeWorkflow",
  type: "api",
  path: "/workflow/execute",
  method: "POST",
  flows: ["WorkflowBuilder"],
  emits: ["workflow.start"],
};

export const handler: StepHandler<typeof config> = async (req, ctx) => {
  console.log("🔥 EXECUTE API HIT", Date.now());
  await connectMongo();

  const { steps, input } = req.body;
  if (!Array.isArray(steps)) {
    return { status: 400, body: { error: "steps[] required" } };
  }

  const executionId = uuidv4();

  await ctx.emit({
    topic: "workflow.start",
    data: {
      steps,
      index: 0,
      vars: {
        input: input || {},
        executionId,
      },
      executionId,
    },
  });

  return {
    status: 200,
    body: { ok: true, executionId },
  };
};
