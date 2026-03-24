import Redis from "ioredis";
const redisUrl = process.env.REDIS_URL || "redis://127.0.0.1:6379";

let _pub: Redis | null = null;

function getPub() {
  if (!_pub) _pub = new Redis(redisUrl, { lazyConnect: true });
  return _pub;
}

export async function publishLog(executionId: string, payload: any) {
  await getPub().publish(`wf:${executionId}`, JSON.stringify(payload));
}
