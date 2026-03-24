import { EventConfig, StepHandler } from "motia";
import { logExecutionFailed, logExecutionFinished } from "../lib/logStep";
import {
  logStepStart,
  logKV,
  logSuccess,
  logError,
} from "../lib/consoleLogger";

function getValueByPath(obj: any, path: string) {
  return path.split(".").reduce((acc, key) => acc?.[key], obj);
}

function validateType(value: any, type?: string): string | null {
  if (!type) return null;
  if (type === "number" && isNaN(Number(value))) return "Expected number";
  if (type === "string" && typeof value !== "string") return "Expected string";
  if (type === "boolean" && typeof value !== "boolean")
    return "Expected boolean";
  return null;
}

export const config: EventConfig = {
  name: "inputValidation",
  type: "event",
  subscribes: ["inputValidation"],
  emits: ["workflow.run"],
};

export const handler: StepHandler<typeof config> = async (payload, ctx) => {
  const start = Date.now();
  const { streams } = ctx;

  const {
    rules = [],
    output = "validated",
    steps,
    index,
    vars,
    executionId,
  } = payload as any;

  const ownerId = (payload as any).ownerId || "default-owner";
  const totalSteps = steps?.length || 0;
  const isLastStep = index >= totalSteps - 1;

  try {
    logStepStart(index, "inputValidation");
    logKV("Rules", rules);
    logKV("Vars", vars);

    await streams.executionLog.set(
      executionId,
      `inputValidation-start-${index}`,
      {
        executionId,
        stepIndex: index,
        stepType: "inputValidation",
        phase: "start" as const,
        title: "Input validation started",
        message: "Starting input validation",
        timestamp: Date.now(),
      },
    );

    const errors: Record<string, string[]> = {};

    for (const rule of rules) {
      const { field, required, type } = rule;
      const value = getValueByPath(vars, field);

      logKV(`Validating field: ${field}`, value);

      if (required && (value === undefined || value === "")) {
        if (!errors[field]) errors[field] = [];
        errors[field].push("Field is required");
        continue;
      }

      if (value !== undefined) {
        const typeError = validateType(value, type);
        if (typeError) {
          if (!errors[field]) errors[field] = [];
          errors[field].push(typeError);
        }
      }
    }

    await streams.executionLog.set(
      executionId,
      `inputValidation-result-${index}`,
      {
        executionId,
        stepIndex: index,
        stepType: "inputValidation",
        phase: "data" as const,
        title: "Validation result",
        message: `Validation ${Object.keys(errors).length === 0 ? "passed" : "failed"}`,
        data: { ok: Object.keys(errors).length === 0, errors },
        timestamp: Date.now(),
      },
    );

    if (Object.keys(errors).length > 0) {
      logError("inputValidation", errors);

      await streams.executionLog.set(
        executionId,
        `inputValidation-error-${index}`,
        {
          executionId,
          stepIndex: index,
          stepType: "inputValidation",
          phase: "error" as const,
          title: "Input validation failed",
          message: "One or more fields failed validation",
          data: errors,
          durationMs: Date.now() - start,
          timestamp: Date.now(),
        },
      );

      await logExecutionFailed(streams, {
        executionId,
        failedStepIndex: index,
        totalSteps,
        error: "Input validation failed",
      });

      throw new Error("Input validation failed");
    }

    logSuccess("inputValidation", Date.now() - start);

    await streams.executionLog.set(
      executionId,
      `inputValidation-end-${index}`,
      {
        executionId,
        stepIndex: index,
        stepType: "inputValidation",
        phase: "end" as const,
        title: "Input validation completed",
        message: "All fields passed validation",
        durationMs: Date.now() - start,
        timestamp: Date.now(),
      },
    );

    if (isLastStep) {
      await logExecutionFinished(streams, {
        executionId,
        totalSteps,
        startedAt: start,
      });
      return;
    }

    // Flatten input fields into vars so downstream steps can access them directly
    const inputData = vars.input || {};
    const nextVars: any = {
      ...vars,
      [output]: { ok: true },
    };
    Object.keys(inputData).forEach((key) => {
      nextVars[key] = inputData[key];
    });

    await ctx.emit({
      topic: "workflow.run",
      data: {
        steps,
        index: index + 1,
        vars: nextVars,
        executionId,
        ownerId,
      },
    });
  } catch (err) {
    logError("inputValidation", err);
    throw err;
  }
};
