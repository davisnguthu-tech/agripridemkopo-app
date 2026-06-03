import axios from "axios";
import { logger } from "./logger";

const CONSUMER_KEY = process.env.MPESA_CONSUMER_KEY!;
const CONSUMER_SECRET = process.env.MPESA_CONSUMER_SECRET!;
const SANDBOX_BASE = "https://sandbox.safaricom.co.ke";
const SHORTCODE = "174379";
const PASSKEY = "bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919";

async function getAccessToken(): Promise<string> {
  const credentials = Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString("base64");
  const resp = await axios.get(`${SANDBOX_BASE}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: { Authorization: `Basic ${credentials}` },
  });
  return resp.data.access_token;
}

function timestamp(): string {
  return new Date().toISOString().replace(/[-:T.Z]/g, "").slice(0, 14);
}

function password(ts: string): string {
  return Buffer.from(`${SHORTCODE}${PASSKEY}${ts}`).toString("base64");
}

export async function stkPush(phone: string, amount: number, accountRef: string, description: string) {
  const token = await getAccessToken();
  const ts = timestamp();
  const callbackUrl = `https://${process.env.REPLIT_DEV_DOMAIN}/api/mpesa/stk-callback`;

  const resp = await axios.post(
    `${SANDBOX_BASE}/mpesa/stkpush/v1/processrequest`,
    {
      BusinessShortCode: SHORTCODE,
      Password: password(ts),
      Timestamp: ts,
      TransactionType: "CustomerPayBillOnline",
      Amount: Math.ceil(amount),
      PartyA: phone.replace("+", ""),
      PartyB: SHORTCODE,
      PhoneNumber: phone.replace("+", ""),
      CallBackURL: callbackUrl,
      AccountReference: accountRef,
      TransactionDesc: description,
    },
    { headers: { Authorization: `Bearer ${token}` } },
  );
  return resp.data;
}

export async function b2cDisbursement(phone: string, amount: number, remarks: string) {
  const token = await getAccessToken();
  const callbackUrl = `https://${process.env.REPLIT_DEV_DOMAIN}/api/mpesa/b2c-callback`;

  const resp = await axios.post(
    `${SANDBOX_BASE}/mpesa/b2c/v3/paymentrequest`,
    {
      OriginatorConversationID: `agripride-${Date.now()}`,
      InitiatorName: "testapi",
      SecurityCredential: "Safaricom999!",
      CommandID: "BusinessPayment",
      Amount: Math.ceil(amount),
      PartyA: SHORTCODE,
      PartyB: phone.replace("+", ""),
      Remarks: remarks,
      QueueTimeOutURL: callbackUrl,
      ResultURL: callbackUrl,
      Occassion: "Loan Disbursement",
    },
    { headers: { Authorization: `Bearer ${token}` } },
  );
  logger.info({ phone, amount }, "M-Pesa B2C disbursement initiated");
  return resp.data;
}
