import nodemailer, { type Transporter } from "nodemailer";

const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";
const EMAIL_TIMEOUT_MS = 15_000;
const DEFAULT_FROM = "no-reply@spims.local";

type EmailProviderName = "smtp" | "brevo" | "json";

let smtpTransporter: Transporter | null = null;
let jsonTransporter: Transporter | null = null;

/**
 * Resolves the active transport.
 *
 * An explicit `EMAIL_PROVIDER` wins. Otherwise an existing SMTP deployment
 * keeps using SMTP even if a Brevo key is present, so upgrades are opt-in.
 */
function resolveProvider(): EmailProviderName {
  const configured = process.env.EMAIL_PROVIDER?.trim().toLowerCase();

  if (configured === "smtp" || configured === "brevo" || configured === "json") {
    return configured;
  }

  if (process.env.SMTP_HOST) {
    return "smtp";
  }
  if (process.env.BREVO_API_KEY) {
    return "brevo";
  }
  return "json";
}

function getFromAddress(): string {
  return (
    process.env.EMAIL_FROM ||
    process.env.SMTP_FROM ||
    process.env.SMTP_USER ||
    DEFAULT_FROM
  ).trim();
}

function getFromName(): string {
  return (process.env.EMAIL_FROM_NAME || "SPIMS").trim() || "SPIMS";
}

function getSmtpTransporter(): Transporter {
  if (smtpTransporter) {
    return smtpTransporter;
  }

  const host = process.env.SMTP_HOST;
  if (!host) {
    throw new Error("SMTP_HOST is not configured");
  }

  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  smtpTransporter = nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === "true",
    // Bound every phase so a wedged SMTP server cannot hold a notification
    // row in flight indefinitely.
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
    ...(smtpUser && smtpPass
      ? { auth: { user: smtpUser, pass: smtpPass } }
      : {}),
  });

  return smtpTransporter;
}

function getJsonTransporter(): Transporter {
  if (!jsonTransporter) {
    jsonTransporter = nodemailer.createTransport({ jsonTransport: true });
  }
  return jsonTransporter;
}

/**
 * Production must deliver real email. Without a configured provider the
 * JSON transport reports success while writing nothing, so fail fast at boot
 * instead of marking notifications Sent.
 */
export function assertEmailConfig(): void {
  if (process.env.NODE_ENV !== "production") {
    return;
  }

  const provider = resolveProvider();

  if (provider === "json") {
    throw new Error(
      "The JSON email transport is not allowed in production; set EMAIL_PROVIDER=brevo with BREVO_API_KEY, or configure SMTP_HOST",
    );
  }

  if (provider === "brevo") {
    if (!process.env.BREVO_API_KEY) {
      throw new Error(
        "BREVO_API_KEY is not configured for EMAIL_PROVIDER=brevo",
      );
    }
    if (!process.env.EMAIL_FROM && !process.env.SMTP_FROM) {
      throw new Error("EMAIL_FROM is required when EMAIL_PROVIDER=brevo");
    }
  }

  if (provider === "smtp" && !process.env.SMTP_HOST) {
    throw new Error(
      "SMTP_HOST is not configured; refusing to run in production with the JSON email transport",
    );
  }
}

export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

interface BrevoEmailResponse {
  messageId?: string;
}

function extractBrevoError(body: string): string {
  try {
    const parsed: unknown = JSON.parse(body);
    if (
      parsed &&
      typeof parsed === "object" &&
      "message" in parsed &&
      typeof (parsed as { message?: unknown }).message === "string"
    ) {
      return (parsed as { message: string }).message.slice(0, 300);
    }
  } catch {
    // Fall back to the raw body when the provider does not return JSON.
  }

  return body.slice(0, 300);
}

async function sendViaBrevo(message: EmailMessage): Promise<BrevoEmailResponse> {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    throw new Error("BREVO_API_KEY is not configured");
  }

  const from = getFromAddress();
  if (from === DEFAULT_FROM) {
    throw new Error("EMAIL_FROM must be a verified Brevo sender");
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), EMAIL_TIMEOUT_MS);

  try {
    const response = await fetch(BREVO_API_URL, {
      method: "POST",
      headers: {
        accept: "application/json",
        "api-key": apiKey,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        sender: { name: getFromName(), email: from },
        to: [{ email: message.to }],
        subject: message.subject,
        textContent: message.text,
        ...(message.html ? { htmlContent: message.html } : {}),
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new Error(
        `Brevo email API failed (${response.status}): ${extractBrevoError(body)}`,
      );
    }

    return (await response.json().catch(() => ({}))) as BrevoEmailResponse;
  } finally {
    clearTimeout(timer);
  }
}

export async function sendEmail(message: EmailMessage): Promise<unknown> {
  const provider = resolveProvider();

  if (provider === "brevo") {
    return sendViaBrevo(message);
  }

  if (provider === "smtp") {
    return getSmtpTransporter().sendMail({
      from: `${getFromName()} <${getFromAddress()}>`,
      ...message,
    });
  }

  const info = await getJsonTransporter().sendMail({
    from: `${getFromName()} <${getFromAddress()}>`,
    ...message,
  });

  console.info(
    `[Email:dev] ${message.subject} -> ${message.to}\n${message.text}`,
  );

  return info;
}
