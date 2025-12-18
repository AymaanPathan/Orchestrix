export async function logStep(
  ctx: any,
  {
    executionId,
    step,
    stepType,
    phase,
    message,
    payload,
  }: {
    executionId: string;
    step: string;
    stepType: string;
    phase: "start" | "data" | "result" | "error" | "end";
    message: string;
    payload?: any;
  }
) {
  await ctx.streams.executionLog.set(
    executionId,
    `${Date.now()}-${Math.random()}`,
    {
      id: `${Date.now()}`,
      executionId,
      step,
      stepType,
      phase,
      message,
      payload,
      timestamp: Date.now(),
    }
  );
}
