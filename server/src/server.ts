import express, { type Request, type Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { connectDB } from "./config/db.config.js";
import appRoutes from "./modules/app.routes.js";
import http from "http";
import dotenv from "dotenv";
import WebSocket, { WebSocketServer } from "ws";
import { verifyJwt } from "./shared/middleware/verifyJwt.ts";
import { register } from "./shared/provider/websocker.provider.ts";
import { scheduleExpiryCheckJob } from "./modules/backgroundJobs/jobs/expiryCheck.job.ts";
import { scheduleReorderCalculationJob } from "./modules/backgroundJobs/jobs/reorderCalculation.job.ts";
import redis from "./config/redis.config.ts";
import { errorHandler } from "./shared/middleware/globalError.middleware.ts";

dotenv.config();
const app = express();

let allowedOrigins: string[];
try {
  allowedOrigins = process.env.ALLOWED_ORIGINS
    ? JSON.parse(process.env.ALLOWED_ORIGINS)
    : ["http://localhost:5173", "http://localhost:5174"];
} catch (err) {
  console.error("Invalid ALLOWED_ORIGINS JSON, falling back to defaults");
  allowedOrigins = ["http://localhost:5173", "http://localhost:5174"];
}
app.use(
  cors({
    origin: (origin, callback) => {
      if (allowedOrigins.includes(origin || "")) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  }),
);
app.use(cookieParser());
app.use(express.json());

app.get("/health", (req: Request, res: Response) => {
  res.send("Server is healthy");
});

app.use("/api", appRoutes);

app.use((req: Request, res: Response) => {
  res.status(404).json({ message: "Route not found" });
});

app.use(errorHandler);
const server = http.createServer(app);
const wss = new WebSocketServer({ noServer: true });

server.on("upgrade", (request, socket, head) => {
  const url = new URL(request.url ?? "", `http://${request.headers.host}`);
  if (url.pathname !== "/ws") {
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
  } catch (error) {
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
    await redis.ping();
    await connectDB();
    scheduleExpiryCheckJob();
    scheduleReorderCalculationJob();
    server.listen(PORT,  () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
