// Import models to ensure they're registered
import "../models/user.model.js";
import "../models/workflow.model.js";
import "../models/publishedApi.model.js";
import { ApiRouteConfig, StepHandler } from "motia";
import Workflow from "../models/workflow.model";
import PublishedApi from "../models/publishedApi.model";
import { connectMongo } from "../lib/mongo";
import { runEngine } from "../lib/workflowEngine";

export const config: ApiRouteConfig = {
  name: "runWorkflowPublic",
  type: "api",
  path: "/workflow/run/:workflowId/:apiName",
  method: "POST",
  flows: ["WorkflowRunner"],
  emits: [],
};

export const handler: StepHandler<typeof config> = async (data, ctx) => {
  await connectMongo();
  const { logger } = ctx;

  const { workflowId, apiName } = data.pathParams || {};

  if (!workflowId) {
    return { status: 400, body: { error: "workflowId missing in path" } };
  }

  const api = await PublishedApi.findOne({ workflowId, slug: apiName });
  if (!api) {
    return { status: 404, body: { error: "API not published" } };
  }

  const workflow = await Workflow.findOne({ workflowId });
  if (!workflow) {
    return { status: 404, body: { error: "Workflow not found" } };
  }

  const executionId = crypto.randomUUID();

  await ctx.emit({
    topic: "workflow.start",
    data: {
      steps: workflow.steps,
      index: 0,
      vars: {
        input: data.body || {},
      },
      executionId,
    },
  });

  logger.info("Public workflow started", { workflowId, executionId });

  return {
    status: 200,
    body: { ok: true, executionId },
  };
};
