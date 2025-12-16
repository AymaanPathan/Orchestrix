import { EventConfig, StepHandler } from "motia";
import { connectMongo } from "../lib/mongo";
import mongoose from "mongoose";

const users =mongoose.connection.models["users"];
import bcrypt from "bcryptjs";

export const config: EventConfig = {
  name: "dbInsert",
  type: "event",
  subscribes: ["dbInsert"],
  emits: ["workflow.run"],
};

export const handler: StepHandler<typeof config> = async (payload, ctx) => {
  await connectMongo();

  const { step, steps, index, vars, executionId } = payload as any;

  const data = step.data || {};
  const output = step.output;

  if (data.password) {
    data.password = await bcrypt.hash(data.password, 10);
  }

  const created = await users.create(data);

  // 🔁 Continue workflow
  await ctx.emit({
    topic: "workflow.run",
    data: {
      steps,
      index: index + 1,
      vars: {
        ...vars,
        [output]: created,
      },
      executionId,
    },
  });
};
