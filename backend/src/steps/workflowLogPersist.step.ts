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
  const {
    executionId,
    message,
    level = "info",
    stepId,
    stepIndex,
    finished = false,
  } = payload as any;

  await connectMongo();

  const coll = mongoose.connection.collection("workflow_logs");

  await coll.updateOne(
    { executionId },
    {
      $push: {
        logs: {
          at: new Date(),
          level,
          message,
          stepId,
          stepIndex,
        },
      },
      ...(finished
        ? {
            $set: {
              finished: true,
              finishedAt: new Date(),
            },
          }
        : {}),
      $setOnInsert: {
        startedAt: new Date(),
        finished: false,
      },
    },
    { upsert: true }
  );

  ctx.logger.info("📝 Log persisted", { executionId, message });
};
