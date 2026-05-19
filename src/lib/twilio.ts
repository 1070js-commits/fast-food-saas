import twilio from "twilio";

let cachedClient: ReturnType<typeof twilio> | null = null;

function getClient() {
  if (cachedClient) return cachedClient;
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) throw new Error("Identifiants Twilio manquants");
  cachedClient = twilio(sid, token);
  return cachedClient;
}

export async function sendSms(opts: {
  to: string;        // E.164, ex : +33612345678
  body: string;
}): Promise<{ sid: string }> {
  const from = process.env.TWILIO_FROM_NUMBER;
  if (!from) throw new Error("TWILIO_FROM_NUMBER manquant");

  const client = getClient();
  const msg = await client.messages.create({
    to: opts.to,
    from,
    body: opts.body,
  });
  return { sid: msg.sid };
}

export function buildTrackingUrl(token: string) {
  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return `${base.replace(/\/$/, "")}/track/${token}`;
}

export function smsTemplate(opts: {
  ticketNumber: string;
  restaurantName: string;
  trackingUrl: string;
}) {
  return (
    `Bonjour, votre commande ${opts.ticketNumber} chez ${opts.restaurantName} ` +
    `est confirmée. Suivez-la en direct : ${opts.trackingUrl}`
  );
}
