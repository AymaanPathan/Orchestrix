/* ------------------------------------------------------------
   InputValidation Step (Motia EVENT)
-------------------------------------------------------------*/
import { EventConfig, StepHandler } from "motia";
import { logExecutionFailed, logExecutionFinished } from "../lib/logStep";
import {
  logStepStart,
  logKV,
  logSuccess,
  logError,
} from "../lib/consoleLogger";

/* ------------------------------------------------------------
   Helpers
-------------------------------------------------------------*/
function getValueByPath(obj: any, path: string) {
  return path.split(".").reduce((acc, key) => acc?.[key], obj);
}

function validateType(value: any, type?: string): string | null {
  if (!type) return null;

  if (type === "number" && isNaN(Number(value))) {
    return "Expected number";
  }

  if (type === "string" && typeof value !== "string") {
    return "Expected string";
  }

  if (type === "boolean" && typeof value !== "boolean") {
    return "Expected boolean";
  }

  return null;
}

/* ------------------------------------------------------------
   Config
-------------------------------------------------------------*/
export const config: EventConfig = {
  name: "inputValidation",
  type: "event",
  subscribes: ["inputValidation"],
  emits: ["workflow.run"],
};

/* ------------------------------------------------------------
   Handler
-------------------------------------------------------------*/
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
  } = payload;

  try {
    logStepStart(index, "inputValidation");
    logKV("Rules", rules);
    logKV("Vars", vars);

    // ───────── STREAM: START ─────────
    await streams.executionLog.set(
      executionId,
      `inputValidation-start-${index}`,
      {
        executionId,
        stepIndex: index,
        stepType: "inputValidation",
        phase: "step_started",
        title: "Input validation started",
        timestamp: Date.now(),
      }
    );

    const errors: Record<string, string[]> = {};

    for (const rule of rules) {
      const { field, required, type } = rule;

      // Resolve field path (supports input.name, input.email, etc.)
      const value = getValueByPath(vars, field);

      logKV(`Validating field: ${field}`, value);

      // Required validation
      if (required && (value === undefined || value === "")) {
        if (!errors[field]) errors[field] = [];
        errors[field].push("Field is required");
        continue;
      }

      // Type validation
      if (value !== undefined) {
        const typeError = validateType(value, type);
        if (typeError) {
          if (!errors[field]) errors[field] = [];
          errors[field].push(typeError);
        }
      }
    }

    // ───────── STREAM: RESULT ─────────
    await streams.executionLog.set(
      executionId,
      `inputValidation-result-${index}`,
      {
        executionId,
        stepIndex: index,
        stepType: "inputValidation",
        phase: "data",
        title: "Validation result",
        data: {
          ok: Object.keys(errors).length === 0,
          errors,
        },
        timestamp: Date.now(),
      }
    );

    if (Object.keys(errors).length > 0) {
      logError("inputValidation", errors);

      // 🔴 STEP ERROR (UI RECOGNIZES THIS)
      await streams.executionLog.set(
        executionId,
        `inputValidation-error-${index}`,
        {
          executionId,
          stepIndex: index,
          stepType: "inputValidation",
          phase: "error",
          title: "Input validation failed",
          data: errors,
          durationMs: Date.now() - start,
          timestamp: Date.now(),
        }
      );

      // 🔴 EXECUTION FAILED (THIS STOPS UI SPINNER)
      await logExecutionFailed(streams, {
        executionId,
        failedStepIndex: index,
        totalSteps: steps?.length || 0,
        error: "Input validation failed",
      });

      throw new Error("Input validation failed");
    }
    const totalSteps = steps?.length || 0;
    const isLastStep = index >= totalSteps - 1;

    // ✅ Validation passed
    logSuccess("inputValidation", Date.now() - start);
    await streams.executionLog.set(
      executionId,
      `inputValidation-end-${index}`,
      {
        executionId,
        stepIndex: index,
        stepType: "inputValidation",
        phase: "step_finished", // ✅ IMPORTANT
        title: "Input validation completed",
        durationMs: Date.now() - start,
        timestamp: Date.now(),
      }
    );

    if (isLastStep) {
      await logExecutionFinished(streams, {
        executionId,
        totalSteps,
        startedAt: start,
      });
      return; // ⛔ DO NOT emit workflow.run
    }

    // 🔁 Continue workflow
    // Take original input object
    const inputData = vars.input || {};

    // Re-emit validated data
    const nextVars = {
      ...vars,

      // optional grouped object
      [output]: {
        ok: true,
      },
    };

    // 🔥 FLATTEN INPUT FIELDS (THIS IS WHAT YOU WANT)
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
      },
    });
  } catch (err) {
    logError("inputValidation", err);
    throw err;
  }
};
