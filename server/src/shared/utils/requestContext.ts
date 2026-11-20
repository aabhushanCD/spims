import type { Request } from "express";
import { UAParser } from "ua-parser-js";

export interface RequestContext {
  ip: string;
  userAgent: string;
  device: string;
  browser: string;
  os: string;
  location: string;
}

function firstHeaderValue(
  value: string | string[] | undefined,
): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

function normalizeIp(ip: string | undefined): string {
  if (!ip) {
    return "Unknown";
  }

  const first = ip.split(",")[0]?.trim();
  if (!first) {
    return "Unknown";
  }

  return first.replace(/^::ffff:/, "");
}

export function getClientIp(req: Request): string {
  const forwarded = firstHeaderValue(req.headers["x-forwarded-for"]);
  const realIp = firstHeaderValue(req.headers["x-real-ip"]);

  // Express derives req.ip from X-Forwarded-For only when trust proxy is
  // enabled. That keeps rate-limit keys from being trivially spoofable when
  // the app is exposed directly. Set TRUST_PROXY behind a real proxy.
  return normalizeIp(req.ip ?? forwarded ?? realIp);
}

function getLocation(req: Request): string {
  const city =
    firstHeaderValue(req.headers["cf-ipcity"]) ??
    firstHeaderValue(req.headers["x-vercel-ip-city"]);
  const region =
    firstHeaderValue(req.headers["cf-region"]) ??
    firstHeaderValue(req.headers["x-vercel-ip-country-region"]);
  const country =
    firstHeaderValue(req.headers["cf-ipcountry"]) ??
    firstHeaderValue(req.headers["x-vercel-ip-country"]);

  const parts = [city, region, country].filter(
    (part): part is string => typeof part === "string" && part.length > 0,
  );

  return parts.length > 0 ? parts.join(", ") : "Unknown";
}

function titleCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function extractRequestContext(req: Request): RequestContext {
  const userAgent = req.headers["user-agent"] ?? "";
  const parsed = new UAParser(userAgent).getResult();

  const browser = parsed.browser.name ?? "Unknown browser";
  const os = parsed.os.name ?? "Unknown OS";
  const deviceModel = [parsed.device.vendor, parsed.device.model]
    .filter((part): part is string => Boolean(part))
    .join(" ");
  const device =
    deviceModel.length > 0
      ? deviceModel
      : parsed.device.type
        ? titleCase(parsed.device.type)
        : `${browser} on ${os}`;

  return {
    ip: getClientIp(req),
    userAgent,
    device,
    browser,
    os,
    location: getLocation(req),
  };
}
