import { ApiRouteConfig, StepHandler } from "motia";
import mongoose from "mongoose";
import dns from "dns";
import { connectMongo } from "../lib/mongo.js";
import { encrypt } from "../lib/crypto.js";

// ── Force Google DNS — fixes Windows ENOTFOUND on mongodb+srv:// URIs ────────
dns.setDefaultResultOrder("ipv4first");
dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);

export const config: ApiRouteConfig = {
  name: "connectUserDb",
  type: "api",
  path: "/user/db/connect",
  method: "POST",
  emits: [],
  flows: ["WorkflowBuilder"],
};

export const handler: StepHandler<typeof config> = async (req, ctx) => {
  const { logger } = ctx;

  try {
    await connectMongo();

    const { ownerId, uri, label } = req.body as {
      ownerId: string;
      uri: string;
      label?: string;
    };

    if (!ownerId || !uri) {
      return { status: 400, body: { error: "ownerId and uri are required" } };
    }

    // ── 1. Test the connection ─────────────────────────────────────────────
    let testConn: mongoose.Connection | null = null;
    try {
      testConn = await mongoose
        .createConnection(uri, {
          serverSelectionTimeoutMS: 10000,
          connectTimeoutMS: 10000,
          family: 4, // Force IPv4 — avoids IPv6 resolution issues on Windows
        })
        .asPromise();

      await testConn.db!.command({ ping: 1 });
    } catch (err: any) {
      logger.error("User DB connection test failed", { error: err.message });
      return {
        status: 422,
        body: {
          error: "Could not connect to database",
          detail: err.message,
        },
      };
    } finally {
      if (testConn) await testConn.close();
    }

    // ── 2. Persist encrypted URI ───────────────────────────────────────────
    const UserDbConnection = getUserDbModel();

    let storedUri: string;
    try {
      storedUri = encrypt(uri);
    } catch {
      logger.warn("ENCRYPTION_KEY not set — storing URI without encryption.");
      storedUri = uri;
    }

    await UserDbConnection.findOneAndUpdate(
      { ownerId },
      {
        ownerId,
        encryptedUri: storedUri,
        label: label || "My Database",
        status: "connected",
        connectedAt: new Date(),
      },
      { upsert: true, new: true },
    );

    logger.info("User DB connected", { ownerId });

    return {
      status: 200,
      body: {
        ok: true,
        label: label || "My Database",
        uriMasked: maskUri(uri),
      },
    };
  } catch (err: any) {
    return {
      status: 422,
      body: { error: "Connection failed", detail: err.message },
    };
  }
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function maskUri(uri: string): string {
  try {
    const url = new URL(uri);
    if (url.password) url.password = "••••••••";
    if (url.username) url.username = url.username.charAt(0) + "•••";
    return url.toString();
  } catch {
    return uri.slice(0, 12) + "••••••••" + uri.slice(-8);
  }
}

function getUserDbModel() {
  if (mongoose.connection.models["UserDbConnection"]) {
    return mongoose.connection.models["UserDbConnection"];
  }
  const schema = new mongoose.Schema(
    {
      ownerId: { type: String, required: true, unique: true },
      encryptedUri: { type: String, required: true },
      label: { type: String, default: "My Database" },
      status: { type: String, default: "connected" },
      connectedAt: { type: Date },
    },
    { timestamps: true },
  );
  return mongoose.connection.model("UserDbConnection", schema);
}
