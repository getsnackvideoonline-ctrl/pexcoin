import Stripe from "stripe";
import { StripeSync, runMigrations } from "stripe-replit-sync";

let stripeSyncInstance: StripeSync | null = null;

async function getStripeCredentials(): Promise<{ secretKey: string; databaseUrl: string }> {
  const connectorHostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const replIdentity = process.env.REPL_IDENTITY;
  const webReplRenewal = process.env.WEB_REPL_RENEWAL;
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL environment variable is required");
  }

  if (connectorHostname && replIdentity) {
    try {
      const tokenResponse = await fetch(
        `https://${connectorHostname}/v1/repl/token`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            replIdentity,
            webReplRenewal,
          }),
        }
      );
      const tokenData = (await tokenResponse.json()) as { token: string };

      const credsResponse = await fetch(
        `https://${connectorHostname}/v1/connectors/ccfg_stripe_01K611P4YQR0SZM11XFRQJC44Y/credentials`,
        {
          headers: { Authorization: `Bearer ${tokenData.token}` },
        }
      );
      const creds = (await credsResponse.json()) as { stripe_secret_key?: string };
      if (creds.stripe_secret_key) {
        return { secretKey: creds.stripe_secret_key, databaseUrl };
      }
    } catch {
      // fall through to env var
    }
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY environment variable is required. Please connect your Stripe account.");
  }

  return { secretKey, databaseUrl };
}

export async function getUncachableStripeClient(): Promise<Stripe> {
  const { secretKey } = await getStripeCredentials();
  return new Stripe(secretKey, { apiVersion: "2024-12-18.acacia" });
}

export async function getStripeSync(): Promise<StripeSync> {
  const { secretKey, databaseUrl } = await getStripeCredentials();

  stripeSyncInstance = new StripeSync({
    stripeSecretKey: secretKey,
    databaseUrl,
  });

  return stripeSyncInstance;
}

export async function initializeStripe(): Promise<void> {
  const { databaseUrl } = await getStripeCredentials();

  await runMigrations({ databaseUrl, schema: "stripe" });

  const sync = await getStripeSync();

  const webhookBaseUrl = `https://${process.env.REPLIT_DOMAINS?.split(",")[0]}`;
  await sync.findOrCreateManagedWebhook(`${webhookBaseUrl}/api/stripe/webhook`);

  sync.syncBackfill().catch((err: unknown) => {
    console.error("Stripe backfill error:", err);
  });
}
