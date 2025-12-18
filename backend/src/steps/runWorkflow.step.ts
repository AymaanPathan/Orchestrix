import { ApiRouteConfig, StepHandler } from "motia";
import Workflow from "../models/workflow.model.js";
import PublishedApi from "../models/publishedApi.model.js";
import { runEngine } from "../engine/workflowEngine";
import { connectMongo } from "../lib/mongo.js";

export const config: ApiRouteConfig = {
  name: "runWorkflowPublic",
  type: "api",
  path: "/workflow/run/:workflowId/:apiName",
  method: "POST",
  emits: [],
};

export const handler: StepHandler<typeof config> = async (req, ctx) => {
  await connectMongo();
  const { logger } = ctx;
  await ctx.emit({
    topic: "models.register",
    data: {},
  });
  const { workflowId, apiName } = req.pathParams || {};

  if (!workflowId || !apiName) {
    return {
      status: 400,
      body: { error: "Invalid workflow path" },
    };
  }

  // ✅ Ensure API is published
  const api = await PublishedApi.findOne({
    workflowId,
    slug: apiName,
  });

  if (!api) {
    return {
      status: 404,
      body: { error: "API not published" },
    };
  }

  // ✅ Load workflow
  const workflow = await Workflow.findOne({ workflowId });
  if (!workflow) {
    return {
      status: 404,
      body: { error: "Workflow not found" },
    };
  }

  const input = req.body || {};

  logger.info("Running published workflow", {
    workflowId,
    api: api.name,
    input,
  });

  const result = await runEngine(workflow.steps, input, req.headers);

  return {
    status: 200,
    body: result,
  };
};
