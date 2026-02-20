// src/jobs/redis.ts
import IORedis from "ioredis";

export const redis = new IORedis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

redis.on("error", (e) => console.error("[redis] error", e));
