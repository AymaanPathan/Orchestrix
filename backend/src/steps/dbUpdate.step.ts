import "../models/user.model.js";
import "../models/workflow.model.js";
import "../models/publishedApi.model.js";

import { EventConfig, StepHandler } from "motia";
import { connectMongo } from "../lib/mongo";
import userModel from "../models/user.model";

export const config: EventConfig = {
  name: "dbUpdate",
  type: "event",
  subscribes: ["dbUpdate"],
  emits: ["workflow.run"],
};

export const handler: StepHandler<typeof config> = async (payload, ctx) => {
  await connectMongo();

  const { step, steps, index, vars, executionId } = payload as any;

  const { collection, updateType, filters, update, output } = step;

  let Model;
  if (collection === "users") Model = userModel;
  else throw new Error("Unknown collection");

  const result =
    updateType === "updateOne"
      ? await Model.findOneAndUpdate(filters, { $set: update }, { new: true })
      : await Model.updateMany(filters, { $set: update });

  // 🔁 Continue workflow
  await ctx.emit({
    topic: "workflow.run",
    data: {
      steps,
      index: index + 1,
      vars: {
        ...vars,
        [output]: result,
      },
      executionId,
    },
  });
};
