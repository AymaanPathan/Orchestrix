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
      status: "success",
      input: {},
      output: {},
      error: null,
      durationMs: 0,
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
            type: v.type || "any",
            required: v.required || false,
            hasDefault: v.default !== undefined,
          })),
        };

        stepLog.output = {
          variablesSet: Object.keys(vars.input),
          values: { ...vars.input },
        };

        logSuccess("input", Date.now() - stepStart);
      }

      // ------------------------------------------------
      // INPUT VALIDATION
      // ------------------------------------------------
      else if (step.type === "inputValidation") {
        logKV("Validation rules", step.rules);

        const errors: Record<string, string[]> = {};
        const validationDetails: any[] = [];
        const resolvedValues: Record<string, any> = {};

        for (const rule of step.rules || []) {
          const value = resolveObject(vars, rule.field);
          resolvedValues[rule.field] = value;

          const fieldValidation: any = {
            field: rule.field,
            value: value,
            rules: [],
            passed: true,
          };

          if (
            rule.required &&
            (value === undefined || value === null || value === "")
          ) {
            errors[rule.field] = errors[rule.field] || [];
            errors[rule.field].push("Field is required");
            fieldValidation.rules.push({ type: "required", passed: false });
            fieldValidation.passed = false;
          } else if (rule.required) {
            fieldValidation.rules.push({ type: "required", passed: true });
          }

          if (
            rule.type === "number" &&
            value !== undefined &&
            isNaN(Number(value))
          ) {
            errors[rule.field] = errors[rule.field] || [];
            errors[rule.field].push("Expected number");
            fieldValidation.rules.push({ type: "number", passed: false });
            fieldValidation.passed = false;
          } else if (rule.type === "number" && value !== undefined) {
            fieldValidation.rules.push({ type: "number", passed: true });
          }

          if (
            rule.type === "string" &&
            value !== undefined &&
            typeof value !== "string"
          ) {
            errors[rule.field] = errors[rule.field] || [];
            errors[rule.field].push("Expected string");
            fieldValidation.rules.push({ type: "string", passed: false });
            fieldValidation.passed = false;
          } else if (rule.type === "string" && value !== undefined) {
            fieldValidation.rules.push({ type: "string", passed: true });
          }

          if (
            rule.type === "boolean" &&
            value !== undefined &&
            typeof value !== "boolean"
          ) {
            errors[rule.field] = errors[rule.field] || [];
            errors[rule.field].push("Expected boolean");
            fieldValidation.rules.push({ type: "boolean", passed: false });
            fieldValidation.passed = false;
          } else if (rule.type === "boolean" && value !== undefined) {
            fieldValidation.rules.push({ type: "boolean", passed: true });
          }

          validationDetails.push(fieldValidation);
        }

        logKV("Resolved validation values", resolvedValues);

        stepLog.input = {
          rulesCount: step.rules?.length || 0,
          fieldsValidated: validationDetails,
        };

        if (Object.keys(errors).length > 0) {
          logKV("Validation errors", errors);
          stepLog.output = {
            valid: false,
            errors: errors,
            errorCount: Object.keys(errors).length,
          };
          throw Object.assign(new Error("Input validation failed"), {
            details: errors,
          });
        }

        vars[step.output || "validated"] = true;

        stepLog.output = {
          valid: true,
          allFieldsPassed: true,
        };

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

        if (!Model) {
          throw new Error(`Model not found for collection: ${collectionName}`);
        }

        const filters = resolveObject(vars, step.filters || {});
        logKV("Resolved filters", filters);

        stepLog.input = {
          collection: collectionName,
          findType: step.findType || "one",
          filters: filters,
        };

        const result =
          step.findType === "many"
            ? await Model.find(filters)
            : await Model.findOne(filters);

        vars[step.output || "found"] = result;

        stepLog.output = {
          found: result !== null,
          resultCount: Array.isArray(result) ? result.length : result ? 1 : 0,
          outputVariable: step.output || "found",
          preview: Array.isArray(result)
            ? result.slice(0, 2).map((r) => ({ _id: r._id }))
            : result
            ? { _id: result._id }
            : null,
        };

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

        if (!Model) {
          throw new Error(`Model not found for collection: ${collectionName}`);
        }

        const resolved = resolveObject(vars, step.data || {});

        // 🔥 UNWRAP DATA LIKE EXECUTION ENGINE
        const data =
          resolved &&
          typeof resolved === "object" &&
          "data" in resolved &&
          typeof resolved.data === "object"
            ? resolved.data
            : resolved;

        const inputData = { ...data };
        const hadPassword = !!data.password;

        logKV("Resolved insert data (before hash)", data);

        if (data.password) {
          data.password = await bcrypt.hash(data.password, 10);
        }

        logKV("Final insert data", data);

        stepLog.input = {
          collection: collectionName,
          dataFields: Object.keys(inputData),
          passwordHashed: hadPassword,
        };

        const created = await Model.create(data);
        vars[step.output || "created"] = created;

        stepLog.output = {
          success: true,
          documentId: created._id,
          outputVariable: step.output || "created",
          document: created,
        };

        logKV("Created document", created);
        logSuccess("dbInsert", Date.now() - stepStart);
      }

      // ------------------------------------------------
      // DB UPDATE
      // ------------------------------------------------
      else if (step.type === "dbUpdate") {
        logKV("Collection (raw)", step.collection);

        const Model = getModel(step.collection);

        if (!Model) {
          throw new Error(`Model not found for collection: ${step.collection}`);
        }

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

        stepLog.input = {
          collection: step.collection,
          filter: filter,
          updateFields: Object.keys(data),
        };

        const updated = await Model.findOneAndUpdate(
          filter,
          { $set: data },
          { new: true }
        );

        vars[step.output || "updated"] = updated;

        stepLog.output = {
          success: true,
          documentFound: updated !== null,
          documentId: updated?._id,
          outputVariable: step.output || "updated",
          document: updated,
        };

        logKV("Updated document", updated);
        logSuccess("dbUpdate", Date.now() - stepStart);
      }

      // ------------------------------------------------
      // AUTH
      // ------------------------------------------------
      else if (step.type === "authMiddleware") {
        logKV("Headers received", headers);

        const auth = headers.authorization || headers.Authorization;

        stepLog.input = {
          hasAuthHeader: !!auth,
          authType: auth?.split(" ")[0],
        };

        if (!auth?.startsWith("Bearer ")) {
          throw new Error("Missing or invalid Authorization header");
        }

        const token = auth.split(" ")[1];

        if (!process.env.JWT_SECRET) {
          throw new Error("JWT_SECRET is not configured");
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        vars.currentUser = decoded;

        stepLog.output = {
          authenticated: true,
          userId: (decoded as any).userId || (decoded as any).id,
          outputVariable: "currentUser",
        };

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

        // Validate email inputs
        if (!to || typeof to !== "string") {
          throw new Error(
            "Email recipient (to) is required and must be a valid string"
          );
        }

        if (!subject || typeof subject !== "string") {
          throw new Error(
            "Email subject is required and must be a valid string"
          );
        }

        if (!body) {
          throw new Error("Email body is required");
        }

        stepLog.input = {
          to: to,
          subject: subject,
          bodyLength: body?.length || 0,
          bodyPreview:
            body?.substring(0, 100) + (body?.length > 100 ? "..." : ""),
        };

        try {
          const emailResult = await sendEmail({ to, subject, body });

          stepLog.output = {
            sent: true,
            recipient: to,
            timestamp: new Date().toISOString(),
          };

          logSuccess("emailSend", Date.now() - stepStart);
        } catch (emailError: any) {
          throw new Error(
            `Failed to send email to ${to}: ${
              emailError.message || "Unknown email service error"
            }`
          );
        }
      }

      // ------------------------------------------------
      // UNKNOWN
      // ------------------------------------------------
      else {
        throw new Error(`Unknown step type: ${step.type}`);
      }

      stepLog.durationMs = Date.now() - stepStart;
      stepResponses.push(stepLog);
    } catch (err: any) {
      stepLog.status = "failed";
      stepLog.error = {
        message: err.message || "Unknown error occurred",
        code: err.code || null,
        details: err.details || null,
        stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
      };
      stepLog.durationMs = Date.now() - stepStart;

      logError(step.type, err);
      logKV("Failed step config", step);
      logKV("Vars at failure", vars);

      stepResponses.push(stepLog);

      return {
        ok: false,
        failedStep: index,
        failedStepName: step.name || `${step.type}_${index}`,
        error: err.message || "Unknown error occurred",
        errorDetails: err.details || null,
        steps: stepResponses,
        totalDurationMs: Date.now() - startedAt,
      };
    }
  }

logKV("Final vars", vars);

  return {
    ok: true,
    stepsExecuted: stepResponses.length,
    steps: stepResponses,
    output: vars,
    totalDurationMs: Date.now() - startedAt,
  };
}
