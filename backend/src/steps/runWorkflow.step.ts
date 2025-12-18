import { ApiRouteConfig, StepHandler } from "motia";
import Workflow from "../models/workflow.model";
import { connectMongo } from "../lib/mongo";
import mongoose from "mongoose";
import { v4 as uuid } from "uuid";

export const config: ApiRouteConfig = {
  name: "runWorkflow",
  type: "api",
  method: "POST",
  path: "/workflow/run/:workflowId/:apiName",
  emits: ["workflow.run"],
};

export const handler: StepHandler<typeof config> = async (req, ctx) => {
  await connectMongo();

  if (mongoose.connection.readyState !== 1) {
    await new Promise((r) => mongoose.connection.once("connected", r));
  }

  const { workflowId } = req.pathParams!;
  const workflow = await Workflow.findOne({ workflowId });

  if (!workflow) {
    return {
      status: 404,
      body: { error: "Workflow not found" },
    };
  }

  const executionId = uuid();

  // 🔥 USE STORED RUNTIME STEPS AS-IS
  await ctx.emit({
    topic: "workflow.run",
    data: {
      steps: workflow.steps,
      index: 0,
      vars: { input: req.body || {} },
      executionId,
    },
  });

  return {
    status: 200,
    body: { ok: true, executionId },
  };
};
