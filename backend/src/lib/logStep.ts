/**
 * Enhanced logging utility for workflow execution steps
 * Provides comprehensive, user-friendly logs for frontend display
 */

export type LogPhase =
  | "step_started"
  | "info"
  | "data"
  | "success"
  | "step_finished"
  | "error"
  | "execution_failed"
  | "execution_finished";

export type LogStatus = "started" | "running" | "success" | "error";

export interface LogStepParams {
  executionId: string;
  stepId: string;
  stepIndex?: number;
  stepType: string;
  status: LogStatus;
  phase?: LogPhase;
  title?: string;
  message?: string;
  input?: any;
  output?: any;
  data?: any;
  metadata?: Record<string, any>;
  error?: string;
  startedAt: number;
  finishedAt?: number;
  totalSteps?: number;
}

/**
 * Main logging function with enhanced features
 */
export async function logStep(streams: any, log: LogStepParams) {
  const durationMs =
    log.finishedAt && log.startedAt
      ? log.finishedAt - log.startedAt
      : undefined;

  // Determine phase based on status if not provided
  const phase = log.phase || getPhaseFromStatus(log.status);

  // Generate user-friendly title if not provided
  const title = log.title || generateTitle(log);

  // Generate descriptive message if not provided
  const message = log.message || generateMessage(log, durationMs);

  // Create comprehensive log entry
  const logEntry = {
    executionId: log.executionId,
    stepId: log.stepId,
    stepIndex: log.stepIndex,
    stepType: log.stepType,
    status: log.status,
    phase,
    title,
    message,
    ...(log.input && { input: log.input }),
    ...(log.output && { output: log.output }),
    ...(log.data && { data: log.data }),
    ...(log.metadata && { metadata: log.metadata }),
    ...(log.error && { error: log.error }),
    ...(durationMs !== undefined && { durationMs }),
    timestamp: Date.now(),
  };

  await streams.executionLog.set(
    log.executionId,
    `${log.stepId}-${log.status}-${Date.now()}`,
    logEntry
  );
}

/**
 * Helper: Determine phase from status
 */
function getPhaseFromStatus(status: LogStatus): LogPhase {
  switch (status) {
    case "started":
      return "step_started";
    case "running":
      return "info";
    case "success":
      return "step_finished";
    case "error":
      return "error";
    default:
      return "info";
  }
}

/**
 * Helper: Generate user-friendly title
 */
function generateTitle(log: LogStepParams): string {
  const stepNum = log.stepIndex !== undefined ? ` ${log.stepIndex + 1}` : "";
  const totalSteps = log.totalSteps ? ` of ${log.totalSteps}` : "";

  switch (log.status) {
    case "started":
      return `Step${stepNum}${totalSteps} started`;
    case "running":
      return `Step${stepNum} in progress`;
    case "success":
      return `Step${stepNum}${totalSteps} completed`;
    case "error":
      return `Step${stepNum} failed`;
    default:
      return `Step${stepNum} ${log.status}`;
  }
}

/**
 * Helper: Generate descriptive message
 */
function generateMessage(log: LogStepParams, durationMs?: number): string {
  const stepType = formatStepType(log.stepType);
  const duration = durationMs ? ` in ${durationMs}ms` : "";

  switch (log.status) {
    case "started":
      return `Executing ${stepType}...`;
    case "running":
      return `Processing ${stepType}...`;
    case "success":
      return `${stepType} completed successfully${duration}`;
    case "error":
      return `${stepType} encountered an error`;
    default:
      return `${stepType} ${log.status}`;
  }
}

/**
 * Helper: Format step type for display
 */
function formatStepType(stepType: string): string {
  // Convert camelCase to Title Case
  return stepType
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}

/**
 * Convenience function: Log step start
 */
export async function logStepStart(
  streams: any,
  params: {
    executionId: string;
    stepId: string;
    stepIndex: number;
    stepType: string;
    totalSteps?: number;
    message?: string;
    input?: any;
  }
) {
  await logStep(streams, {
    ...params,
    status: "started",
    phase: "step_started",
    startedAt: Date.now(),
  });
}

/**
 * Convenience function: Log step info/progress
 */
export async function logStepInfo(
  streams: any,
  params: {
    executionId: string;
    stepId: string;
    stepIndex?: number;
    stepType: string;
    title: string;
    message: string;
    data?: any;
  }
) {
  await logStep(streams, {
    ...params,
    status: "running",
    phase: "info",
    startedAt: Date.now(),
  });
}

/**
 * Convenience function: Log step data
 */
export async function logStepData(
  streams: any,
  params: {
    executionId: string;
    stepId: string;
    stepIndex?: number;
    stepType: string;
    title: string;
    message?: string;
    data: any;
    metadata?: Record<string, any>;
  }
) {
  await logStep(streams, {
    ...params,
    status: "running",
    phase: "data",
    startedAt: Date.now(),
  });
}

/**
 * Convenience function: Log step success
 */
export async function logStepSuccess(
  streams: any,
  params: {
    executionId: string;
    stepId: string;
    stepIndex: number;
    stepType: string;
    totalSteps?: number;
    message?: string;
    output?: any;
    data?: any;
    metadata?: Record<string, any>;
    startedAt: number;
  }
) {
  await logStep(streams, {
    ...params,
    status: "success",
    phase: "step_finished",
    finishedAt: Date.now(),
  });
}

/**
 * Convenience function: Log step error
 */
export async function logStepError(
  streams: any,
  params: {
    executionId: string;
    stepId: string;
    stepIndex: number;
    stepType: string;
    totalSteps?: number;
    error: string;
    data?: any;
    startedAt: number;
  }
) {
  await logStep(streams, {
    ...params,
    status: "error",
    phase: "error",
    finishedAt: Date.now(),
  });
}

/**
 * Convenience function: Log execution completion
 */
export async function logExecutionFinished(
  streams: any,
  params: {
    executionId: string;
    totalSteps: number;
    startedAt: number;
    message?: string;
  }
) {
  await streams.executionLog.set(params.executionId, `execution-finished`, {
    executionId: params.executionId,
    phase: "execution_finished",
    title: "Workflow execution completed",
    message:
      params.message || `All ${params.totalSteps} steps completed successfully`,
    totalSteps: params.totalSteps,
    totalDuration: Date.now() - params.startedAt,
    timestamp: Date.now(),
  });
}

/**
 * Convenience function: Log execution failure
 */
export async function logExecutionFailed(
  streams: any,
  params: {
    executionId: string;
    failedStepIndex: number;
    totalSteps: number;
    error: string;
    message?: string;
  }
) {
  await streams.executionLog.set(params.executionId, `execution-failed`, {
    executionId: params.executionId,
    phase: "execution_failed",
    title: "Workflow execution failed",
    message:
      params.message ||
      `Execution stopped at step ${params.failedStepIndex + 1} of ${
        params.totalSteps
      }`,
    failedStep: params.failedStepIndex,
    totalSteps: params.totalSteps,
    error: params.error,
    timestamp: Date.now(),
  });
}
