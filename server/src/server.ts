import express, { type Request, type Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { connectDB } from "./config/db.config.js";
import appRoutes from "./modules/app.routes.js";
import dotenv from "dotenv";
dotenv.config();
const app = express();

app.use(cors());
app.use(cookieParser());
app.use(express.json());

app.get("/health", (req: Request, res: Response) => {
  res.send("Server is healthy");
});

app.use("/api", appRoutes);

app.use((req: Request, res: Response) => {
  res.status(404).json({ message: "Route not found" });
});

const PORT = process.env.PORT || 3000;
async function startServer() {
  try {
    await connectDB(); // Ensure the database is connected before starting the server
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
