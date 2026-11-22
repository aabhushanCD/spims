import express, { type Request, type Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import swaggerUi from "swagger-ui-express";
import mongoose from "mongoose";
import appRoutes from "../modules/app.routes.ts";
import redis from "../config/redis.config.ts";
import { errorHandler } from "../shared/middleware/globalError.middleware.ts";
import { requestLogger } from "../shared/middleware/requestLogger.ts";
import { csrfProtection } from "../shared/middleware/csrf.middleware.ts";
import { getAllowedOrigins } from "../shared/utils/allowedOrigins.ts";
import { verifyToken } from "../shared/middleware/verifyToken.ts";
import { authorize } from "../shared/middleware/authorize.ts";
import { apiRateLimiter } from "../shared/middleware/apiRateLimit.middleware.ts";
import { swaggerSpec } from "../docs/index.ts";

export interface ReadinessProbes {
  mongo: () => Promise<boolean>;
  redis: () => Promise<boolean>;
}

export const defaultReadinessProbes: ReadinessProbes = {
  async mongo(): Promise<boolean> {
    if (mongoose.connection.readyState !== 1) {
      return false;
    }
    const db = mongoose.connection.db;
    if (!db) {
      return false;
    }
    const result = await db.admin().ping();
    return result.ok === 1;
  },

  async redis(): Promise<boolean> {
    return (await redis.ping()) === "PONG";
  },
};

async function probeWithTimeout(
  probe: () => Promise<boolean>,
  timeoutMs = 2000,
): Promise<boolean> {
  return Promise.race([
    probe(),
    new Promise<boolean>((resolve) => {
      setTimeout(() => resolve(false), timeoutMs);
    }),
  ]);
}

export function createApp(
  probes: ReadinessProbes = defaultReadinessProbes,
): express.Express {
  const app = express();

  const trustProxy = process.env.TRUST_PROXY;
  if (trustProxy === "true") {
    app.set("trust proxy", 1);
  } else if (trustProxy && /^\d+$/.test(trustProxy)) {
    app.set("trust proxy", Number(trustProxy));
  }

  const allowedOrigins = getAllowedOrigins();

  // The API returns JSON and does not render HTML, so a page CSP would add no
  // protection while breaking Swagger/static clients. The remaining Helmet
  // headers (nosniff, frameguard, HSTS, referrer policy, etc.) still apply.
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'none'"],
          baseUri: ["'none'"],
          frameAncestors: ["'none'"],
          imgSrc: ["'self'", "data:"],
          // Swagger UI injects its bootstrap script/style inline.
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
        },
      },
      crossOriginResourcePolicy: { policy: "cross-origin" },
    }),
  );

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(null, false);
        }
      },
      credentials: true,
    }),
  );
  app.use(cookieParser());
  app.use(csrfProtection);
  app.use(express.json());
  app.use(requestLogger);

  app.get("/health", (_req: Request, res: Response) => {
    res.send("Server is healthy");
  });

  app.get("/ready", async (_req: Request, res: Response) => {
    const [mongo, redisReady] = await Promise.allSettled([
      probeWithTimeout(probes.mongo),
      probeWithTimeout(probes.redis),
    ]);
    const checks = {
      mongo: mongo.status === "fulfilled" && mongo.value,
      redis: redisReady.status === "fulfilled" && redisReady.value,
    };
    const ready = checks.mongo && checks.redis;
    res.status(ready ? 200 : 503).json({
      status: ready ? "ready" : "not_ready",
      checks,
    });
  });

  const docsEnabled =
    process.env.NODE_ENV !== "production" ||
    process.env.ENABLE_API_DOCS === "true";

  if (docsEnabled) {
    const docsRouter = express.Router();
    docsRouter.use(apiRateLimiter);

    // In production the docs are opt-in and owner-only. Outside production they
    // stay open for local development and Swagger UI experiments.
    if (process.env.NODE_ENV === "production") {
      docsRouter.use(verifyToken, authorize(["owner"]));
    }

    docsRouter.get("/openapi.json", (_req: Request, res: Response) => {
      res.json(swaggerSpec);
    });
    docsRouter.use(
      swaggerUi.serve,
      swaggerUi.setup(swaggerSpec, {
        customSiteTitle: "SPIMS API",
        swaggerOptions: {
          persistAuthorization: true,
          withCredentials: true,
        },
      }),
    );

    app.use("/api-docs", docsRouter);
  }

  app.use("/api", appRoutes);

  app.use((_req: Request, res: Response) => {
    res.status(404).json({ message: "Route not found" });
  });

  app.use(errorHandler);

  return app;
}
