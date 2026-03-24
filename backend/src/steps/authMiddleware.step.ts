import { EventConfig, StepHandler } from "motia";
import jwt from "jsonwebtoken";

export const config: EventConfig = {
  name: "authMiddleware",
  type: "event",
  subscribes: ["authMiddleware"],
  emits: ["workflow.run"],
};

export const handler: StepHandler<typeof config> = async (payload, ctx) => {
  const { steps, index, vars, executionId } = payload as any;
  const ownerId = (payload as any).ownerId || "default-owner";

  // Auth header can come from vars.authorization or vars.input.authorization
  const authHeader =
    vars?.authorization ||
    vars?.input?.authorization ||
    vars?.headers?.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("Unauthorized: missing or invalid Authorization header");
  }

  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
  }

  const token = authHeader.split(" ")[1];
  const decoded: any = jwt.verify(token, process.env.JWT_SECRET);

  await ctx.emit({
    topic: "workflow.run",
    data: {
      steps,
      index: index + 1,
      vars: {
        ...vars,
        currentUser: decoded,
      },
      executionId,
      ownerId, // ← always forward
    },
  });
};
