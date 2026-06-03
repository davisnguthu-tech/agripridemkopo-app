// Africa's Talking SMS helper
import { logger } from "./logger";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const AfricasTalking = require("africastalking");

const at = AfricasTalking({
  apiKey: process.env.AT_API_KEY,
  username: process.env.AT_USERNAME,
});

const sms = at.SMS;

export async function sendSms(to: string, message: string): Promise<void> {
  try {
    await sms.send({ to: [to], message, from: "AgriPride" });
    logger.info({ to }, "SMS sent via Africa's Talking");
  } catch (err) {
    logger.error({ err, to }, "Failed to send SMS");
  }
}
