import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { resolveObject } from "../lib/resolveValue";
import { sendEmail } from "../lib/email";
import { connectMongo } from "../lib/mongo";
import { getUserConnection } from "../lib/userDbPool";
import {
  logSection,
  logStepStart,
  logKV,
  logSuccess,
  logError,
} from "../lib/consoleLogger";

// ── Get a dynamic model on the USER's connection ─────────────────────────────
// We can't use getModel() here because that uses the app's own mongoose
// connection which has no idea about the user's collections.
function getDynamicModel(conn: mongoose.Connection, collectionName: string) {
  // Re-use existing model if already registered on this connection
  if (conn.models[collectionName]) return conn.models[collectionName];

  // Create a schema-less (flexible) model so any document shape works
  const schema = new mongoose.Schema({}, { strict: false, timestamps: true });
  return conn.model(collectionName, schema, collectionName);
}

export async function runEngine(
  steps: any[],
  input: any,
  headers: any = {},
  ownerId: string = "default-owner",
) {
  logSection("WORKFLOW ENGINE STARTED");
  logKV("Steps received", steps);
  logKV("Initial input", input);

  await connectMongo();

  // ── Connect to the user's database once for the whole execution ──────────
  let userConn: mongoose.Connection | null = null;
  try {
    userConn = await getUserConnection(ownerId);
  } catch (err: any) {
    return {
      ok: false,
      failedStep: -1,
      failedStepName: "db_connect",
      error: `Could not connect to your database: ${err.message}`,
      steps: [],
      totalDurationMs: 0,
    };
  }

  const vars: Record<string, any> = { input: { ...input } };
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
      // ────────────────────────────────────────────────────────────────────
      // INPUT
      // ────────────────────────────────────────────────────────────────────
      if (step.type === "input") {
        const variables = step.data?.variables || [];
        for (const v of variables) {
          if (!(v.name in vars.input)) {
            vars.input[v.name] = v.default ?? null;
          }
        }
        stepLog.input = { variables: variables.map((v: any) => v.name) };
        stepLog.output = { values: { ...vars.input } };
        logSuccess("input", Date.now() - stepStart);
      }

      // ────────────────────────────────────────────────────────────────────
      // INPUT VALIDATION
      // ────────────────────────────────────────────────────────────────────
      else if (step.type === "inputValidation") {
        const errors: Record<string, string[]> = {};

        for (const rule of step.rules || []) {
          const value = resolveObject(vars, rule.field);

          if (
            rule.required &&
            (value === undefined || value === null || value === "")
          ) {
            errors[rule.field] = errors[rule.field] || [];
            errors[rule.field].push("Field is required");
            continue;
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

        if (Object.keys(errors).length > 0) {
          throw Object.assign(new Error("Input validation failed"), {
            details: errors,
          });
        }

        vars[step.output || "validated"] = true;
        stepLog.output = { valid: true };
        logSuccess("inputValidation", Date.now() - stepStart);
      }

      // ────────────────────────────────────────────────────────────────────
      // DB FIND  — runs on USER's database
      // ────────────────────────────────────────────────────────────────────
      else if (step.type === "dbFind") {
        const Model = getDynamicModel(userConn!, step.collection);
        const filters = resolveObject(vars, step.filters || {});

        logKV("Collection", step.collection);
        logKV("Resolved filters", filters);

        stepLog.input = {
          collection: step.collection,
          findType: step.findType,
          filters,
        };

        const result =
          step.findType === "many"
            ? await Model.find(filters).lean()
            : await Model.findOne(filters).lean();

        vars[step.output || "found"] = result;

        stepLog.output = {
          found: result !== null,
          resultCount: Array.isArray(result) ? result.length : result ? 1 : 0,
          outputVariable: step.output || "found",
        };

        logKV("Find result", result);
        logSuccess("dbFind", Date.now() - stepStart);
      }

      // ────────────────────────────────────────────────────────────────────
      // DB INSERT  — runs on USER's database
      // ────────────────────────────────────────────────────────────────────
      else if (step.type === "dbInsert") {
        const Model = getDynamicModel(userConn!, step.collection);
        const resolved = resolveObject(vars, step.data || {});

        // Unwrap nested `data` key if AI generated it that way
        const data =
          resolved &&
          typeof resolved === "object" &&
          "data" in resolved &&
          typeof resolved.data === "object"
            ? resolved.data
            : resolved;

        if (
          !data ||
          typeof data !== "object" ||
          Object.keys(data).length === 0
        ) {
          throw new Error(
            "dbInsert: insert document is empty after resolution",
          );
        }

        // Hash password if present
        if (data.password) {
          data.password = await bcrypt.hash(data.password, 10);
        }

        logKV("Collection", step.collection);
        logKV("Insert data", data);

        stepLog.input = {
          collection: step.collection,
          fields: Object.keys(data),
        };
        const created = (await Model.create(data)) as any;
        vars[step.output || "created"] = created;
        stepLog.output = {
          success: true,
          documentId: created._id, // ✅
          outputVariable: step.output || "created",
        };

        logKV("Created document", created);
        logSuccess("dbInsert", Date.now() - stepStart);
      }

      // ────────────────────────────────────────────────────────────────────
      // DB UPDATE  — runs on USER's database
      // ────────────────────────────────────────────────────────────────────
      else if (step.type === "dbUpdate") {
        const Model = getDynamicModel(userConn!, step.collection);
        const filter = resolveObject(vars, step.filter || step.filters || {});
        const resolved = resolveObject(vars, step.data || step.update || {});

        const data =
          resolved &&
          typeof resolved === "object" &&
          "data" in resolved &&
          typeof resolved.data === "object"
            ? resolved.data
            : resolved;

        if (
          !data ||
          typeof data !== "object" ||
          Object.keys(data).length === 0
        ) {
          throw new Error(
            "dbUpdate: update document is empty after resolution",
          );
        }

        logKV("Collection", step.collection);
        logKV("Filter", filter);
        logKV("Update data", data);

        stepLog.input = {
          collection: step.collection,
          filter,
          fields: Object.keys(data),
        };

        const updated = await Model.findOneAndUpdate(
          filter,
          { $set: data },
          { new: true },
        ).lean();
        vars[step.output || "updated"] = updated;

        stepLog.output = {
          success: true,
          documentFound: updated !== null,
          outputVariable: step.output || "updated",
        };

        logKV("Updated document", updated);
        logSuccess("dbUpdate", Date.now() - stepStart);
      }

      // ────────────────────────────────────────────────────────────────────
      // AUTH MIDDLEWARE
      // ────────────────────────────────────────────────────────────────────
      else if (step.type === "authMiddleware") {
        const auth = headers.authorization || headers.Authorization;

        stepLog.input = { hasAuthHeader: !!auth };

        if (!auth?.startsWith("Bearer ")) {
          throw new Error("Missing or invalid Authorization header");
        }

        if (!process.env.JWT_SECRET) {
          throw new Error("JWT_SECRET is not configured");
        }

        const token = auth.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        vars.currentUser = decoded;

        stepLog.output = { authenticated: true, outputVariable: "currentUser" };

        logKV("Decoded JWT", decoded);
        logSuccess("authMiddleware", Date.now() - stepStart);
      }

      // ────────────────────────────────────────────────────────────────────
      // EMAIL SEND
      // ────────────────────────────────────────────────────────────────────
      else if (step.type === "emailSend") {
        const to = resolveObject(vars, step.to);
        const subject = resolveObject(vars, step.subject);
        const body = resolveObject(vars, step.body);

        if (!to || typeof to !== "string")
          throw new Error("emailSend: 'to' is required");
        if (!subject) throw new Error("emailSend: 'subject' is required");
        if (!body) throw new Error("emailSend: 'body' is required");

        stepLog.input = { to, subject };

        await sendEmail({ to, subject, body });

        stepLog.output = { sent: true, recipient: to };
        logSuccess("emailSend", Date.now() - stepStart);
      }

      // ────────────────────────────────────────────────────────────────────
      // UNKNOWN STEP
      // ────────────────────────────────────────────────────────────────────
      else {
        throw new Error(`Unknown step type: "${step.type}"`);
      }

      stepLog.durationMs = Date.now() - stepStart;
      stepResponses.push(stepLog);
    } catch (err: any) {
      stepLog.status = "failed";
      stepLog.error = {
        message: err.message || "Unknown error",
        details: err.details || null,
      };
      stepLog.durationMs = Date.now() - stepStart;

      logError(step.type, err);
      stepResponses.push(stepLog);

      return {
        ok: false,
        failedStep: index,
        failedStepName: step.name || `${step.type}_${index}`,
        error: err.message || "Unknown error",
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
