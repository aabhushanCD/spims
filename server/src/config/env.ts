import dotenv from "dotenv";

/**
 * Load `.env` once, before any module reads process.env at import time.
 * Every config module that reads env at module scope imports this first.
 */
dotenv.config();
