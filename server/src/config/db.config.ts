import "./env.ts";
import mongoose from "mongoose";
import { logger } from "../shared/logger.ts";

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI as string);
    logger.info("mongodb_connected", { host: conn.connection.host });
  } catch (error) {
    logger.error("mongodb_connection_failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    process.exit(1);
  }
};
