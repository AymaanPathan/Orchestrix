import { EventConfig, StepHandler } from "motia";
import {
  logStepStart,
  logKV,
  logSuccess,
  logError,
} from "../lib/consoleLogger";
import {
  logStepStart as logStepStartStream,
  logStepInfo,
  logStepData,
  logStepSuccess,
  logStepError,
  logExecutionFinished,
  logExecutionFailed,
} from "../lib/logStep";

export const config: EventConfig = {
  name: "input",
  type: "event",
  subscribes: ["input"],
  emits: ["workflow.run"],
};

export const handler: StepHandler<typeof config> = async (payload, ctx) => {
  const startedAt = Date.now();
  const { streams } = ctx;

  const { data, vars = {}, steps, index, executionId } = payload as any;

  const ownerId = (payload as any).ownerId || "default-owner";
  const totalSteps = steps?.length || 0;
  const isLastStep = index >= totalSteps - 1;
  const stepId = `input-${index}`;

  try {
    logStepStart(index, "input");
    logKV("Raw variables config", data?.variables);
    logKV("Incoming vars.input", vars.input);

    await logStepStartStream(streams, {
      executionId,
      stepId,
      stepIndex: index,
      stepType: "input",
      totalSteps,
      message: "Processing input variables",
      input: { variables: data?.variables, incomingVars: vars.input },
    });

    await logStepInfo(streams, {
      executionId,
      stepId,
      stepIndex: index,
      stepType: "input",
      title: "Parsing variable configuration",
      message: `Found ${data?.variables?.length || 0} variable(s) to process`,
      data: { variableNames: data?.variables?.map((v: any) => v.name) },
    });

    await logStepInfo(streams, {
      executionId,
      stepId,
      stepIndex: index,
      stepType: "input",
      title: "Resolving input values",
      message: "Mapping input data to variable definitions...",
    });

    const resolvedInput: any = {};
    for (const v of data.variables || []) {
      resolvedInput[v.name] = vars.input?.[v.name] ?? v.default ?? null;
    }

    logKV("Resolved input", resolvedInput);

    await logStepData(streams, {
      executionId,
      stepId,
      stepIndex: index,
      stepType: "input",
      title: "Input values resolved successfully",
      message: `Resolved ${Object.keys(resolvedInput).length} variable(s)`,
      data: resolvedInput,
      metadata: {
        variableCount: Object.keys(resolvedInput).length,
        variableNames: Object.keys(resolvedInput),
      },
    });

    await logStepSuccess(streams, {
      executionId,
      stepId,
      stepIndex: index,
      stepType: "input",
      totalSteps,
      message: "Input step completed successfully",
      output: resolvedInput,
      data: resolvedInput,
      metadata: { variableCount: Object.keys(resolvedInput).length },
      startedAt,
    });

    logSuccess("input", Date.now() - startedAt);

    if (isLastStep) {
      await logExecutionFinished(streams, {
        executionId,
        totalSteps,
        startedAt,
      });
    }

    await ctx.emit({
      topic: "workflow.run",
      data: {
        steps,
        index: index + 1,
        vars: { ...vars, input: resolvedInput },
        executionId,
        ownerId,
      },
    });
  } catch (err) {
    logError("input", err);

    await logStepError(streams, {
      executionId,
      stepId,
      stepIndex: index,
      stepType: "input",
      totalSteps,
      error: String(err),
      data: { variables: data?.variables, incomingVars: vars.input },
      startedAt,
    });

    await logExecutionFailed(streams, {
      executionId,
      failedStepIndex: index,
      totalSteps,
      error: String(err),
    });

    throw err;
  }
};
