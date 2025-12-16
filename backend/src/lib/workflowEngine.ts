import mongoose from "mongoose";
import { sendEmail } from "../lib/email";
import {
  resolveObjectTemplates,
  resolveTemplate,
} from "../flows/templateResolver";

export async function runEngine(steps: any[], input: any, headers: any = {}) {
  const vars: Record<string, any> = {};
  const logs: any[] = [];

  // Load input vars
  Object.assign(vars, input);

  for (const step of steps) {
    logs.push(`Running: ${step.type}`);

    // -------------------------
    // 1️⃣ INPUT
    // -------------------------
    if (step.type === "input") {
      step.variables.forEach((v: any) => {
        if (!(v.name in vars)) vars[v.name] = "";
      });
      continue;
    }

    // -------------------------
    // 2️⃣ DB.FIND
    // -------------------------
    if (step.type === "dbFind") {
      const Model = mongoose.connection.models[step.collection];
      const filters = resolveObjectTemplates(step.filters, vars);

      const result =
        step.findType === "findOne"
          ? await Model.findOne(filters)
          : await Model.find(filters);

      vars[step.output] = result;
      logs.push({ step: step.id, result });
      continue;
    }

    // -------------------------
    // 3️⃣ dbInsert
    // -------------------------
    // -------------------------
    // 3️⃣ dbInsert  (with password hashing)
    // -------------------------
    if (step.type === "dbInsert") {
      const Model = mongoose.connection.models[step.collection];
      const data = resolveObjectTemplates(step.data, vars);

      // 🔥 Hash password if provided
      if (data.password) {
        const bcrypt = require("bcryptjs");
        data.password = await bcrypt.hash(data.password, 10);
      }

      const created = await Model.create(data);
      vars[step.output] = created;

      logs.push({ step: step.id, created });
      continue;
    }

    // -------------------------
    // 4️⃣ dbUpdate
    // -------------------------
    if (step.type === "dbUpdate") {
      const Model = mongoose.connection.models[step.collection];

      const filters = resolveObjectTemplates(step.filters, vars);
      const update = resolveObjectTemplates(step.update, vars);

      const result =
        step.updateType === "updateOne"
          ? await Model.findOneAndUpdate(
              filters,
              { $set: update },
              { new: true }
            )
          : await Model.updateMany(filters, { $set: update });

      vars[step.output] = result;
      logs.push({ step: step.id, result });
      continue;
    }

    // -------------------------
    // 5️⃣ dbDelete
    // -------------------------
    if (step.type === "dbDelete") {
      const Model = mongoose.connection.models[step.collection];
      const filters = resolveObjectTemplates(step.filters, vars);

      const result =
        step.deleteType === "deleteOne"
          ? await Model.deleteOne(filters)
          : await Model.deleteMany(filters);

      vars[step.output] = result;
      logs.push({ step: step.id, result });
      continue;
    }

    // -------------------------
    // 6️⃣ LOG
    // -------------------------
    if (step.type === "log") {
      const resolved = resolveObjectTemplates(step.input, vars);
      logs.push({ step: step.id, resolved });
      continue;
    }

    if (step.type === "authMiddleware") {
      const authHeader =
        headers?.authorization || headers?.Authorization || null;

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        logs.push({
          step: step.id,
          type: "authMiddleware",
          status: "failed",
          error: "Missing Authorization Bearer token",
        });

        return {
          ok: false,
          failedStep: step.id,
          error: "Auth failed: missing token in header",
          logs,
        };
      }

      const token = authHeader.split(" ")[1];
      const jwt = require("jsonwebtoken");

      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        vars.__auth = decoded;
        vars.currentUser = decoded;

        logs.push({
          step: step.id,
          type: "authMiddleware",
          status: "passed",
          decoded,
        });

        continue;
      } catch (err: any) {
        logs.push({
          step: step.id,
          type: "authMiddleware",
          status: "failed",
          error: err.message || "Invalid token",
        });

        return {
          ok: false,
          failedStep: step.id,
          error: "Auth failed: invalid token",
          logs,
        };
      }
    }

    /* ------------------------------------------------------- *
     * 8️⃣ USER LOGIN
     * ------------------------------------------------------- */
    // -------------------------
    // 8️⃣ USER LOGIN
    // -------------------------
    if (step.type === "userLogin") {
      const email = resolveObjectTemplates(step.email, vars);
      const password = resolveObjectTemplates(step.password, vars);
      const outputVar = step.output || "loginResult";

      if (!email || !password) {
        logs.push({
          step: step.id,
          type: "userLogin",
          status: "failed",
          error: "Missing email or password",
        });

        vars[outputVar] = { ok: false, error: "Missing email or password" };
        continue;
      }

      const UserModel = mongoose.connection.models["users"];
      if (!UserModel) {
        logs.push({
          step: step.id,
          type: "userLogin",
          status: "failed",
          error: "users model not found",
        });

        vars[outputVar] = { ok: false, error: "users model not found" };
        continue;
      }

      const user = await UserModel.findOne({ email });

      if (!user) {
        logs.push({
          step: step.id,
          type: "userLogin",
          status: "failed",
          error: "users not found",
        });

        vars[outputVar] = { ok: false, error: "users not found" };
        continue;
      }

      // Compare password using bcrypt
      const bcrypt = require("bcryptjs");
      const match = await bcrypt.compare(password, user.password);

      if (!match) {
        logs.push({
          step: step.id,
          type: "userLogin",
          status: "failed",
          error: "Invalid password",
        });

        vars[outputVar] = { ok: false, error: "Invalid password" };
        continue;
      }

      const loginData = {
        ok: true,
        userId: user._id,
        email: user.email,
        name: user.name,
      };

      vars[outputVar] = loginData;

      logs.push({
        step: step.id,
        type: "userLogin",
        status: "success",
        loginData,
      });

      continue;
    }
    // -------------------------
    // 7️⃣ EMAIL SEND
    // -------------------------
    if (step.type === "emailSend") {
      const to = resolveTemplate(step.to, vars);
      const subject = resolveTemplate(step.subject, vars);
      const body = resolveTemplate(step.body, vars);

      const result = await sendEmail({ to, subject, body });

      vars[step.output || "emailResult"] = result;

      logs.push({
        step: step.id,
        type: "emailSend",
        to,
        subject,
        body,
        result,
      });

      continue;
    }

    logs.push(`Unknown step: ${step.type}`);
  }

  return {
    ok: true,
    logs,
    output: vars,
  };
}
