import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { resolveObject } from "../lib/resolveValue";
import { sendEmail } from "../lib/email";
import { connectMongo } from "../lib/mongo";
import { getModel } from "../lib/getModel";
import {
  logSection,
  logStepStart,
  logKV,
  logSuccess,
  logError,
} from "../lib/consoleLogger";

export async function runEngine(steps: any[], input: any, headers: any = {}) {
  logSection("WORKFLOW ENGINE STARTED");
  logKV("Steps received", steps);
  logKV("Initial input", input);

  await connectMongo();

  const vars: Record<string, any> = {
    input: { ...input },
  };

  const stepResponses: any[] = [];
  const startedAt = Date.now();

  for (let index = 0; index < steps.length; index++) {
    const step = steps[index];
    const stepStart = Date.now();

    logStepStart(index, step.type);
    logKV("Step raw config", step);
    logKV("Vars at step start", vars);

    const stepLog: any = {
      stepIndex: index,
      stepType: step.type,
      stepName: step.name || `${step.type}_${index}`,
      phase: "step_started",
      input: {},
      output: null,
      error: null,
      startedAt: stepStart,
    };

    try {
      // ------------------------------------------------
      // INPUT
      // ------------------------------------------------
      if (step.type === "input") {
        logKV("Input variables config", step.data?.variables);

        const variables = step.data?.variables || [];

        for (const v of variables) {
          if (!(v.name in vars.input)) {
            vars.input[v.name] = v.default ?? null;
          }
        }

        logKV("Vars after input", vars.input);

        stepLog.input = {
          variablesConfigured: variables.map((v: any) => ({
            name: v.name,
            hasDefault: v.default !== undefined,
            default: v.default,
          })),
        };

        stepLog.output = {
          input: vars.input,
          variablesSet: Object.keys(vars.input),
        };

        logSuccess("input", Date.now() - stepStart);
      }

      // ------------------------------------------------
      // INPUT VALIDATION
      // ------------------------------------------------
      else if (step.type === "inputValidation") {
        logKV("Validation rules", step.rules);

        const errors: Record<string, string[]> = {};
        const validationDetails: any[] = {};
        const resolvedValues: Record<string, any> = {};

        for (const rule of step.rules || []) {
          const value = resolveObject(vars, rule.field);
          resolvedValues[rule.field] = value;

          if (
            rule.required &&
            (value === undefined || value === null || value === "")
          ) {
            errors[rule.field] = errors[rule.field] || [];
            errors[rule.field].push("Field is required");
          }

          if (
            rule.type === "number" &&
            value !== undefined &&
            isNaN(Number(value))
          ) {
            errors[rule.field] = errors[rule.field] || [];
            errors[rule.field].push("Expected number");
          }

          if (
            rule.type === "string" &&
            value !== undefined &&
            typeof value !== "string"
          ) {
            errors[rule.field] = errors[rule.field] || [];
            errors[rule.field].push("Expected string");
          }

          if (
            rule.type === "boolean" &&
            value !== undefined &&
            typeof value !== "boolean"
          ) {
            errors[rule.field] = errors[rule.field] || [];
            errors[rule.field].push("Expected boolean");
          }
        }

        logKV("Resolved validation values", resolvedValues);

        if (Object.keys(errors).length > 0) {
          logKV("Validation errors", errors);
          throw Object.assign(new Error("Input validation failed"), {
            details: errors,
          });
        }

        vars[step.output || "validated"] = true;
        logSuccess("inputValidation", Date.now() - stepStart);
      }

      // ------------------------------------------------
      // DB FIND
      // ------------------------------------------------
      else if (step.type === "dbFind") {
        logKV("Collection (raw)", step.collection);

        const collectionName = step.collection;
        logKV("Collection (used)", collectionName);

        const Model = getModel(collectionName);
        logKV("Resolved model", Model?.modelName);

        const filters = resolveObject(vars, step.filters || {});
        logKV("Resolved filters", filters);

        const result =
          step.findType === "many"
            ? await Model.find(filters)
            : await Model.findOne(filters);

        vars[step.output || "found"] = result;

        logKV("Find result", result);
        logSuccess("dbFind", Date.now() - stepStart);
      }

      // ------------------------------------------------
      // DB INSERT
      // ------------------------------------------------
      else if (step.type === "dbInsert") {
        logKV("Collection (raw)", step.collection);

        const collectionName = step.collection;
        logKV("Collection (used)", collectionName);

        const Model = getModel(collectionName);
        logKV("Resolved model", Model?.modelName);

        const resolved = resolveObject(vars, step.data || {});

        // 🔥 UNWRAP DATA LIKE EXECUTION ENGINE
        const data =
          resolved &&
          typeof resolved === "object" &&
          "data" in resolved &&
          typeof resolved.data === "object"
            ? resolved.data
            : resolved;
        logKV("Resolved insert data (before hash)", data);

        if (data.password) {
          data.password = await bcrypt.hash(data.password, 10);
        }

        logKV("Final insert data", data);

        const created = await Model.create(data);
        vars[step.output || "created"] = created;

        logKV("Created document", created);
        logSuccess("dbInsert", Date.now() - stepStart);
      }

      // ------------------------------------------------
      // DB UPDATE
      // ------------------------------------------------
      else if (step.type === "dbUpdate") {
        logKV("Collection (raw)", step.collection);

        const Model = getModel(step.collection);

        const filter = resolveObject(vars, step.filter || {});
        const resolved = resolveObject(vars, step.data || {});

        // 🔥 UNWRAP DATA LIKE EXECUTION ENGINE
        const data =
          resolved &&
          typeof resolved === "object" &&
          "data" in resolved &&
          typeof resolved.data === "object"
            ? resolved.data
            : resolved;

        logKV("Resolved filter", filter);
        logKV("Resolved update data", data);

        const updated = await Model.findOneAndUpdate(
          filter,
          { $set: data },
          { new: true }
        );

        vars[step.output || "updated"] = updated;
        logKV("Updated document", updated);

        logSuccess("dbUpdate", Date.now() - stepStart);
      }

      // ------------------------------------------------
      // AUTH
      // ------------------------------------------------
      else if (step.type === "authMiddleware") {
        logKV("Headers received", headers);

        const auth = headers.authorization || headers.Authorization;
        if (!auth?.startsWith("Bearer ")) {
          throw new Error("Missing or invalid Authorization header");
        }

        const token = auth.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET!);

        vars.currentUser = decoded;
        logKV("Decoded JWT", decoded);

        logSuccess("authMiddleware", Date.now() - stepStart);
      }

      // ------------------------------------------------
      // EMAIL
      // ------------------------------------------------
      else if (step.type === "emailSend") {
        const to = resolveObject(vars, step.to);
        const subject = resolveObject(vars, step.subject);
        const body = resolveObject(vars, step.body);

        logKV("Email to", to);
        logKV("Email subject", subject);

        await sendEmail({ to, subject, body });
        logSuccess("emailSend", Date.now() - stepStart);
      }

      // ------------------------------------------------
      // UNKNOWN
      // ------------------------------------------------
      else {
        throw new Error(`Unknown step type: ${step.type}`);
      }

      stepResponses.push(stepLog);
    } catch (err: any) {
      logError(step.type, err);
      logKV("Failed step config", step);
      logKV("Vars at failure", vars);

      return {
        ok: false,
        failedStep: index,
        failedStepName: step.name || `${step.type}_${index}`,
        error: err.message,
        errorDetails: err,
        steps: stepResponses,
        totalDurationMs: Date.now() - startedAt,
      };
    }
  }

  logSection("WORKFLOW ENGINE FINISHED");
  logKV("Final vars", vars);

  return {
    ok: true,
    steps: stepResponses,
    output: vars,
    totalDurationMs: Date.now() - startedAt,
  };
}
