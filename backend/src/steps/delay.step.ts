import { EventConfig, StepHandler } from "motia";

export const config: EventConfig = {
  name: "delay",
  type: "event",
  subscribes: ["delay"],
  emits: ["workflow.delay"],

  infrastructure: {
    queue: {
      type: "standard",
      maxRetries: 3,
      visibilityTimeout: 60,
    },
  },
};

export const handler: StepHandler<typeof config> = async (payload, ctx) => {
  const { step, steps, index, vars, executionId } = payload as any;
  const { logger, emit } = ctx;

  const delaySeconds = Number(step.seconds || 0);

  logger.info(
    `⏳ Delay step triggered — scheduling resume in ${delaySeconds}s`
  );

  await emit({
    topic: "workflow.delay",
    data: {
      delaySeconds,
      steps,
      index,
      vars,
      executionId,
    },
  });
};
