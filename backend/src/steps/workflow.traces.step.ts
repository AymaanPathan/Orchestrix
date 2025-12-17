import { ApiRouteConfig, StepHandler } from "motia";
import mongoose from "mongoose";
import { connectMongo } from "../lib/mongo";

export const config: ApiRouteConfig = {
  name: "getWorkflowTrace",
  type: "api",
  path: "/workflow/traces/:executionId",
  method: "GET",
  emits: [],
};

export const handler: StepHandler<typeof config> = async (req) => {
  await connectMongo();

  const { executionId } = req.pathParams!;
  const coll = mongoose.connection.collection("workflow_traces");

  const doc = await coll.findOne({ executionId });

  return {
    status: 200,
    body: doc || { executionId, steps: [] },
  };
};
