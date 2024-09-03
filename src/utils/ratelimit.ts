import { RateLimiterMemory } from "rate-limiter-flexible";

export const authRateLimiter: RateLimiterMemory = new RateLimiterMemory({
  points: 5, // 5 requests
  duration: 60, // per 1 minute
});
