import "../config/env.ts";

import { sendEmail } from "../shared/provider/email.provider.ts";

const recipient = process.argv[2]?.trim();

async function run(): Promise<void> {
  if (!recipient) {
    console.error("Usage: npm run email:test -- <recipient@example.com>");
    process.exitCode = 1;
    return;
  }

  try {
    await sendEmail({
      to: recipient,
      subject: "SPIMS email test",
      text: "If you received this message, SPIMS email delivery is configured correctly.",
    });
    console.log(`Email sent to ${recipient}.`);
  } catch (error) {
    console.error(
      "Email delivery failed:",
      error instanceof Error ? error.message : error,
    );
    process.exitCode = 1;
  }
}

void run();
