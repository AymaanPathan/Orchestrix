import "../models";
import { ApiRouteConfig, StepHandler } from "motia";
import { connectMongo } from "../lib/mongo";
import { v4 as uuidv4 } from "uuid";

export const config: ApiRouteConfig = {
  name: "executeWorkflow",
  type: "api",
  path: "/workflow/execute",
  method: "POST",
  flows: ["WorkflowBuilder"],
  emits: [],
};

export const handler: StepHandler<typeof config> = async (req, ctx) => {
  await connectMongo();

  const { steps, input } = req.body;

  if (!Array.isArray(steps)) {
    return { status: 400, body: { error: "steps[] required" } };
  }

  const executionId = uuidv4();

  // shared execution memory
  const vars: Record<string, any> = {
    input: input || {},
    executionId,
  };

  // 🔥 START THE WORKFLOW (IMPORTANT LINE)
  await ctx.emit({
    topic: "workflow.run",
    data: {
      steps,
      index: 0,
      vars,
      executionId,
    },
  });

  return {
    status: 200,
    body: {
      ok: true,
      executionId,
    },
  };
};
