import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { resolveObject } from "../lib/resolveValue";
import { resolveTemplate } from "../flows/templateResolver";
import { sendEmail } from "../lib/email";

export async function runEngine(steps: any[], input: any, headers: any = {}) {
  // 🔹 Canonical vars shape (IMPORTANT)
  const vars: Record<string, any> = {
    input: { ...input },
  };

  const logs: any[] = [];

  for (let index = 0; index < steps.length; index++) {
    const step = steps[index];

    logs.push({
      step: index,
      type: step.type,
      phase: "start",
    });

    try {
      // ------------------------------------------------
      // 1️⃣ INPUT
      // ------------------------------------------------
      if (step.type === "input") {
        for (const v of step.variables || []) {
          if (!(v.name in vars.input)) {
            vars.input[v.name] = v.default ?? "";
          }
        }

        logs.push({ step: index, status: "done" });
        continue;
      }

      // ------------------------------------------------
      // 2️⃣ INPUT VALIDATION
      // ------------------------------------------------
      if (step.type === "inputValidation") {
        for (const rule of step.rules || []) {
          const value = resolveObject(vars, rule.field);

          if (rule.required && (value === undefined || value === "")) {
            throw new Error(`Validation failed: ${rule.field}`);
          }
        }

        vars[step.output || "validated"] = true;
        logs.push({ step: index, status: "done" });
        continue;
      }

      // ------------------------------------------------
      // 3️⃣ DB FIND
      // ------------------------------------------------
      if (step.type === "dbFind") {
        const Model = mongoose.connection.models[step.collection];
        if (!Model) throw new Error(`Model not found: ${step.collection}`);

        const filters = resolveObject(vars, step.filters);
        const result =
          step.findType === "many"
            ? await Model.find(filters)
            : await Model.findOne(filters);

        vars[step.output] = result;
        logs.push({ step: index, result });
        continue;
      }

      // ------------------------------------------------
      // 4️⃣ DB INSERT
      // ------------------------------------------------
      if (step.type === "dbInsert") {
        const Model = mongoose.connection.models[step.collection];
        if (!Model) throw new Error(`Model not found: ${step.collection}`);

        const data = resolveObject(vars, step.data);

        if (data.password) {
          data.password = await bcrypt.hash(data.password, 10);
        }

        const created = await Model.create(data);
        vars[step.output] = created;

        logs.push({ step: index, created });
        continue;
      }

      // ------------------------------------------------
      // 5️⃣ DB UPDATE
      // ------------------------------------------------
      if (step.type === "dbUpdate") {
        const Model = mongoose.connection.models[step.collection];

        const filter = resolveObject(vars, step.filter);
        const data = resolveObject(vars, step.data);

        const result = await Model.findOneAndUpdate(
          filter,
          { $set: data },
          { new: true }
        );

        vars[step.output] = result;
        logs.push({ step: index, result });
        continue;
      }

      // ------------------------------------------------
      // 6️⃣ AUTH MIDDLEWARE
      // ------------------------------------------------
      if (step.type === "authMiddleware") {
        const auth = headers.authorization || headers.Authorization || null;

        if (!auth?.startsWith("Bearer ")) {
          throw new Error("Missing Authorization token");
        }

        const token = auth.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET!);

        vars.currentUser = decoded;
        vars.__auth = decoded;

        logs.push({ step: index, status: "passed" });
        continue;
      }

      // ------------------------------------------------
      // 7️⃣ EMAIL SEND
      // ------------------------------------------------
      if (step.type === "emailSend") {
        const to = resolveTemplate(step.to, vars);
        const subject = resolveTemplate(step.subject, vars);
        const body = resolveTemplate(step.body, vars);

        const result = await sendEmail({ to, subject, body });

        vars[step.output || "emailResult"] = result;
        logs.push({ step: index, result });
        continue;
      }

      // ------------------------------------------------
      // UNKNOWN STEP
      // ------------------------------------------------
      logs.push({
        step: index,
        warning: `Unknown step type: ${step.type}`,
      });
    } catch (err: any) {
      logs.push({
        step: index,
        phase: "error",
        error: err.message || "Step failed",
      });

      return {
        ok: false,
        failedStep: index,
        error: err.message,
        logs,
      };
    }
  }

  return {
    ok: true,
    logs,
    output: vars,
  };
}
