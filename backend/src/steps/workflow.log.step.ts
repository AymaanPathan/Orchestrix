// workflow.log.step.ts
import { EventConfig, StepHandler } from "motia";
import mongoose from "mongoose";

export const config: EventConfig = {
  name: "workflow.log",
  type: "event",
  subscribes: ["workflow.log"],
  emits: [],
};

export const handler: StepHandler<typeof config> = async (payload) => {
  const Log = mongoose.connection.collection("execution_logs");
  await Log.insertOne(payload);
};
