import nodemailer, { type Transporter } from "nodemailer";

let transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (transporter) {
    return transporter;
  }

  const host = process.env.SMTP_HOST;

  if (!host) {
    // Never call Ethereal or any external service at import time. In local
    // development the JSON transport keeps messages in-process and we log
    // them below so reset/verification links remain usable.
    transporter = nodemailer.createTransport({ jsonTransport: true });
    return transporter;
  }

  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  transporter = nodemailer.createTransport({
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

  return transporter;
}

/**
 * Production must deliver real email. Without SMTP_HOST the provider falls
 * back to nodemailer's JSON transport, which reports success while writing
 * nothing, so fail fast at boot instead of marking notifications Sent.
 */
export function assertEmailConfig(): void {
  if (process.env.NODE_ENV === "production" && !process.env.SMTP_HOST) {
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

export async function sendEmail(message: EmailMessage) {
  const info = await getTransporter().sendMail({
    from:
      process.env.SMTP_FROM ||
      process.env.SMTP_USER ||
      "no-reply@spims.local",
    ...message,
  });

  if (!process.env.SMTP_HOST) {
    console.info(
      `[Email:dev] ${message.subject} -> ${message.to}\n${message.text}`,
    );
  }

  return info;
}
