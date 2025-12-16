// lib/redis.ts
import Redis from "ioredis";

const redisUrl = process.env.REDIS_URL || "redis://127.0.0.1:6379";

// Publisher (for publishing logs)
export const redisPub = new Redis(redisUrl);

// Subscriber (shared across SSE endpoints — we'll subscribe/unsubscribe per-request)
export const redisSub = new Redis(redisUrl);

// Optional: simple helper to publish
export async function publishLog(executionId: string, payload: any) {
  const channel = `wf:${executionId}`;
  await redisPub.publish(channel, JSON.stringify(payload));
}
