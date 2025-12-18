// execution.logs.api.step.ts
import { ApiRouteConfig, StepHandler } from "motia";
import mongoose from "mongoose";
import { connectMongo } from "../lib/mongo";

export const config: ApiRouteConfig = {
  name: "ExecutionLogs",
  type: "api",
  path: "/executions/:id/logs",
  method: "GET",
  emits: [],
};

export const handler: StepHandler<typeof config> = async (req) => {
  await connectMongo();

  const { id } = req.pathParams;
  const logs = await mongoose.connection
    .collection("execution_logs")
    .find({ executionId: id })
    .sort({ timestamp: 1 })
    .toArray();

  return { status: 200, body: logs };
};
