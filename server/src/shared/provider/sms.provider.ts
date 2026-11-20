export class NonRetryableDeliveryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NonRetryableDeliveryError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export interface SmsMessage {
  to: string;
  message: string;
}

const SMS_TIMEOUT_MS = 5_000;
const MAX_ERROR_BODY_LENGTH = 300;

export async function sendSms(message: SmsMessage): Promise<void> {
  const webhookUrl = process.env.SMS_WEBHOOK_URL;
  if (!webhookUrl) {
    throw new NonRetryableDeliveryError("SMS_WEBHOOK_URL is not configured");
  }

  const apiKey = process.env.SMS_API_KEY;
  const headers: Record<string, string> = {
    "content-type": "application/json",
  };
  if (apiKey) {
    headers.authorization = `Bearer ${apiKey}`;
  }

  let response: Response;
  try {
    response = await fetch(webhookUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({ to: message.to, message: message.message }),
      signal: AbortSignal.timeout(SMS_TIMEOUT_MS),
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(`SMS webhook request failed: ${detail}`, { cause: error });
  }

  if (!response.ok) {
    let body = "";
    try {
      body = (await response.text()).slice(0, MAX_ERROR_BODY_LENGTH);
    } catch {
      // A provider that omits a readable body still failed; keep the status.
    }
    throw new Error(
      `SMS webhook returned HTTP ${response.status}${body ? `: ${body}` : ""}`,
    );
  }
}
