import { EventConfig, StepHandler } from "motia";
import mongoose from "mongoose";
import { connectMongo } from "../lib/mongo";

export const config: EventConfig = {
  name: "dbFind",
  type: "event",
  subscribes: ["dbFind"],
  emits: ["workflow.run"],
};

export const handler: StepHandler<typeof config> = async (payload, ctx) => {
  await connectMongo();

  const { step, steps, index, vars, executionId } = payload as any;

  const Model = mongoose.connection.models[step.collection];
  if (!Model) throw new Error("Model not found: " + step.collection);

  const result =
    step.findType === "findOne"
      ? await Model.findOne(step.filters)
      : await Model.find(step.filters);

  await ctx.emit({
    topic: "workflow.run",
    data: {
      steps,
      index: index + 1,
      vars: {
        ...vars,
        [step.output]: result,
      },
      executionId,
    },
  });
};
