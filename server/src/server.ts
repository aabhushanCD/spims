import "./config/env.ts";
import http from "http";
import WebSocket, { WebSocketServer } from "ws";
import { connectDB } from "./config/db.config.js";
import { createApp } from "./app/createApp.ts";
import { verifyJwt } from "./shared/middleware/verifyJwt.ts";
import { register } from "./shared/provider/websocker.provider.ts";
import { scheduleExpiryCheckJob } from "./modules/backgroundJobs/jobs/expiryCheck.job.ts";
import { scheduleReorderCalculationJob } from "./modules/backgroundJobs/jobs/reorderCalculation.job.ts";
import { scheduleNotificationRetryJob } from "./modules/backgroundJobs/jobs/notificationRetry.job.ts";
import redis from "./config/redis.config.ts";
import { assertAuthConfig } from "./modules/auth/utils/authConfig.ts";
import { assertEmailConfig } from "./shared/provider/email.provider.ts";
import { assertReportingConfig } from "./config/reporting.config.ts";
import { assertVatConfig } from "./config/vat.config.ts";
import { logger } from "./shared/logger.ts";
import { isOriginAllowed } from "./shared/utils/allowedOrigins.ts";
import { isSessionAccessTokenRevoked } from "./shared/security/sessionRevocation.ts";
import { getCurrentTokenVersion } from "./shared/security/tokenVersion.ts";

const app = createApp();
const server = http.createServer(app);
const wss = new WebSocketServer({ noServer: true });

server.on("upgrade", async (request, socket, head) => {
  const url = new URL(request.url ?? "", `http://${request.headers.host}`);
  if (url.pathname !== "/ws") {
    socket.destroy();
    return;
  }
  if (!isOriginAllowed(request.headers.origin)) {
    socket.write("HTTP/1.1 403 Forbidden\r\n\r\n");
    socket.destroy();
    return;
  }
  const cookies = parseCookies(request.headers.cookie ?? "");
  const token = cookies["token"];
  if (!token) {
    socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
    socket.destroy();
    return;
  }

  let userId: string;
  try {
    const payload = verifyJwt(token);
    userId = payload.userId;

    if (
      payload.sessionId &&
      (await isSessionAccessTokenRevoked(payload.sessionId))
    ) {
      socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
      socket.destroy();
      return;
    }

    if (typeof payload.ver === "number") {
      const currentVersion = await getCurrentTokenVersion(payload.userId);
      if (currentVersion === null || currentVersion !== payload.ver) {
        socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
        socket.destroy();
        return;
      }
    }
  } catch {
    socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
    socket.destroy();
    return;
  }

  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit("connection", ws, request, userId);
  });
});

wss.on("connection", (ws: WebSocket, _request: Request, userId: string) => {
  register(userId, ws);
});

function parseCookies(cookieHeader: string): Record<string, string> {
  return Object.fromEntries(
    cookieHeader
      .split(";")
      .map((pair) => pair.trim())
      .filter(Boolean)
      .map((pair) => {
        const [key, ...rest] = pair.split("=");
        return [key, decodeURIComponent(rest.join("="))];
      }),
  );
}

const PORT = process.env.PORT || 3000;
async function startServer() {
  try {
    assertAuthConfig();
    assertEmailConfig();
    assertReportingConfig();
    assertVatConfig();
    await redis.ping();
    await connectDB();
    scheduleExpiryCheckJob();
    scheduleReorderCalculationJob();
    scheduleNotificationRetryJob();
    server.listen(PORT, () => {
      logger.info("server_started", { port: PORT });
    });
  } catch (error) {
    logger.error("server_start_failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    process.exit(1);
  }
}

startServer();
