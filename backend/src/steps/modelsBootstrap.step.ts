import { EventConfig, StepHandler } from "motia";
import { connectMongo } from "../lib/mongo";

export const config: EventConfig = {
  name: "models.bootstrap",
  type: "event",
  subscribes: ["workflow.start"],
  emits: ["workflow.run"],
};

export const handler: StepHandler<typeof config> = async (payload, ctx) => {
  const { steps, index, vars, executionId } = payload as any;

  await connectMongo();


  // 3️⃣ Continue workflow
  await ctx.emit({
    topic: "workflow.run",
    data: {
      steps,
      index,
      vars,
      executionId,
    },
  });
};
