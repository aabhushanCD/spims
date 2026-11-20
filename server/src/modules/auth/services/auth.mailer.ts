import { sendEmail } from "../../../shared/provider/email.provider.ts";
import {
  getEmailVerificationTtlMs,
  getPasswordResetTtlMs,
} from "../utils/authConfig.ts";

export interface VerificationEmailInput {
  to: string;
  name: string;
  url: string;
}

export interface PasswordResetEmailInput {
  to: string;
  name: string;
  url: string;
}

export interface AuthMailer {
  sendVerificationEmail(input: VerificationEmailInput): Promise<void>;
  sendPasswordResetEmail(input: PasswordResetEmailInput): Promise<void>;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function emailLayout(options: {
  title: string;
  intro: string;
  buttonLabel: string;
  url: string;
  footer: string;
}): string {
  const safeUrl = escapeHtml(options.url);

  return `
  <div style="margin:0;padding:32px;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
    <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:20px;padding:36px;border:1px solid #e2e8f0;">
      <div style="display:inline-block;background:#059669;color:#ffffff;border-radius:12px;padding:10px 14px;font-size:18px;font-weight:700;">SPIMS</div>
      <h1 style="font-size:24px;margin:28px 0 12px;">${escapeHtml(options.title)}</h1>
      <p style="font-size:15px;line-height:1.6;color:#475569;margin:0 0 24px;">${escapeHtml(options.intro)}</p>
      <a href="${safeUrl}" style="display:inline-block;background:#059669;color:#ffffff;text-decoration:none;padding:14px 22px;border-radius:12px;font-weight:600;">${escapeHtml(options.buttonLabel)}</a>
      <p style="font-size:13px;line-height:1.6;color:#64748b;margin:24px 0 0;">If the button does not work, copy this link into your browser:</p>
      <p style="font-size:13px;line-height:1.6;color:#0f172a;word-break:break-all;margin:8px 0 0;">${safeUrl}</p>
      <hr style="border:none;border-top:1px solid #e2e8f0;margin:28px 0;" />
      <p style="font-size:12px;line-height:1.6;color:#94a3b8;margin:0;">${escapeHtml(options.footer)}</p>
    </div>
  </div>`;
}

export const authMailer: AuthMailer = {
  async sendVerificationEmail(input) {
    const expiryHours = Math.max(
      1,
      Math.round(getEmailVerificationTtlMs() / 3_600_000),
    );

    await sendEmail({
      to: input.to,
      subject: "Verify your SPIMS email address",
      text: `Hello ${input.name},\n\nVerify your SPIMS account by opening this link:\n${input.url}\n\nThis link expires in ${expiryHours} hour(s). If you did not create an account, you can ignore this email.`,
      html: emailLayout({
        title: `Welcome, ${input.name}`,
        intro: `Confirm your email address to activate your SPIMS account. This link expires in ${expiryHours} hour(s).`,
        buttonLabel: "Verify email",
        url: input.url,
        footer:
          "If you did not create a SPIMS account, you can safely ignore this email.",
      }),
    });
  },

  async sendPasswordResetEmail(input) {
    const expiryMinutes = Math.max(
      1,
      Math.round(getPasswordResetTtlMs() / 60_000),
    );

    await sendEmail({
      to: input.to,
      subject: "Reset your SPIMS password",
      text: `Hello ${input.name},\n\nReset your SPIMS password by opening this link:\n${input.url}\n\nThis link expires in ${expiryMinutes} minutes and can be used once. If you did not request a reset, you can ignore this email.`,
      html: emailLayout({
        title: "Reset your password",
        intro: `We received a request to reset your SPIMS password. This link expires in ${expiryMinutes} minutes and can be used once.`,
        buttonLabel: "Reset password",
        url: input.url,
        footer:
          "If you did not request a password reset, no action is required. Your password has not changed.",
      }),
    });
  },
};

export function createAuthMailer(): AuthMailer {
  return authMailer;
}
