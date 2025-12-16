import { EventConfig, StepHandler } from "motia";
import jwt from "jsonwebtoken";
import { connectMongo } from "../lib/mongo";
import mongoose from "mongoose";

const users = mongoose.connection.models["users"];

export const config: EventConfig = {
  name: "authMiddleware",
  type: "event",
  subscribes: ["authMiddleware"],
  emits: ["workflow.run"],
};

export const handler: StepHandler<typeof config> = async (payload, ctx) => {
  const { step, steps, index, vars, executionId } = payload as any;
  const authHeader = vars?.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("Unauthorized");
  }

  await connectMongo();

  const token = authHeader.split(" ")[1];
  const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
  const user = await users.findById(decoded.userId);

  if (!user) throw new Error("User not found");

  await ctx.emit({
    topic: "workflow.run",
    data: {
      steps,
      index: index + 1,
      vars: {
        ...vars,
        authUser: {
          id: user._id,
          email: user.email,
          role: user.role,
        },
      },
      executionId,
    },
  });
};
