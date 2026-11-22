import rateLimit from "express-rate-limit";

/**
 * Baseline API rate limit. Auth endpoints have tighter per-action limits; this
 * protects every authenticated module from unbounded request floods.
 */
export const apiRateLimiter = rateLimit({
  windowMs: 60_000,
  limit: 300,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    success: false,
    code: "RATE_LIMITED",
    message: "Too many requests. Please try again later.",
  },
});
