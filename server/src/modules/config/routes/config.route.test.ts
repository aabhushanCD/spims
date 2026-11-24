import { afterEach, describe, expect, it } from "vitest";
import express from "express";
import request from "supertest";

import { DEFAULT_REPORTING_TIME_ZONE } from "../../../config/reporting.config.ts";
import router from "./config.route.ts";

const app = express();
app.use("/", router);

const originalTimeZone = process.env.REPORTING_TIMEZONE;

afterEach(() => {
  if (originalTimeZone === undefined) {
    delete process.env.REPORTING_TIMEZONE;
  } else {
    process.env.REPORTING_TIMEZONE = originalTimeZone;
  }
});

describe("GET /config", () => {
  it("exposes the default reporting timezone without authentication", async () => {
    delete process.env.REPORTING_TIMEZONE;

    const response = await request(app).get("/");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      reportingTimeZone: DEFAULT_REPORTING_TIME_ZONE,
    });
  });

  it("reflects a configured reporting timezone", async () => {
    process.env.REPORTING_TIMEZONE = "UTC";

    const response = await request(app).get("/");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ reportingTimeZone: "UTC" });
  });
});
