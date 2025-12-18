export async function logStep(
  streams: any,
  log: {
    executionId: string;
    stepId: string;
    stepType: string;
    status: "started" | "success" | "error";
    input?: any;
    output?: any;
    error?: string;
    startedAt: number;
    finishedAt?: number;
  }
) {
  const durationMs =
    log.finishedAt && log.startedAt
      ? log.finishedAt - log.startedAt
      : undefined;

  await streams.executionLog.set(
    log.executionId,
    `${log.stepId}-${log.status}-${Date.now()}`,
    {
      ...log,
      durationMs,
    }
  );
}
