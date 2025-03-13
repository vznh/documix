import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

export const redis = new Redis({
  url: process.env.NEXT_PUBLIC_REDIS_REST_URL,
  token: process.env.NEXT_PUBLIC_REDIS_REST_TOKEN,
});

export const limiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "10m"),
  analytics: true,
});
