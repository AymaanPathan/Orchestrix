import { EventConfig, StepHandler } from "motia";
import mongoose from "mongoose";
import { connectMongo } from "../lib/mongo";

export const config: EventConfig = {
  name: "workflow.trace",
  type: "event",
  subscribes: ["workflow.trace"],
  emits: [],
};

export const handler: StepHandler<typeof config> = async (payload, ctx) => {
  const { executionId, stepId, stepType, index, output, varsSnapshot } =
    payload as any;

  await connectMongo();

  const coll = mongoose.connection.collection("workflow_traces");

  await coll.updateOne(
    { executionId },
    {
      $push: {
        steps: {
          stepId,
          stepType,
          index,
          output,
          at: new Date(),
        },
      },
      $set: {
        lastVars: varsSnapshot,
        updatedAt: new Date(),
      },
      $setOnInsert: {
        createdAt: new Date(),
      },
    },
    { upsert: true }
  );
};
