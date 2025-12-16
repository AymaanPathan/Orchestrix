import { EventConfig, StepHandler } from "motia";
import mongoose from "mongoose";

import { connectMongo } from "../lib/mongo";

export const config: EventConfig = {
  name: "workflow.log.persist",
  type: "event",
  subscribes: ["workflow.log.persist"],
  emits: [],
};

export const handler: StepHandler<typeof config> = async (payload, ctx) => {
  const { executionId, output, finishedAt } = payload as any;

  await connectMongo();

  if (mongoose.connection.readyState !== 1) {
    await new Promise((resolve) => {
      mongoose.connection.once("connected", resolve);
    });
  }

  const coll = mongoose.connection.collection("workflow_logs");

  await coll.updateOne(
    { executionId },
    {
      $set: {
        finalOutput: output,
        finishedAt: new Date(finishedAt),
        status: "completed",
      },
    },
    { upsert: true }
  );

  ctx.logger.info("💾 Workflow final output persisted", {
    executionId,
  });
};
