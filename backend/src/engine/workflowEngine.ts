import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { resolveObject } from "../lib/resolveValue";
import { sendEmail } from "../lib/email";
import { connectMongo } from "../lib/mongo";
import { getModel } from "../lib/getModel";

export async function runEngine(steps: any[], input: any, headers: any = {}) {
  await connectMongo();

  const vars: Record<string, any> = {
    input: { ...input },
  };

  const stepResponses: any[] = [];
  const startedAt = Date.now();

  for (let index = 0; index < steps.length; index++) {
    const step = steps[index];
    const stepStart = Date.now();

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
        const variables = step.data?.variables || [];

        for (const v of variables) {
          if (!(v.name in vars.input)) {
            vars.input[v.name] = v.default ?? null;
          }
        }

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
      }

      // ------------------------------------------------
      // INPUT VALIDATION
      // ------------------------------------------------
      else if (step.type === "inputValidation") {
        const errors: Record<string, string[]> = {};
        const validationDetails: any[] = [];
        const resolvedValues: Record<string, any> = {};

        for (const rule of step.rules || []) {
          const value = resolveObject(vars, rule.field);
          resolvedValues[rule.field] = value;

          const ruleResult: any = {
            field: rule.field,
            value: value,
            valueType: typeof value,
            rules: {},
            passed: true,
            failures: [],
          };

          // Required validation
          if (rule.required !== undefined) {
            ruleResult.rules.required = rule.required;

            if (
              rule.required &&
              (value === undefined || value === null || value === "")
            ) {
              if (!errors[rule.field]) errors[rule.field] = [];
              errors[rule.field].push("Field is required");
              ruleResult.passed = false;
              ruleResult.failures.push({
                rule: "required",
                expected: true,
                actual: "missing or empty",
              });
            }
          }

          // Type validation
          if (value !== undefined && value !== null && rule.type) {
            ruleResult.rules.type = rule.type;

            if (rule.type === "number") {
              const isValidNumber = !isNaN(Number(value)) && value !== "";
              if (!isValidNumber) {
                if (!errors[rule.field]) errors[rule.field] = [];
                errors[rule.field].push("Expected number");
                ruleResult.passed = false;
                ruleResult.failures.push({
                  rule: "type",
                  expected: "number",
                  actual: typeof value,
                });
              }
            }

            if (rule.type === "string") {
              if (typeof value !== "string") {
                if (!errors[rule.field]) errors[rule.field] = [];
                errors[rule.field].push("Expected string");
                ruleResult.passed = false;
                ruleResult.failures.push({
                  rule: "type",
                  expected: "string",
                  actual: typeof value,
                });
              }
            }

            if (rule.type === "boolean") {
              if (typeof value !== "boolean") {
                if (!errors[rule.field]) errors[rule.field] = [];
                errors[rule.field].push("Expected boolean");
                ruleResult.passed = false;
                ruleResult.failures.push({
                  rule: "type",
                  expected: "boolean",
                  actual: typeof value,
                });
              }
            }
          }

          validationDetails.push(ruleResult);
        }

        stepLog.input = {
          values: resolvedValues,
          rulesCount: step.rules?.length || 0,
        };

        // ❌ Validation failed
        if (Object.keys(errors).length > 0) {
          stepLog.phase = "error";
          stepLog.error = {
            message: "Input validation failed",
            summary: `${Object.keys(errors).length} field(s) failed validation`,
            errors: errors,
            validationDetails: validationDetails,
            failedFields: Object.keys(errors),
          };

          const err = new Error("Input validation failed");
          (err as any).details = errors;
          throw err;
        }

        // ✅ Validation passed
        vars[step.output || "validated"] = true;

        stepLog.output = {
          validated: true,
          validationDetails: validationDetails,
          summary: `All ${validationDetails.length} validation rule(s) passed`,
        };
      }

      // ------------------------------------------------
      // DB FIND
      // ------------------------------------------------
      else if (step.type === "dbFind") {
        const Model = getModel(step);
        if (!Model) {
          throw new Error(`Model not found: ${step.collection}`);
        }

        const filters = resolveObject(vars, step.filters || {});
        const result =
          step.findType === "many"
            ? await Model.find(filters)
            : await Model.findOne(filters);

        vars[step.output || "found"] = result;

        stepLog.input = {
          collection: step.collection,
          findType: step.findType || "one",
          filters,
        };
        stepLog.output = {
          found: result !== null,
          count: Array.isArray(result) ? result.length : result ? 1 : 0,
          data: result,
        };
      }

      // ------------------------------------------------
      // DB INSERT
      // ------------------------------------------------
      else if (step.type === "dbInsert") {
        const Model = getModel(step);
        if (!Model) {
          throw new Error(`Model not found: ${step.collection}`);
        }

        const data = resolveObject(vars, step.data || {});
        const hasPassword = !!data.password;

        if (data.password) {
          data.password = await bcrypt.hash(data.password, 10);
        }

        const created = await Model.create(data);
        vars[step.output || "created"] = created;

        stepLog.input = {
          collection: step.collection,
          fields: Object.keys(step.data || {}),
          hasPassword,
        };
        stepLog.output = {
          success: true,
          id: created._id || created.id,
          data: created,
        };
      }

      // ------------------------------------------------
      // DB UPDATE
      // ------------------------------------------------
      else if (step.type === "dbUpdate") {
        const Model = getModel(step);
        if (!Model) {
          throw new Error(`Model not found: ${step.collection}`);
        }

        const filter = resolveObject(vars, step.filter || {});
        const data = resolveObject(vars, step.data || {});
        const updated = await Model.findOneAndUpdate(
          filter,
          { $set: data },
          { new: true }
        );

        vars[step.output || "updated"] = updated;

        stepLog.input = {
          collection: step.collection,
          filter,
          updateFields: Object.keys(data),
        };
        stepLog.output = {
          success: !!updated,
          found: !!updated,
          data: updated,
        };
      }

      // ------------------------------------------------
      // AUTH MIDDLEWARE
      // ------------------------------------------------
      else if (step.type === "authMiddleware") {
        const auth = headers.authorization || headers.Authorization || null;

        stepLog.input = {
          hasAuthHeader: !!auth,
          headerType: auth?.split(" ")[0] || null,
        };

        if (!auth?.startsWith("Bearer ")) {
          throw new Error("Missing or invalid Authorization header");
        }

        const token = auth.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET!);

        vars.currentUser = decoded;
        vars.__auth = decoded;

        stepLog.output = {
          authenticated: true,
          userId: (decoded as any).userId || (decoded as any).id,
          user: decoded,
        };
      }

      // ------------------------------------------------
      // EMAIL SEND
      // ------------------------------------------------
      else if (step.type === "emailSend") {
        const to = resolveObject(vars, step.to);
        const subject = resolveObject(vars, step.subject);
        const body = resolveObject(vars, step.body);

        stepLog.input = {
          to,
          subject,
          bodyLength: body?.length || 0,
        };

        if (!to || !subject || !body) {
          throw new Error(
            "Email resolution failed: missing required fields (to, subject, or body)"
          );
        }

        const result = await sendEmail({ to, subject, body });
        vars[step.output || "emailResult"] = result;

        stepLog.output = {
          sent: true,
          recipient: to,
          result,
        };
      }

      // ------------------------------------------------
      // UNKNOWN STEP
      // ------------------------------------------------
      else {
        stepLog.phase = "error";
        stepLog.error = {
          message: `Unknown step type: ${step.type}`,
          availableTypes: [
            "input",
            "inputValidation",
            "dbFind",
            "dbInsert",
            "dbUpdate",
            "authMiddleware",
            "emailSend",
          ],
        };
        throw new Error(`Unknown step type: ${step.type}`);
      }

      stepLog.phase = "step_finished";
      stepLog.durationMs = Date.now() - stepStart;
      stepResponses.push(stepLog);
    } catch (err: any) {
      stepLog.phase = "error";

      // Enhanced error logging
      stepLog.error = stepLog.error || {
        message: err.message || "Step failed",
        type: err.name || "Error",
        stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
      };

      // Preserve structured validation errors
      if (err.details) {
        stepLog.error.validationErrors = err.details;
      }

      stepLog.durationMs = Date.now() - stepStart;
      stepResponses.push(stepLog);

      return {
        ok: false,
        failedStep: index,
        failedStepName: step.name || `${step.type}_${index}`,
        error:
          typeof stepLog.error === "string"
            ? stepLog.error
            : stepLog.error.message,
        errorDetails: stepLog.error,
        steps: stepResponses,
        totalDurationMs: Date.now() - startedAt,
      };
    }
  }

  return {
    ok: true,
    steps: stepResponses,
    output: vars,
    totalDurationMs: Date.now() - startedAt,
  };
}
